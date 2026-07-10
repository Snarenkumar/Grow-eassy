"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react";
import { MappingVisual } from "./MappingVisual";
import { cn } from "@/lib/utils";

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  error: string | null;
}

export function UploadStep({ onFileSelected, error }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        onFileSelected(file); // let parent validate & surface a consistent error
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="animate-fade-up space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={cn(
          "group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-colors",
          isDragging
            ? "border-accent bg-accent-soft"
            : "border-border-strong bg-surface hover:border-accent hover:bg-accent-soft/40"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-ink transition-transform group-hover:scale-105">
          <UploadCloud className="h-6 w-6" strokeWidth={1.75} />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-ink">
          Drop your CSV here, or click to browse
        </p>
        <p className="mt-1.5 text-sm text-ink-muted">
          Facebook Lead Ads, Google Ads exports, Excel sheets, real-estate CRM
          dumps — any layout works.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-paper px-3 py-1 text-xs font-mono text-ink-faint">
          <FileSpreadsheet className="h-3.5 w-3.5" />
          .csv only, up to 10MB
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-xs font-mono uppercase tracking-wide text-ink-faint">
          How the mapping works
        </p>
        <p className="mt-1.5 text-sm text-ink-muted max-w-lg">
          Whatever your columns are named, the AI matches them to
          GrowEasy&apos;s CRM schema — including merging duplicate emails, phone numbers, and
          scattered notes into the right fields.
        </p>
        <div className="mt-6 overflow-x-auto">
          <MappingVisual />
        </div>
      </div>
    </div>
  );
}
