"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessingStep, type BatchProgress } from "@/components/ProcessingStep";
import type { ParsedCsv } from "@/lib/csv";
import type { CrmRecord, ExtractEvent, ExtractionSummary, SkippedRow } from "@/lib/types";
import { Loader2 } from "lucide-react";

const BATCH_SIZE = 20;

export default function ProcessPage() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchProgress[]>([]);
  const [processedRows, setProcessedRows] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    const rawData = sessionStorage.getItem("groweasy_parsed_csv");
    if (!rawData) { router.replace("/import"); return; }
    try {
      setParsed(JSON.parse(rawData));
    } catch {
      router.replace("/import");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (!parsed || hasStarted.current) return;
    hasStarted.current = true;

    const totalBatches = Math.ceil(parsed.rows.length / BATCH_SIZE);
    setBatches(
      Array.from({ length: totalBatches }, (_, i) => ({
        batch: i + 1,
        status: "pending" as const,
      }))
    );

    runExtraction(parsed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed]);

  const runExtraction = async (p: ParsedCsv) => {
    const allRecords: CrmRecord[] = [];
    const allSkipped: SkippedRow[] = [];

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: p.rows }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ message: "Unknown error" }));
        // Store error and navigate to results anyway
        sessionStorage.setItem("groweasy_results", JSON.stringify({
          records: [], skipped: [], summary: { totalRows: p.rows.length, totalImported: 0, totalSkipped: p.rows.length },
          error: err.message,
        }));
        router.push("/import/results");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event: ExtractEvent = JSON.parse(line);
            handleEvent(event, allRecords, allSkipped, p.rows.length);
          } catch { /* skip malformed lines */ }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      sessionStorage.setItem("groweasy_results", JSON.stringify({
        records: [], skipped: [], summary: { totalRows: p.rows.length, totalImported: 0, totalSkipped: p.rows.length },
        error: msg,
      }));
      router.push("/import/results");
    }
  };

  const handleEvent = (
    event: ExtractEvent,
    allRecords: CrmRecord[],
    allSkipped: SkippedRow[],
    totalRows: number
  ) => {
    switch (event.type) {
      case "batch_start":
        setBatches((prev) =>
          prev.map((b) => b.batch === event.batch ? { ...b, status: "running" } : b)
        );
        break;
      case "batch_retry":
        setBatches((prev) =>
          prev.map((b) => b.batch === event.batch ? { ...b, status: "retrying", attempt: event.attempt } : b)
        );
        break;
      case "batch_done":
        allRecords.push(...event.imported);
        allSkipped.push(...event.skipped);
        setBatches((prev) =>
          prev.map((b) => b.batch === event.batch ? { ...b, status: "done" } : b)
        );
        setProcessedRows((prev) => prev + event.imported.length + event.skipped.length);
        break;
      case "batch_failed":
        allSkipped.push(...event.skipped);
        setBatches((prev) =>
          prev.map((b) => b.batch === event.batch ? { ...b, status: "failed" } : b)
        );
        setProcessedRows((prev) => prev + event.skipped.length);
        break;
      case "complete": {
        const summary: ExtractionSummary = event.summary;
        sessionStorage.setItem("groweasy_results", JSON.stringify({
          records: allRecords,
          skipped: allSkipped,
          summary,
        }));
        router.push("/import/results");
        break;
      }
      case "error":
        sessionStorage.setItem("groweasy_results", JSON.stringify({
          records: [], skipped: [], summary: { totalRows, totalImported: 0, totalSkipped: totalRows },
          error: event.message,
        }));
        router.push("/import/results");
        break;
    }
  };

  if (loading || !parsed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
        <span>Initialising extraction engine...</span>
      </div>
    );
  }

  return (
    <ProcessingStep
      totalBatches={batches.length}
      batches={batches}
      processedRows={processedRows}
      totalRows={parsed.rows.length}
    />
  );
}
