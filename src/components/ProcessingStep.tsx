"use client";

import { Loader2, CheckCircle2, RotateCw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BatchProgress {
  batch: number;
  status: "pending" | "running" | "retrying" | "done" | "failed";
  attempt?: number;
}

interface ProcessingStepProps {
  totalBatches: number;
  batches: BatchProgress[];
  processedRows: number;
  totalRows: number;
}

export function ProcessingStep({
  totalBatches,
  batches,
  processedRows,
  totalRows,
}: ProcessingStepProps) {
  const pct = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-6">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-center justify-between mb-2">
          <p className="font-display text-lg font-semibold text-ink">
            Mapping your leads…
          </p>
          <span className="font-mono text-sm text-accent-ink">{pct}%</span>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          Gemini is matching {totalRows} rows across {totalBatches} batches to
          the GrowEasy CRM schema.
        </p>
        <div className="h-2 w-full rounded-full bg-paper overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
        <p className="text-xs font-mono uppercase tracking-wide text-ink-faint mb-3">
          Batch status
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {batches.map((b) => (
            <div
              key={b.batch}
              title={`Batch ${b.batch}: ${b.status}`}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-[10px] font-mono transition-colors",
                b.status === "done" &&
                  "border-success/20 bg-success-soft text-success",
                b.status === "failed" &&
                  "border-danger/20 bg-danger-soft text-danger",
                (b.status === "running" || b.status === "retrying") &&
                  "border-accent-line bg-accent-soft text-accent-ink",
                b.status === "pending" &&
                  "border-border bg-paper text-ink-faint"
              )}
            >
              {b.status === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {b.status === "failed" && <XCircle className="h-3.5 w-3.5" />}
              {b.status === "running" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {b.status === "retrying" && (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              )}
              {b.status === "pending" && (
                <div className="h-3.5 w-3.5 rounded-full border border-current" />
              )}
              #{b.batch}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
