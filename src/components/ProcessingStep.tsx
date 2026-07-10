"use client";

import { Loader2, CheckCircle2, RotateCw, XCircle, Sparkles } from "lucide-react";
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
      {/* Processing Status Card */}
      <div className="relative rounded-2xl border border-border bg-surface p-6 sm:p-8 overflow-hidden shadow-md">
        {/* Neon pulse overlay */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-accent via-emerald-500 to-accent animate-pulse" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <p className="font-display font-bold text-lg text-ink">Mapping your leads...</p>
              <p className="text-xs text-ink-muted mt-0.5">
                Gemini is matching {totalRows.toLocaleString()} rows across {totalBatches} batches.
              </p>
            </div>
          </div>
          <span className="font-mono text-lg font-bold text-accent text-right sm:text-left">{pct}%</span>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-3 w-full rounded-full bg-paper overflow-hidden relative shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-ink-faint font-mono">
          <span>{processedRows} / {totalRows} leads completed</span>
          <span>1 batch processed sequentially</span>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-faint bg-paper px-2 py-0.5 rounded">Batch Status Logs</span>
          <span className="text-xs text-ink-muted">Free-tier rate optimization active</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {batches.map((b) => (
            <div
              key={b.batch}
              title={`Batch ${b.batch}: ${b.status}`}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3.5 text-[11px] font-mono font-bold transition-all duration-300 relative overflow-hidden",
                b.status === "done" &&
                  "border-success/20 bg-success-soft text-success shadow-sm",
                b.status === "failed" &&
                  "border-danger/20 bg-danger-soft text-danger shadow-sm",
                (b.status === "running" || b.status === "retrying") &&
                  "border-accent/40 bg-accent-soft text-accent ring-2 ring-accent/20 animate-pulse",
                b.status === "pending" &&
                  "border-border bg-paper text-ink-faint hover:border-border-strong"
              )}
            >
              {b.status === "done" && <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />}
              {b.status === "failed" && <XCircle className="h-4.5 w-4.5 shrink-0 animate-bounce" />}
              {b.status === "running" && (
                <Loader2 className="h-4.5 w-4.5 animate-spin text-accent" />
              )}
              {b.status === "retrying" && (
                <div className="flex flex-col items-center gap-1">
                  <RotateCw className="h-4.5 w-4.5 animate-spin text-warning" />
                  <span className="text-[8px] uppercase tracking-wider text-warning font-bold">Try #{b.attempt}</span>
                </div>
              )}
              {b.status === "pending" && (
                <div className="h-4.5 w-4.5 rounded-full border-2 border-dashed border-ink-faint/40" />
              )}
              <span className="text-xs opacity-90 mt-1">Batch #{b.batch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
