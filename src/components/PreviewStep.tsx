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
    <div className="animate-fade-up space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-ink text-sm">{fileName}</p>
            <p className="text-xs text-ink-muted font-mono">
              {parsed.rows.length} rows · {parsed.headers.length} columns
              {parsed.rows.length > 100 && ` · showing first 100`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5" /> Choose different file
          </Button>
          <Button size="sm" onClick={onConfirm}>
            <Sparkles className="h-3.5 w-3.5" /> Confirm &amp; run AI mapping
          </Button>
        </div>
      </div>

      {parsed.errors.length > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning-soft px-4 py-2.5 text-xs text-warning font-mono">
          {parsed.errors.length} parsing warning
          {parsed.errors.length > 1 ? "s" : ""} — rows with issues will still
          be sent for mapping.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="max-h-[60vh] overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="sticky left-0 z-20 bg-paper border-b border-r border-border px-3 py-2.5 text-left text-xs font-mono font-medium text-ink-faint w-12">
                  #
                </th>
                {parsed.headers.map((h) => (
                  <th
                    key={h}
                    className="bg-paper border-b border-border px-4 py-2.5 text-left text-xs font-mono font-medium text-ink-muted whitespace-nowrap"
                  >
                    {h || "(blank)"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, i) => (
                <tr key={i} className="hover:bg-paper/60 transition-colors">
                  <td className="sticky left-0 bg-surface border-r border-b border-border px-3 py-2 text-xs font-mono text-ink-faint">
                    {i + 1}
                  </td>
                  {parsed.headers.map((h) => (
                    <td
                      key={h}
                      className="border-b border-border px-4 py-2 text-ink whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis"
                      title={row[h]}
                    >
                      {row[h] || (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-ink-faint text-center">
        No AI processing happens until you confirm.
      </p>
    </div>
  );
}
