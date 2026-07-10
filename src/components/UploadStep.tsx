"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, ChevronRight, HelpCircle } from "lucide-react";
import { MappingVisual } from "./MappingVisual";
import { cn } from "@/lib/utils";

interface UploadStepProps {
  onFileSelected: (file: File) => void;
  error: string | null;
}

const SCHEMA_EXPLAINER = [
  { field: "name", title: "Lead Name", desc: "Customer's full name. Handles trailing/leading spaces, capitalizes automatically." },
  { field: "email", title: "Email Address", desc: "Primary contact email. Multiple emails in one cell are parsed: the first is saved as primary, extras go to CRM notes." },
  { field: "mobile_without_country_code", title: "Mobile Number", desc: "Clean digits-only mobile. Strip spaces, brackets, or dashes. Alt phone numbers are saved to CRM notes." },
  { field: "crm_status", title: "Lead Status", desc: "Maps status keywords to strictly one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE." },
  { field: "data_source", title: "Campaign Source", desc: "Identifies campaign sources confidently: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots." },
  { field: "crm_note", title: "CRM notes & remarks", desc: "Catch-all bucket. Collects extra contact channels, follow-up times, and remarks, separated by ' | '." }
];

export function UploadStep({ onFileSelected, error }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
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
      {/* Upload Box */}
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
          "group relative cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all duration-300 overflow-hidden",
          isDragging
            ? "border-accent bg-accent-soft/50 ring-4 ring-accent/10 shadow-[0_0_30px_rgba(52,82,225,0.15)]"
            : "border-border-strong bg-surface hover:border-accent hover:bg-accent-soft/20 shadow-sm hover:shadow-md"
        )}
      >
        {/* Soft glowing ambient circle behind upload icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
        
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
          <UploadCloud className="h-7 w-7" strokeWidth={2} />
        </div>
        <p className="mt-5 font-display text-xl font-bold text-ink tracking-tight">
          Drop your CSV here, or click to browse
        </p>
        <p className="mt-2 text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
          Facebook Lead Ads, Google Ads exports, Excel sheets, real-estate CRM dumps — any layout mapped instantly.
        </p>
        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-paper/50 px-3.5 py-1 text-xs font-mono text-ink-muted">
          <FileSpreadsheet className="h-3.5 w-3.5 text-ink-faint" />
          .csv only · up to 10MB
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger shadow-sm animate-fade-up">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Explainer and Schema Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Mapping Engine Panel */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-ink-faint bg-paper px-2 py-0.5 rounded">Visualizer</span>
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
            </div>
            <h3 className="mt-2 font-display font-bold text-lg text-ink">Intelligent Mapping Flow</h3>
            <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
              No need to rearrange or rename headers. Our AI mapping engine matches raw CSV fields dynamically onto canonical CRM properties.
            </p>
          </div>
          <div className="mt-8 overflow-x-auto">
            <MappingVisual />
          </div>
        </div>

        {/* Interactive Schema Explorer */}
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col shadow-sm">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-ink-faint bg-paper px-2 py-0.5 rounded">Interactive Schema</span>
            <h3 className="mt-2 font-display font-bold text-lg text-ink">Target CRM Fields</h3>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              Learn how target fields are parsed and standardized by the AI engine.
            </p>
          </div>
          
          <div className="mt-6 flex-1 space-y-2.5 max-h-[300px] lg:max-h-[360px] overflow-y-auto pr-1">
            {SCHEMA_EXPLAINER.map((item, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "group p-3 rounded-xl border transition-all duration-200 cursor-help",
                  hoveredField === item.field
                    ? "border-accent bg-accent-soft/30 shadow-sm"
                    : "border-border bg-paper/20 hover:border-accent-line hover:bg-paper/40"
                )}
                onMouseEnter={() => setHoveredField(item.field)}
                onMouseLeave={() => setHoveredField(null)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-accent-ink group-hover:text-accent transition-colors">{item.field}</span>
                  <HelpCircle className="h-3 w-3 text-ink-faint opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[11px] font-semibold text-ink mt-0.5">{item.title}</p>
                <p className="text-[10px] text-ink-muted mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
