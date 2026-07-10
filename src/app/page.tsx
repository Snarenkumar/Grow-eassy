"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Sun, Moon, Download, ChevronDown, CheckCircle, FileSpreadsheet, ArrowRight, Eye } from "lucide-react";
import { StepIndicator } from "@/components/StepIndicator";
import { UploadStep } from "@/components/UploadStep";
import { PreviewStep } from "@/components/PreviewStep";
import { ProcessingStep, type BatchProgress } from "@/components/ProcessingStep";
import { ResultsStep } from "@/components/ResultsStep";
import { parseCsvFile, type ParsedCsv } from "@/lib/csv";
import type { CrmRecord, ExtractEvent, ExtractionSummary, SkippedRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "upload" | "preview" | "processing" | "results";

const BATCH_SIZE = 20;

const FAQS = [
  {
    q: "How does the AI map arbitrary CSV columns to GrowEasy CRM?",
    a: "The system reads your CSV headers and rows, translating synonyms like 'Mail ID' or 'Primary Contact Email' directly into 'email'. It also standardizes phone numbers (adding '+91' where needed) and aggregates comments/remarks from unmapped fields into CRM notes."
  },
  {
    q: "Are my CSV files stored anywhere?",
    a: "No! The importer is entirely stateless. Your CSV files are parsed client-side using PapaParse, and sent securely in temporary batches to the Gemini API. We do not store any lead records on our backend databases."
  },
  {
    q: "Is there a limit on the number of CSV rows I can upload?",
    a: "You can import files up to 10MB. To ensure high speed and API stability, rows are parsed and processed in concurrent batches of 20 leads at a time, complete with automatic retry mechanisms for rate limits."
  },
  {
    q: "What formatting does the CRM require for fields?",
    a: "The CRM requires standardized ISO dates, digits-only mobile numbers, and strict status values (GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE). The AI maps and normalizes them automatically."
  }
];

const WALKTHROUGH_STEPS = [
  {
    step: "01",
    title: "Upload Leads",
    desc: "Drag & drop or select any CSV file from Facebook, Google Ads, or custom sheets. Maximum file size is 10MB."
  },
  {
    step: "02",
    title: "Preview Raw Data",
    desc: "Verify your headers, row count, and parsing details in our responsive client-side preview table before mapping."
  },
  {
    step: "03",
    title: "AI Batch Mapping",
    desc: "The system groups leads and streams them to Gemini 2.0. Status, phones, emails, and notes are mapped automatically."
  },
  {
    step: "04",
    title: "Edit & Download",
    desc: "Examine parsed leads, double-click to edit values directly, resolve skipped rows, and export clean CRM-compatible CSVs."
  }
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [batches, setBatches] = useState<BatchProgress[]>([]);
  const [processedRows, setProcessedRows] = useState(0);

  const [records, setRecords] = useState<CrmRecord[]>([]);
  const [skipped, setSkipped] = useState<SkippedRow[]>([]);
  const [summary, setSummary] = useState<ExtractionSummary | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const [isDark, setIsDark] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const rowsPerBatchRef = useRef(BATCH_SIZE);

  // Manage Dark Mode Theme
  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains("dark") || 
      localStorage.getItem("theme") === "dark" || 
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (isDarkTheme) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleFileSelected = useCallback(async (file: File) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please upload a .csv file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File is larger than 10MB. Please split it first.");
      return;
    }
    try {
      const result = await parseCsvFile(file);
      if (result.rows.length === 0) {
        setUploadError("This CSV has no data rows.");
        return;
      }
      setFileName(file.name);
      setParsed(result);
      setStage("preview");
    } catch {
      setUploadError("Couldn't parse that file. Please check it's a valid CSV.");
    }
  }, []);

  const reset = useCallback(() => {
    setStage("upload");
    setParsed(null);
    setFileName("");
    setUploadError(null);
    setRecords([]);
    setSkipped([]);
    setSummary(null);
    setBatches([]);
    setProcessedRows(0);
    setProcessingError(null);
  }, []);

  const runExtraction = useCallback(async () => {
    if (!parsed) return;
    setStage("processing");
    setProcessingError(null);

    const totalBatches = Math.ceil(parsed.rows.length / rowsPerBatchRef.current);
    setBatches(
      Array.from({ length: totalBatches }, (_, i) => ({
        batch: i + 1,
        status: "pending" as const,
      }))
    );
    setProcessedRows(0);

    const allRecords: CrmRecord[] = [];
    const allSkipped: SkippedRow[] = [];

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Server responded ${res.status}`);
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
          const event = JSON.parse(line) as ExtractEvent;
          handleEvent(event);
        }
      }
      if (buffer.trim()) {
        handleEvent(JSON.parse(buffer) as ExtractEvent);
      }
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : String(err));
      setStage("preview");
      return;
    }

    function handleEvent(event: ExtractEvent) {
      switch (event.type) {
        case "batch_start":
          setBatches((prev) =>
            prev.map((b) =>
              b.batch === event.batch ? { ...b, status: "running" } : b
            )
          );
          break;
        case "batch_retry":
          setBatches((prev) =>
            prev.map((b) =>
              b.batch === event.batch
                ? { ...b, status: "retrying", attempt: event.attempt }
                : b
            )
          );
          break;
        case "batch_done":
          allRecords.push(...event.imported);
          allSkipped.push(...event.skipped);
          setProcessedRows(
            (prev) => prev + event.imported.length + event.skipped.length
          );
          setBatches((prev) =>
            prev.map((b) =>
              b.batch === event.batch ? { ...b, status: "done" } : b
            )
          );
          break;
        case "batch_failed":
          allSkipped.push(...event.skipped);
          setProcessedRows((prev) => prev + event.skipped.length);
          setBatches((prev) =>
            prev.map((b) =>
              b.batch === event.batch ? { ...b, status: "failed" } : b
            )
          );
          break;
        case "complete":
          setRecords(allRecords);
          setSkipped(allSkipped);
          setSummary(event.summary);
          setStage("results");
          break;
        case "error":
          setProcessingError(event.message);
          setStage("preview");
          break;
      }
    }
  }, [parsed]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <header className="border-b border-border bg-surface/85 backdrop-blur sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white shadow-md">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="font-display font-bold text-ink text-base tracking-tight leading-tight">
                GrowEasy CSV Importer
              </p>
              <p className="text-[11px] text-ink-faint leading-tight mt-0.5">
                AI CRM Field Mapper
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StepIndicator
              current={
                stage === "upload"
                  ? 1
                  : stage === "preview"
                  ? 2
                  : stage === "processing"
                  ? 3
                  : 4
              }
            />
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg border border-border bg-surface hover:bg-paper text-ink-muted transition-all hover:scale-105"
              aria-label="Toggle theme mode"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Step Container */}
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8">
          {stage === "upload" && (
            <UploadStep onFileSelected={handleFileSelected} error={uploadError} />
          )}

          {stage === "preview" && parsed && (
            <div className="space-y-4">
              {processingError && (
                <div className="rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger animate-bounce">
                  Extraction failed: {processingError}. You can try again below.
                </div>
              )}
              <PreviewStep
                parsed={parsed}
                fileName={fileName}
                onConfirm={runExtraction}
                onReset={reset}
              />
            </div>
          )}

          {stage === "processing" && (
            <ProcessingStep
              totalBatches={batches.length}
              batches={batches}
              processedRows={processedRows}
              totalRows={parsed?.rows.length ?? 0}
            />
          )}

          {stage === "results" && summary && (
            <ResultsStep
              records={records}
              skipped={skipped}
              summary={summary}
              fileName={fileName}
              onStartOver={reset}
            />
          )}
        </div>

        {/* Walkthrough, Download Templates, & FAQs - only visible in upload stage */}
        {stage === "upload" && (
          <div className="mt-12 space-y-12">
            {/* Quick Test Template download */}
            <div className="rounded-2xl border border-accent/20 bg-accent-soft/20 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-accent" /> Need a file to test the importer?
                </h3>
                <p className="text-sm text-ink-muted max-w-2xl">
                  Download our pre-built test CSV file containing messy columns, out-of-order fields, duplicate contacts, and missing values to see how the AI resolves them cleanly.
                </p>
              </div>
              <a
                href="/groweasy-test-leads.csv"
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-white px-5 py-3 text-sm font-semibold hover:bg-accent-ink transition-colors shadow-md hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Download className="h-4 w-4" /> Download Test CSV
              </a>
            </div>

            {/* Interactive Step Explainer */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="font-display text-2xl font-bold text-ink">How the AI CSV Importer Works</h2>
                <p className="text-sm text-ink-muted mt-1.5">
                  A simplified breakdown of how we map variable Excel or CSV exports into clean CRM lead contacts.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {WALKTHROUGH_STEPS.map((step, idx) => (
                  <div key={idx} className="relative rounded-2xl border border-border bg-surface p-5 hover:border-accent-line transition-all hover:shadow-sm">
                    <span className="font-mono text-3xl font-bold text-accent/20 block mb-2">{step.step}</span>
                    <h4 className="font-display font-bold text-ink text-base">{step.title}</h4>
                    <p className="text-xs text-ink-muted mt-2 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ section */}
            <div className="border-t border-border pt-10 space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="font-display text-2xl font-bold text-ink">Frequently Asked Questions</h2>
                <p className="text-sm text-ink-muted mt-1.5">
                  Common queries answered for Search Engines (AEO) and users alike.
                </p>
              </div>
              <div className="max-w-3xl mx-auto space-y-3">
                {FAQS.map((faq, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-surface overflow-hidden transition-all duration-200">
                    <button
                      onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-ink hover:bg-paper/40 transition-colors"
                    >
                      <span className="text-[15px]">{faq.q}</span>
                      <ChevronDown className={cn("h-4 w-4 text-ink-faint transition-transform duration-200", faqOpen === idx && "rotate-180")} />
                    </button>
                    {faqOpen === idx && (
                      <div className="px-5 pb-4 pt-1.5 text-sm text-ink-muted leading-relaxed border-t border-border/40 bg-paper/10">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-ink-faint bg-surface">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>Built for the GrowEasy Software Developer Assignment.</p>
          <div className="flex gap-4">
            <a href="/llms.txt" className="hover:text-accent font-mono">llms.txt</a>
            <a href="/sitemap.xml" className="hover:text-accent font-mono">sitemap</a>
            <a href="https://groweasy.ai" target="_blank" rel="noopener noreferrer" className="hover:text-accent font-semibold">groweasy.ai</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
