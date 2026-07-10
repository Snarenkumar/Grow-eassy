"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ResultsStep } from "@/components/ResultsStep";
import type { CrmRecord, ExtractionSummary, SkippedRow } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";

interface StoredResults {
  records: CrmRecord[];
  skipped: SkippedRow[];
  summary: ExtractionSummary;
  error?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<StoredResults | null>(null);
  const [fileName, setFileName] = useState("leads");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("groweasy_results");
    const name = sessionStorage.getItem("groweasy_filename");
    if (!raw) { router.replace("/import"); return; }
    try {
      setData(JSON.parse(raw));
      if (name) setFileName(name);
    } catch {
      router.replace("/import");
    }
    setLoading(false);
  }, [router]);

  const handleStartOver = () => {
    sessionStorage.removeItem("groweasy_parsed_csv");
    sessionStorage.removeItem("groweasy_filename");
    sessionStorage.removeItem("groweasy_results");
    router.replace("/import");
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
        <span>Loading results...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-danger bg-danger-soft text-danger">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="font-display font-black text-xl uppercase text-ink">Extraction Failed</h2>
        <p className="text-sm text-ink-muted font-mono max-w-md">{data.error}</p>
        <button
          onClick={handleStartOver}
          className="mt-2 px-6 py-2.5 rounded-lg bg-accent text-accent-ink text-sm font-black uppercase tracking-wider hover:opacity-90 transition-all"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <ResultsStep
      records={data.records}
      skipped={data.skipped}
      summary={data.summary}
      fileName={fileName}
      onStartOver={handleStartOver}
    />
  );
}
