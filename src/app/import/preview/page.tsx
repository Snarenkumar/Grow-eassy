"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewStep } from "@/components/PreviewStep";
import type { ParsedCsv } from "@/lib/csv";
import { Loader2 } from "lucide-react";

export default function PreviewPage() {
  const router = useRouter();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawData = sessionStorage.getItem("groweasy_parsed_csv");
    const name = sessionStorage.getItem("groweasy_filename");
    if (!rawData || !name) {
      router.replace("/import");
      return;
    }
    try {
      setParsed(JSON.parse(rawData));
      setFileName(name);
    } catch {
      router.replace("/import");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleConfirm = () => {
    router.push("/import/process");
  };

  const handleReset = () => {
    sessionStorage.removeItem("groweasy_parsed_csv");
    sessionStorage.removeItem("groweasy_filename");
    router.replace("/import");
  };

  if (loading || !parsed) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-mono text-ink-muted">
        <Loader2 className="h-6 w-6 animate-spin text-accent mb-2" />
        <span>Loading CSV Preview...</span>
      </div>
    );
  }

  return (
    <PreviewStep
      parsed={parsed}
      fileName={fileName}
      onConfirm={handleConfirm}
      onReset={handleReset}
    />
  );
}
