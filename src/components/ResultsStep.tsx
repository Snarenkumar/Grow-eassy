"use client";

import { useCallback, useState } from "react";
import { Download, RotateCcw, Check, Info, ShieldAlert, FileJson, Pencil } from "lucide-react";
import { Button } from "./ui/Button";
import type { CrmRecord, SkippedRow, ExtractionSummary } from "@/lib/types";
import { CRM_FIELDS } from "@/lib/types";
import { downloadCsv, recordsToCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const STATUS_TEXT_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "text-accent border-accent",
  DID_NOT_CONNECT: "text-warning border-warning",
  BAD_LEAD: "text-danger border-danger",
  SALE_DONE: "text-success border-success",
};

interface ResultsStepProps {
  records: CrmRecord[];
  skipped: SkippedRow[];
  summary: ExtractionSummary;
  fileName: string;
  onStartOver: () => void;
}

export function ResultsStep({
  records: initialRecords,
  skipped,
  summary,
  fileName,
  onStartOver,
}: ResultsStepProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");
  const [records, setRecords] = useState<CrmRecord[]>(initialRecords);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof CrmRecord } | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = useCallback((rowIdx: number, field: keyof CrmRecord) => {
    setEditingCell({ row: rowIdx, field });
    setEditValue(records[rowIdx][field]);
  }, [records]);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    setRecords((prev) => {
      const next = [...prev];
      next[editingCell.row] = { ...next[editingCell.row], [editingCell.field]: editValue };
      return next;
    });
    setEditingCell(null);
  }, [editingCell, editValue]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Compute status distribution for metrics
  const statusCounts: Record<string, number> = {};
  for (const r of records) {
    const s = r.crm_status || "(empty)";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  // Auto-analysis of ingestion metrics
  const phoneCleanedCount = records.filter(
    (r) => r.mobile_without_country_code && /^\d+$/.test(r.mobile_without_country_code)
  ).length;
  
  const countryCodeCount = records.filter(
    (r) => r.country_code && r.country_code.startsWith("+")
  ).length;

  const multipleChannelsCount = records.filter(
    (r) => r.crm_note && (r.crm_note.includes("@") || r.crm_note.includes("|") || /\d{8,}/.test(r.crm_note))
  ).length;

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.csv$/i, "")}-groweasy-crm.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Math metrics
  const total = summary.totalImported + summary.totalSkipped;
  const importedPct = total > 0 ? Math.round((summary.totalImported / total) * 100) : 0;

  return (
    <div className="animate-fade-up space-y-6">
      
      {/* Flat Industrial Header Bar */}
      <div className="border-b-4 border-ink pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent bg-accent-soft px-2 py-0.5 rounded">Console Report</span>
          <h2 className="text-3xl font-display font-black uppercase text-ink mt-1 tracking-tight">Ingestion Ingest Logs</h2>
        </div>
        <div className="font-mono text-sm font-bold text-ink-muted flex flex-wrap gap-x-4 gap-y-1">
          <span>PROCESSED: <strong className="text-ink">{summary.totalRows}</strong></span>
          <span>•</span>
          <span>IMPORTED: <strong className="text-ink">{summary.totalImported}</strong></span>
          <span>•</span>
          <span>SKIPPED: <strong className="text-ink">{summary.totalSkipped}</strong></span>
          <span>•</span>
          <span>SUCCESS RATE: <strong className="text-accent">{importedPct}%</strong></span>
        </div>
      </div>

      {/* Detailed Ingestion Analysis (Moved UP above table) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border-2 border-border bg-surface flex gap-3.5 items-start rounded-xl">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-success text-success bg-success-soft/10">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[13px] font-bold text-ink uppercase tracking-wider">{phoneCleanedCount} Cleaned Numbers</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-normal">Stripped formatting, spaces, brackets, or dashes to retain raw digits.</p>
          </div>
        </div>
        
        <div className="p-4 border-2 border-border bg-surface flex gap-3.5 items-start rounded-xl">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-accent text-accent bg-accent-soft/10">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[13px] font-bold text-ink uppercase tracking-wider">{countryCodeCount} Codes Configured</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-normal">Country prefix (e.g. `+91`) added automatically where omitted.</p>
          </div>
        </div>

        <div className="p-4 border-2 border-border bg-surface flex gap-3.5 items-start rounded-xl">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ink-muted text-ink-muted bg-paper">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[13px] font-bold text-ink uppercase tracking-wider">{multipleChannelsCount} Channels Consolidated</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-normal">Secondary mobile lines and duplicate email chains safe in CRM notes.</p>
          </div>
        </div>
      </div>

      {/* Skipped Log warning Box (Moved UP above table) */}
      {skipped.length > 0 && (
        <div className="rounded-xl border-2 border-danger bg-surface p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-mono text-danger font-bold uppercase tracking-wider">
            <ShieldAlert className="h-4.5 w-4.5" />
            <span>Ingestion Skip Log ({skipped.length} lead skipped)</span>
          </div>
          <div className="space-y-1.5">
            {skipped.map((s, idx) => (
              <div key={idx} className="text-xs flex flex-col sm:flex-row sm:justify-between items-start sm:items-center bg-paper p-2.5 rounded-lg border border-border">
                <span className="font-mono text-ink-muted">Row {s.rowIndex + 1}: <strong className="text-ink">{s.row["Client Name"] || s.row["Name"] || "No Contact Info"}</strong></span>
                <span className="text-[10px] font-bold text-danger uppercase tracking-wider border border-danger/30 px-2 py-0.5 rounded bg-danger-soft/10 mt-1 sm:mt-0">{s.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4">
        <div className="flex rounded-lg border-2 border-border bg-paper p-0.5 w-fit">
          <button
            onClick={() => setTab("imported")}
            className={cn(
              "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all",
              tab === "imported" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
            )}
          >
            Imported ({records.length})
          </button>
          <button
            onClick={() => setTab("skipped")}
            className={cn(
              "px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-md transition-all",
              tab === "skipped" ? "bg-ink text-paper" : "text-ink-muted hover:text-ink"
            )}
          >
            Skipped ({skipped.length})
          </button>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onStartOver} className="rounded-lg font-mono uppercase text-xs font-bold border-2">
            <RotateCcw className="h-4 w-4" /> Start Over
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={records.length === 0}
            onClick={downloadJson}
            className="rounded-lg font-mono uppercase text-xs font-bold border-2"
          >
            Export JSON
          </Button>
          <Button
            size="sm"
            disabled={records.length === 0}
            onClick={() =>
              downloadCsv(
                `${fileName.replace(/\.csv$/i, "")}-groweasy-crm.csv`,
                recordsToCsv(records)
              )
            }
            className="rounded-lg font-mono uppercase text-xs font-bold bg-accent text-accent-ink hover:opacity-90 transition-all border-2 border-accent"
          >
            Download CRM CSV
          </Button>
        </div>
      </div>

      {tab === "imported" && records.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-ink-muted font-mono bg-paper/60 border border-border p-2 rounded-lg">
          <Pencil className="h-3 w-3 text-ink-faint shrink-0" />
          <span>Double-click any cell below to modify values inline before exporting your final database file.</span>
        </div>
      )}

      {/* Main Database Table Container */}
      {tab === "imported" ? (
        <div className="rounded-xl border-2 border-border bg-surface overflow-hidden shadow-sm">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b-2 border-border bg-paper sticky top-0 z-10 font-mono font-bold uppercase">
                  <th className="sticky left-0 z-20 bg-paper border-r border-border px-3.5 py-3 text-left text-ink-faint w-12">
                    #
                  </th>
                  {CRM_FIELDS.map((f) => (
                    <th
                      key={f}
                      className="border-b border-border px-4 py-3 text-left text-ink-muted whitespace-nowrap"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-paper/40 transition-colors duration-100 group border-b border-border">
                    <td className="sticky left-0 bg-surface border-r border-border px-3.5 py-2.5 font-mono font-bold text-ink-faint text-center">
                      {i + 1}
                    </td>
                    {CRM_FIELDS.map((f) => {
                      const isEditing = editingCell?.row === i && editingCell?.field === f;
                      return (
                        <td
                          key={f}
                          className={cn(
                            "px-4 py-2.5 text-ink whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis font-mono cursor-pointer relative transition-all border-r border-border last:border-r-0",
                            isEditing && "bg-accent-soft ring-2 ring-accent ring-inset p-0"
                          )}
                          title={isEditing ? undefined : r[f]}
                          onDoubleClick={() => !isEditing && startEdit(i, f)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full h-full px-3 py-2 font-mono text-xs bg-transparent text-ink outline-none border-none"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                          ) : f === "crm_status" && r[f] ? (
                            <div className="flex items-center justify-between">
                              <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded border tracking-wider", STATUS_TEXT_COLORS[r[f]] ?? "text-ink-muted border-border")}>
                                {r[f]}
                              </span>
                              <Pencil className="h-3 w-3 text-ink-faint opacity-0 group-hover:opacity-60 transition-opacity ml-1.5 shrink-0" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span>{r[f] || <span className="text-ink-faint/60 italic">—</span>}</span>
                              <Pencil className="h-3 w-3 text-ink-faint opacity-0 group-hover:opacity-60 transition-opacity ml-1.5 shrink-0" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && (
              <EmptyState message="No records were imported from this file." />
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-border bg-surface overflow-hidden shadow-sm">
          <div className="max-h-[60vh] overflow-auto font-mono text-xs">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border bg-paper sticky top-0 z-10 font-bold uppercase">
                  <th className="border-r border-border px-5 py-3 text-left text-ink-faint w-16">
                    Row
                  </th>
                  <th className="border-r border-border px-5 py-3 text-left text-ink-muted">
                    Reason skipped
                  </th>
                  <th className="px-5 py-3 text-left text-ink-muted">
                    Raw row data preview
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i} className="hover:bg-paper/40 transition-colors duration-100 border-b border-border">
                    <td className="border-r border-border px-5 py-2.5 font-bold text-ink-faint">
                      {s.rowIndex + 1}
                    </td>
                    <td className="border-r border-border px-5 py-2.5 text-danger font-bold uppercase text-[11px] tracking-wide">
                      {s.reason}
                    </td>
                    <td className="px-5 py-2.5 text-ink-muted whitespace-nowrap max-w-[420px] overflow-hidden text-ellipsis">
                      {JSON.stringify(s.row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {skipped.length === 0 && (
              <EmptyState message="Nothing was skipped — every row had an email or phone number." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <p className="text-sm font-mono text-ink-muted max-w-xs">{message}</p>
    </div>
  );
}
