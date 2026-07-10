"use client";

import { FileSpreadsheet, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";
import type { ParsedCsv } from "@/lib/csv";

interface PreviewStepProps {
  parsed: ParsedCsv;
  fileName: string;
  onConfirm: () => void;
  onReset: () => void;
}

export function PreviewStep({
  parsed,
  fileName,
  onConfirm,
  onReset,
}: PreviewStepProps) {
  const previewRows = parsed.rows.slice(0, 100);

  return (
    <div className="animate-fade-up space-y-6">
      {/* File Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border border-border bg-surface/50 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent shadow-inner">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <p className="font-display font-bold text-ink text-base tracking-tight">{fileName}</p>
            <p className="text-xs text-ink-muted font-mono mt-0.5">
              {parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns
              {parsed.rows.length > 100 && ` · displaying first 100`}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" size="sm" onClick={onReset} className="rounded-xl">
            <RotateCcw className="h-4 w-4" /> Change File
          </Button>
          <Button size="sm" onClick={onConfirm} className="rounded-xl shadow-lg hover:shadow-accent/25 hover:scale-[1.02] transition-all">
            <Sparkles className="h-4 w-4 animate-spin-slow" /> Map with Gemini AI
          </Button>
        </div>
      </div>

      {parsed.errors.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning-soft px-4 py-3 text-xs text-warning font-mono shadow-sm flex items-start gap-2 animate-fade-up">
          <span className="font-bold uppercase tracking-wider shrink-0 mt-0.5">[Warning]</span>
          <span>
            {parsed.errors.length} parsing warning{parsed.errors.length > 1 ? "s" : ""} detected. Rows with parsing warnings will still be sent for mapping, and AI will clean up anomalies.
          </span>
        </div>
      )}

      {/* Preview Table */}
      <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full border-collapse text-[13px] leading-normal">
            <thead>
              <tr className="border-b border-border bg-paper/60 backdrop-blur sticky top-0 z-10">
                <th className="sticky left-0 z-20 bg-paper/85 border-b border-r border-border px-3.5 py-3 text-left text-xs font-mono font-bold text-ink-faint w-12 shadow-sm">
                  #
                </th>
                {parsed.headers.map((h) => (
                  <th
                    key={h}
                    className="border-b border-border px-5 py-3 text-left text-xs font-mono font-bold text-ink-muted tracking-tight whitespace-nowrap shadow-sm"
                  >
                    {h || "(blank)"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-paper/30 transition-colors duration-150">
                  <td className="sticky left-0 bg-surface/90 border-r border-b border-border px-3.5 py-2.5 text-xs font-mono font-semibold text-ink-faint text-center shadow-sm">
                    {i + 1}
                  </td>
                  {parsed.headers.map((h) => (
                    <td
                      key={h}
                      className="border-b border-border px-5 py-2.5 text-ink whitespace-nowrap max-w-[260px] overflow-hidden text-ellipsis font-mono text-xs"
                      title={row[h]}
                    >
                      {row[h] || (
                        <span className="text-ink-faint/60 italic select-none">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-ink-faint">
        <div className="h-1.5 w-1.5 rounded-full bg-accent-line" />
        <span>Lead records are parsed client-side. No AI processing occurs until you run mapping.</span>
      </div>
    </div>
  );
}
