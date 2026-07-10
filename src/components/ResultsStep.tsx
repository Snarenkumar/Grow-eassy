"use client";

import { useCallback, useState } from "react";
import { Download, RotateCcw, CheckCircle2, XCircle, ListChecks, Pencil, FileJson } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import type { CrmRecord, SkippedRow, ExtractionSummary } from "@/lib/types";
import { CRM_FIELDS, CRM_STATUS_VALUES } from "@/lib/types";
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
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={<ListChecks className="h-4 w-4" />}
          label="Total rows"
          value={summary.totalRows}
          tone="neutral"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Imported"
          value={summary.totalImported}
          tone="success"
        />
        <StatCard
          icon={<XCircle className="h-4 w-4" />}
          label="Skipped"
          value={summary.totalSkipped}
          tone="danger"
        />

        {/* Donut Chart */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 flex items-center gap-4">
          <svg width="64" height="64" viewBox="0 0 100 100" className="shrink-0">
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
              className="transition-all duration-700 ease-out"
            />
            <text x="50" y="54" textAnchor="middle" className="fill-ink" fontFamily="var(--font-mono)" fontSize="16" fontWeight="600">
              {total > 0 ? Math.round(importedPct * 100) : 0}%
            </text>
          </svg>
          <div>
            <p className="font-display text-sm font-semibold text-ink">Success Rate</p>
            <p className="text-xs text-ink-muted mt-0.5">{imported} of {total} mapped</p>
          </div>
        </div>
      </div>

      {/* Status Distribution Bar Chart */}
      {records.length > 0 && Object.keys(statusCounts).length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
          <p className="text-xs font-mono uppercase tracking-wide text-ink-faint mb-4">CRM Status Distribution</p>
          <div className="space-y-2.5">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / records.length) * 100);
              const color = STATUS_COLORS[status] || "var(--color-ink-faint)";
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-muted w-44 truncate shrink-0" title={status}>{status}</span>
                  <div className="flex-1 h-5 rounded-full bg-paper overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs font-mono text-ink-faint w-12 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab bar + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1 w-fit">
          <TabButton active={tab === "imported"} onClick={() => setTab("imported")}>
            Imported ({records.length})
          </TabButton>
          <TabButton active={tab === "skipped"} onClick={() => setTab("skipped")}>
            Skipped ({skipped.length})
          </TabButton>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onStartOver}>
            <RotateCcw className="h-3.5 w-3.5" /> Import another file
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={records.length === 0}
            onClick={downloadJson}
          >
            <FileJson className="h-3.5 w-3.5" /> Download JSON
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
          >
            <Download className="h-3.5 w-3.5" /> Download CRM CSV
          </Button>
        </div>
      </div>

      {/* Inline edit hint */}
      {tab === "imported" && records.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-ink-faint px-1">
          <Pencil className="h-3 w-3" />
          <span>Double-click any cell to edit it before downloading.</span>
        </div>
      )}

      {tab === "imported" ? (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="sticky left-0 z-20 bg-paper border-b border-r border-border px-3 py-2.5 text-left text-xs font-mono font-medium text-ink-faint w-12">
                    #
                  </th>
                  {CRM_FIELDS.map((f) => (
                    <th
                      key={f}
                      className="bg-paper border-b border-border px-4 py-2.5 text-left text-xs font-mono font-medium text-ink-muted whitespace-nowrap"
                    >
                      {f}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-paper/60 transition-colors">
                    <td className="sticky left-0 bg-surface border-r border-b border-border px-3 py-2 text-xs font-mono text-ink-faint">
                      {i + 1}
                    </td>
                    {CRM_FIELDS.map((f) => {
                      const isEditing = editingCell?.row === i && editingCell?.field === f;
                      return (
                        <td
                          key={f}
                          className={cn(
                            "border-b border-border px-4 py-2 text-ink whitespace-nowrap max-w-[220px] overflow-hidden text-ellipsis font-mono text-[13px] cursor-pointer",
                            isEditing && "bg-accent-soft ring-2 ring-accent ring-inset p-0"
                          )}
                          title={isEditing ? undefined : r[f]}
                          onDoubleClick={() => !isEditing && startEdit(i, f)}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              className="w-full h-full px-2 py-1.5 text-[13px] font-mono bg-transparent text-ink outline-none"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") cancelEdit();
                              }}
                            />
                          ) : f === "crm_status" && r[f] ? (
                            <Badge tone={STATUS_TONE[r[f]] ?? "neutral"}>
                              {r[f]}
                            </Badge>
                          ) : (
                            r[f] || <span className="text-ink-faint">—</span>
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
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="max-h-[60vh] overflow-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-paper border-b border-border px-4 py-2.5 text-left text-xs font-mono font-medium text-ink-faint w-16">
                    Row
                  </th>
                  <th className="bg-paper border-b border-border px-4 py-2.5 text-left text-xs font-mono font-medium text-ink-muted">
                    Reason skipped
                  </th>
                  <th className="bg-paper border-b border-border px-4 py-2.5 text-left text-xs font-mono font-medium text-ink-muted">
                    Raw row (preview)
                  </th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, i) => (
                  <tr key={i} className="hover:bg-paper/60 transition-colors">
                    <td className="border-b border-border px-4 py-2 text-xs font-mono text-ink-faint">
                      {s.rowIndex + 1}
                    </td>
                    <td className="border-b border-border px-4 py-2 text-sm text-danger">
                      {s.reason}
                    </td>
                    <td className="border-b border-border px-4 py-2 text-xs font-mono text-ink-muted whitespace-nowrap max-w-[420px] overflow-hidden text-ellipsis">
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
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <div
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg mb-3",
          tone === "success" && "bg-success-soft text-success",
          tone === "danger" && "bg-danger-soft text-danger",
          tone === "neutral" && "bg-accent-soft text-accent-ink"
        )}
      >
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5">{label}</p>
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
        "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <p className="text-sm text-ink-muted max-w-xs">{message}</p>
    </div>
  );
}
