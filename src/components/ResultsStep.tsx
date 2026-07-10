"use client";

import { useCallback, useState } from "react";
import { Download, RotateCcw, CheckCircle2, XCircle, ListChecks, Pencil, FileJson, Info } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import type { CrmRecord, SkippedRow, ExtractionSummary } from "@/lib/types";
import { CRM_FIELDS } from "@/lib/types";
import { downloadCsv, recordsToCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, "accent" | "success" | "warning" | "danger" | "neutral"> = {
  GOOD_LEAD_FOLLOW_UP: "accent",
  DID_NOT_CONNECT: "warning",
  BAD_LEAD: "danger",
  SALE_DONE: "success",
};

const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "var(--color-accent)",
  DID_NOT_CONNECT: "var(--color-warning)",
  BAD_LEAD: "var(--color-danger)",
  SALE_DONE: "var(--color-success)",
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

  // Compute status distribution for the bar chart
  const statusCounts: Record<string, number> = {};
  for (const r of records) {
    const s = r.crm_status || "(empty)";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

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

  // Donut chart math
  const imported = summary.totalImported;
  const skippedCount = summary.totalSkipped;
  const total = imported + skippedCount;
  const importedPct = total > 0 ? imported / total : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="animate-fade-up space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<ListChecks className="h-5 w-5" />}
          label="Total Leads Processed"
          value={summary.totalRows}
          tone="neutral"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Successfully Imported"
          value={summary.totalImported}
          tone="success"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5" />}
          label="Skipped Leads"
          value={summary.totalSkipped}
          tone="danger"
        />

        {/* Success Rate Circle Card */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex items-center gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="relative shrink-0 flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 100 100" className="shrink-0">
              <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-danger-soft)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r={radius}
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - importedPct)}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className="absolute font-mono text-xs font-bold text-ink">
              {total > 0 ? Math.round(importedPct * 100) : 0}%
            </span>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink leading-tight">Success Rate</p>
            <p className="text-[11px] text-ink-muted mt-1 leading-tight">{imported} of {total} mapped</p>
          </div>
        </div>
      </div>

      {/* Grid of status breakdown */}
      {records.length > 0 && Object.keys(statusCounts).length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-faint bg-paper px-2 py-0.5 rounded">Lead Distribution</span>
          <h3 className="mt-2 font-display font-bold text-base text-ink mb-4">CRM status mapping</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / records.length) * 100);
              const color = STATUS_COLORS[status] || "var(--color-ink-faint)";
              return (
                <div key={status} className="p-3.5 rounded-xl border border-border bg-paper/20 hover:border-accent-line transition-colors">
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="font-bold text-ink truncate w-36">{status}</span>
                    <span className="text-ink-muted">{count} leads ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-paper overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation and Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm w-fit">
          <TabButton active={tab === "imported"} onClick={() => setTab("imported")}>
            Imported ({records.length})
          </TabButton>
          <TabButton active={tab === "skipped"} onClick={() => setTab("skipped")}>
            Skipped ({skipped.length})
          </TabButton>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onStartOver} className="rounded-xl">
            <RotateCcw className="h-4 w-4" /> Start Over
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={records.length === 0}
            onClick={downloadJson}
            className="rounded-xl"
          >
            <FileJson className="h-4 w-4" /> Export JSON
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
            className="rounded-xl shadow-lg hover:shadow-accent/25 hover:scale-[1.02] transition-all"
          >
            <Download className="h-4 w-4" /> Export CRM CSV
          </Button>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      {tab === "imported" && records.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-accent-soft/30 border border-accent/10 px-4 py-2.5 text-xs text-accent-ink shadow-sm">
          <Info className="h-4 w-4 text-accent shrink-0" />
          <span>Need to tweak any data? **Double-click any cell** to edit the field inline. Changes are updated automatically.</span>
        </div>
      )}

      {/* Main Table View */}
      {tab === "imported" ? (
        <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-paper/60 backdrop-blur sticky top-0 z-10">
                  <th className="sticky left-0 z-20 bg-paper/85 border-b border-r border-border px-3.5 py-3 text-left text-xs font-mono font-bold text-ink-faint w-12 shadow-sm">
                    #
                  </th>
                  {CRM_FIELDS.map((f) => (
                    <th
                      key={f}
                      className="border-b border-border px-4 py-3 text-left text-xs font-mono font-bold text-ink-muted whitespace-nowrap shadow-sm"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-paper/30 transition-colors duration-150 group">
                    <td className="sticky left-0 bg-surface/90 border-r border-b border-border px-3.5 py-2.5 text-xs font-mono font-semibold text-ink-faint text-center shadow-sm">
                      {i + 1}
                    </td>
                    {CRM_FIELDS.map((f) => {
                      const isEditing = editingCell?.row === i && editingCell?.field === f;
                      return (
                        <td
                          key={f}
                          className={cn(
                            "border-b border-border px-4 py-2.5 text-ink whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis font-mono text-xs cursor-pointer relative transition-all",
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
                              <Badge tone={STATUS_TONE[r[f]] ?? "neutral"}>
                                {r[f]}
                              </Badge>
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
        <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border bg-paper/60 backdrop-blur sticky top-0 z-10">
                  <th className="bg-paper border-b border-border px-5 py-3 text-left text-xs font-mono font-bold text-ink-faint w-16">
                    Row
                  </th>
                  <th className="bg-paper border-b border-border px-5 py-3 text-left text-xs font-mono font-bold text-ink-muted">
                    Reason skipped
                  </th>
                  <th className="bg-paper border-b border-border px-5 py-3 text-left text-xs font-mono font-bold text-ink-muted">
                    Raw row data preview
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i} className="hover:bg-paper/30 transition-colors duration-150">
                    <td className="border-b border-border px-5 py-2.5 text-xs font-mono font-semibold text-ink-faint">
                      {s.rowIndex + 1}
                    </td>
                    <td className="border-b border-border px-5 py-2.5 text-sm text-danger font-medium">
                      {s.reason}
                    </td>
                    <td className="border-b border-border px-5 py-2.5 text-xs font-mono text-ink-muted whitespace-nowrap max-w-[420px] overflow-hidden text-ellipsis">
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

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 shadow-inner",
          tone === "success" && "bg-success-soft text-success",
          tone === "danger" && "bg-danger-soft text-danger",
          tone === "neutral" && "bg-accent-soft text-accent"
        )}
      >
        {icon}
      </div>
      <p className="font-display text-2xl font-bold text-ink leading-none">{value}</p>
      <p className="text-xs text-ink-muted mt-1.5 leading-none">{label}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200",
        active ? "bg-accent text-accent-ink shadow-sm" : "text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <p className="text-sm text-ink-muted max-w-xs">{message}</p>
    </div>
  );
}
