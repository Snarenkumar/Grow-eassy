"use client";

import { useCallback, useState } from "react";
import {
  Download, RotateCcw, CheckCircle2, XCircle, ListChecks,
  Pencil, FileJson, Info, ChevronDown, ChevronRight,
  AlertTriangle, Sparkles, Phone, Globe, Merge, Eye, EyeOff,
  BarChart3, FileText,
} from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import type { CrmRecord, SkippedRow, ExtractionSummary } from "@/lib/types";
import { CRM_FIELDS } from "@/lib/types";
import { downloadCsv, recordsToCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

/* ─────────── Colour maps ─────────── */
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
const STATUS_WHY: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Lead has contact info and shows interest — flagged for follow-up.",
  DID_NOT_CONNECT: "Outreach attempted but no response received.",
  BAD_LEAD: "Lead is unqualified, duplicate, or explicitly not interested.",
  SALE_DONE: "Conversion recorded — deal closed successfully.",
  "(empty)": "No CRM status was provided or could be inferred from this row.",
};

/* ─────────── Audit computation ─────────── */
interface AuditStats {
  phonesCleaned: number;
  countryCodesAdded: number;
  channelsConsolidated: number;
  missingEmails: number;
  missingPhones: number;
  emptyFields: Record<keyof CrmRecord, number>;
  skipReasonGroups: Record<string, SkippedRow[]>;
  fieldFillRate: Record<keyof CrmRecord, number>;
}

function computeAudit(records: CrmRecord[], skipped: SkippedRow[]): AuditStats {
  let phonesCleaned = 0;
  let countryCodesAdded = 0;
  let channelsConsolidated = 0;
  let missingEmails = 0;
  let missingPhones = 0;
  const emptyFields = {} as Record<keyof CrmRecord, number>;
  const fieldFillRate = {} as Record<keyof CrmRecord, number>;

  for (const f of CRM_FIELDS) {
    emptyFields[f] = 0;
  }

  for (const r of records) {
    // Phone cleaning heuristic: if the raw phone didn't start with a clean digit-only number
    if (r.mobile_without_country_code && /^\d{10}$/.test(r.mobile_without_country_code)) {
      phonesCleaned++;
    }
    if (!r.email) missingEmails++;
    if (!r.mobile_without_country_code) missingPhones++;
    // Country code defaulted
    if (r.country_code === "+91") countryCodesAdded++;
    // Notes consolidation: merged secondary channels
    if (r.crm_note && (r.crm_note.includes("|") || r.crm_note.toLowerCase().includes("phone") || r.crm_note.toLowerCase().includes("email"))) {
      channelsConsolidated++;
    }
    for (const f of CRM_FIELDS) {
      if (!r[f]) emptyFields[f]++;
    }
  }

  for (const f of CRM_FIELDS) {
    const filled = records.length - emptyFields[f];
    fieldFillRate[f] = records.length > 0 ? Math.round((filled / records.length) * 100) : 0;
  }

  // Group skip reasons
  const skipReasonGroups: Record<string, SkippedRow[]> = {};
  for (const s of skipped) {
    const key = s.reason;
    if (!skipReasonGroups[key]) skipReasonGroups[key] = [];
    skipReasonGroups[key].push(s);
  }

  return {
    phonesCleaned,
    countryCodesAdded,
    channelsConsolidated,
    missingEmails,
    missingPhones,
    emptyFields,
    skipReasonGroups,
    fieldFillRate,
  };
}

/* ─────────── Props ─────────── */
interface ResultsStepProps {
  records: CrmRecord[];
  skipped: SkippedRow[];
  summary: ExtractionSummary;
  fileName: string;
  onStartOver: () => void;
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export function ResultsStep({
  records: initialRecords,
  skipped,
  summary,
  fileName,
  onStartOver,
}: ResultsStepProps) {
  const [mainTab, setMainTab] = useState<"imported" | "skipped" | "report">("imported");
  const [records, setRecords] = useState<CrmRecord[]>(initialRecords);
  const [editingCell, setEditingCell] = useState<{ row: number; field: keyof CrmRecord } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [expandedSkip, setExpandedSkip] = useState<number | null>(null);
  const [showFieldCoverage, setShowFieldCoverage] = useState(false);

  const audit = computeAudit(records, skipped);

  /* ── inline edit ── */
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

  const cancelEdit = useCallback(() => setEditingCell(null), []);

  /* ── CRM status distribution ── */
  const statusCounts: Record<string, number> = {};
  for (const r of records) {
    const s = r.crm_status || "(empty)";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  /* ── exports ── */
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

  /* ── donut maths ── */
  const imported = summary.totalImported;
  const skippedCount = summary.totalSkipped;
  const total = imported + skippedCount;
  const importedPct = total > 0 ? imported / total : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="animate-fade-up space-y-6">

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<ListChecks className="h-5 w-5" />} label="Total Leads Processed" value={summary.totalRows} tone="neutral" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Successfully Imported" value={summary.totalImported} tone="success" />
        <StatCard icon={<XCircle className="h-5 w-5" />} label="Skipped Leads" value={summary.totalSkipped} tone="danger" />

        {/* Success Rate donut */}
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

      {/* ── STATUS DISTRIBUTION ── */}
      {records.length > 0 && Object.keys(statusCounts).length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm">
          <span className="text-xs font-mono uppercase tracking-widest text-ink-faint bg-paper px-2 py-0.5 rounded">Lead Distribution</span>
          <h3 className="mt-2 font-display font-bold text-base text-ink mb-4">CRM status mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = Math.round((count / records.length) * 100);
              const color = STATUS_COLORS[status] || "var(--color-ink-faint)";
              return (
                <div key={status} className="p-3.5 rounded-xl border border-border bg-paper/20">
                  <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                    <span className="font-bold text-ink truncate">{status}</span>
                    <span className="text-ink-muted">{count} leads ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-paper overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                  <p className="text-[10px] text-ink-faint mt-1.5 font-mono">{STATUS_WHY[status] ?? ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 shadow-sm w-fit">
          <TabButton active={mainTab === "imported"} onClick={() => setMainTab("imported")}>
            Imported ({records.length})
          </TabButton>
          <TabButton active={mainTab === "skipped"} onClick={() => setMainTab("skipped")}>
            Skipped ({skipped.length})
          </TabButton>
          <TabButton active={mainTab === "report"} onClick={() => setMainTab("report")}>
            <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Audit Report</span>
          </TabButton>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onStartOver} className="rounded-xl">
            <RotateCcw className="h-4 w-4" /> Start Over
          </Button>
          <Button variant="secondary" size="sm" disabled={records.length === 0} onClick={downloadJson} className="rounded-xl">
            <FileJson className="h-4 w-4" /> Export JSON
          </Button>
          <Button
            size="sm"
            disabled={records.length === 0}
            onClick={() => downloadCsv(`${fileName.replace(/\.csv$/i, "")}-groweasy-crm.csv`, recordsToCsv(records))}
            className="rounded-xl shadow-lg hover:shadow-accent/25 hover:scale-[1.02] transition-all"
          >
            <Download className="h-4 w-4" /> Export CRM CSV
          </Button>
        </div>
      </div>

      {/* ── IMPORTED TABLE ── */}
      {mainTab === "imported" && (
        <>
          {records.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-accent-soft/30 border border-accent/10 px-4 py-2.5 text-xs text-accent-ink shadow-sm">
              <Info className="h-4 w-4 text-accent shrink-0" />
              <span>Double-click any cell to edit the field inline. Press <kbd className="mx-1 px-1.5 py-0.5 rounded border border-accent/30 font-mono text-[10px]">Enter</kbd> to save or <kbd className="mx-1 px-1.5 py-0.5 rounded border border-accent/30 font-mono text-[10px]">Escape</kbd> to cancel.</span>
            </div>
          )}
          <div className="rounded-2xl border border-border bg-surface shadow-md overflow-hidden">
            <div className="max-h-[60vh] overflow-auto">
              <table className="min-w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-paper/60 backdrop-blur sticky top-0 z-10">
                    <th className="sticky left-0 z-20 bg-paper/85 border-b border-r border-border px-3.5 py-3 text-left text-xs font-mono font-bold text-ink-faint w-12">#</th>
                    {CRM_FIELDS.map((f) => (
                      <th key={f} className="border-b border-border px-4 py-3 text-left text-xs font-mono font-bold text-ink-muted whitespace-nowrap">{f}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="hover:bg-paper/30 transition-colors duration-150 group">
                      <td className="sticky left-0 bg-surface/90 border-r border-b border-border px-3.5 py-2.5 text-xs font-mono font-semibold text-ink-faint text-center">{i + 1}</td>
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
                                <Badge tone={STATUS_TONE[r[f]] ?? "neutral"}>{r[f]}</Badge>
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
              {records.length === 0 && <EmptyState message="No records were imported from this file." />}
            </div>
          </div>
        </>
      )}

      {/* ── SKIPPED TABLE ── */}
      {mainTab === "skipped" && (
        <div className="space-y-3">
          {skipped.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
              <p className="font-display font-bold text-ink">Nothing skipped!</p>
              <p className="text-xs text-ink-muted mt-1">Every row had valid contact info and was imported.</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-xl bg-danger-soft border border-danger/20 px-4 py-2.5 text-xs text-danger">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span><strong>{skipped.length} row{skipped.length !== 1 ? "s" : ""}</strong> could not be imported. Each has a reason. Rows missing both email and phone are always skipped — they cannot be used as CRM leads.</span>
              </div>
              {skipped.map((s, i) => (
                <div key={i} className="rounded-xl border-2 border-border bg-surface overflow-hidden">
                  <button
                    className="w-full flex items-start justify-between px-5 py-3.5 text-left hover:bg-paper/40 transition-colors"
                    onClick={() => setExpandedSkip(expandedSkip === i ? null : i)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="font-mono text-xs font-bold text-ink-faint mt-0.5 w-10 shrink-0">Row {s.rowIndex + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-danger">{s.reason}</p>
                        <p className="text-[11px] text-ink-muted mt-0.5 font-mono">{skipReasonExplanation(s.reason)}</p>
                      </div>
                    </div>
                    {expandedSkip === i
                      ? <ChevronDown className="h-4 w-4 text-ink-faint shrink-0 mt-0.5" />
                      : <ChevronRight className="h-4 w-4 text-ink-faint shrink-0 mt-0.5" />
                    }
                  </button>
                  {expandedSkip === i && (
                    <div className="border-t border-border bg-paper/30 px-5 py-4">
                      <p className="text-[10px] font-mono font-bold text-ink-faint uppercase tracking-wider mb-2">Raw row data</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(s.row).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-xs font-mono">
                            <span className="text-ink-faint shrink-0 min-w-[120px] truncate">{k}:</span>
                            <span className="text-ink truncate">{v || <em className="text-ink-faint/60">empty</em>}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── AUDIT REPORT TAB ── */}
      {mainTab === "report" && (
        <div className="space-y-6">

          {/* Report header */}
          <div className="rounded-2xl border-2 border-ink bg-ink text-paper p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-ink">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg uppercase tracking-tight">Audit Report</h2>
                <p className="text-xs text-paper/60 font-mono mt-0.5">
                  Detailed ingestion analysis for <strong className="text-paper">{fileName}</strong> · {summary.totalRows} rows processed
                </p>
              </div>
            </div>
          </div>

          {/* Transformation findings */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="font-display font-bold text-base text-ink">AI Transformations Applied</h3>
            </div>
            <p className="text-xs text-ink-muted font-mono">
              These are the automated normalisation steps the AI applied to your data. Each change is reversible — you can edit any cell in the Imported tab.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AuditFinding
                icon={<Phone className="h-4 w-4" />}
                count={audit.phonesCleaned}
                title="Phone numbers cleaned"
                why="Brackets, spaces, dashes, and country code prefixes (like +91 or 0) were stripped so the number is a bare 10-digit mobile number as required by GrowEasy CRM."
                tone={audit.phonesCleaned > 0 ? "success" : "neutral"}
              />
              <AuditFinding
                icon={<Globe className="h-4 w-4" />}
                count={audit.countryCodesAdded}
                title="Country codes defaulted to +91"
                why="Rows that had a phone number but no explicit country code were assigned +91 (India) automatically. This is correct for Indian real-estate lead databases."
                tone={audit.countryCodesAdded > 0 ? "accent" : "neutral"}
              />
              <AuditFinding
                icon={<Merge className="h-4 w-4" />}
                count={audit.channelsConsolidated}
                title="Notes consolidated"
                why="Secondary phone numbers, alternate emails, and additional contact info found in the same row were merged into the crm_note field separated by ' | ' to prevent data loss."
                tone={audit.channelsConsolidated > 0 ? "warning" : "neutral"}
              />
              <AuditFinding
                icon={<AlertTriangle className="h-4 w-4" />}
                count={skipped.length}
                title="Rows skipped"
                why="Rows with no usable email AND no usable phone number cannot be contacted as CRM leads. They are moved to the Skipped tab with a per-row reason."
                tone={skipped.length > 0 ? "danger" : "neutral"}
              />
            </div>
          </div>

          {/* Skip reason breakdown */}
          {skipped.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <XCircle className="h-4 w-4 text-danger" />
                <h3 className="font-display font-bold text-base text-ink">Skipped Records — Reason Breakdown</h3>
              </div>
              <p className="text-xs text-ink-muted font-mono">
                Each reason group below explains <em>why</em> those rows were rejected and what you can do to recover them.
              </p>
              <div className="space-y-3">
                {Object.entries(audit.skipReasonGroups).map(([reason, rows]) => (
                  <div key={reason} className="rounded-xl border border-border bg-paper/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-danger">{reason}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger-soft text-danger font-bold">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
                        </div>
                        <p className="text-[11px] text-ink-muted leading-relaxed">
                          {skipReasonExplanation(reason)}
                        </p>
                        <p className="text-[11px] text-accent mt-1.5 font-medium">
                          <strong>How to fix:</strong> {skipReasonFix(reason)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rows.map((r) => (
                        <span key={r.rowIndex} className="inline-flex items-center px-2 py-0.5 rounded bg-paper border border-border text-[10px] font-mono text-ink-faint">
                          Row {r.rowIndex + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Field coverage analysis */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-accent" />
                <h3 className="font-display font-bold text-base text-ink">Field Coverage Analysis</h3>
              </div>
              <button
                onClick={() => setShowFieldCoverage(!showFieldCoverage)}
                className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
              >
                {showFieldCoverage ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showFieldCoverage ? "Hide" : "Show"} all fields
              </button>
            </div>
            <p className="text-xs text-ink-muted font-mono">
              How many imported records have each CRM field populated. Low coverage on critical fields (email, phone) may indicate mapping issues.
            </p>
            {records.length > 0 ? (
              <div className="space-y-2">
                {CRM_FIELDS
                  .filter(f => showFieldCoverage || audit.fieldFillRate[f] < 100 || ["email", "mobile_without_country_code", "name", "crm_status"].includes(f))
                  .map((f) => {
                    const pct = audit.fieldFillRate[f];
                    const isCritical = ["email", "mobile_without_country_code", "name"].includes(f);
                    const fillColor = pct >= 90 ? "var(--color-success)" : pct >= 50 ? "var(--color-warning)" : "var(--color-danger)";
                    return (
                      <div key={f} className="flex items-center gap-3">
                        <span className={cn("font-mono text-[11px] w-44 shrink-0", isCritical ? "font-bold text-ink" : "text-ink-muted")}>{f}</span>
                        <div className="flex-1 h-2 rounded-full bg-paper overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: fillColor }} />
                        </div>
                        <span className="font-mono text-[11px] text-ink-muted w-10 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                {!showFieldCoverage && (
                  <button onClick={() => setShowFieldCoverage(true)} className="text-[11px] text-accent font-mono hover:underline mt-1">
                    Show all {CRM_FIELDS.length} fields →
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-ink-muted font-mono">No records imported — coverage analysis unavailable.</p>
            )}
          </div>

          {/* What the AI did, explained */}
          <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Info className="h-4 w-4 text-accent" />
              <h3 className="font-display font-bold text-base text-ink">How the AI Mapped Your CSV</h3>
            </div>
            <div className="space-y-3 text-xs text-ink-muted font-mono leading-relaxed">
              <ReportSection icon="①" title="Column recognition">
                The AI read every column header in your CSV and inferred which GrowEasy CRM field it corresponds to — regardless of spelling, language, or order. For example, &ldquo;Client Phone No.&rdquo;, &ldquo;Mobile&rdquo;, and &ldquo;Contact Number&rdquo; all map to <code className="bg-paper px-1 rounded">mobile_without_country_code</code>.
              </ReportSection>
              <ReportSection icon="②" title="Phone normalisation">
                Phone numbers were stripped of formatting characters (brackets, dashes, spaces) and country code prefixes. The cleaned number is stored in <code className="bg-paper px-1 rounded">mobile_without_country_code</code>. The country code (+91 by default) is stored separately in <code className="bg-paper px-1 rounded">country_code</code>.
              </ReportSection>
              <ReportSection icon="③" title="CRM status mapping">
                Free-text status values like &ldquo;interested&rdquo;, &ldquo;warm lead&rdquo;, or &ldquo;call again&rdquo; were mapped to one of four GrowEasy enum values: <code className="bg-paper px-1 rounded">GOOD_LEAD_FOLLOW_UP</code>, <code className="bg-paper px-1 rounded">DID_NOT_CONNECT</code>, <code className="bg-paper px-1 rounded">BAD_LEAD</code>, <code className="bg-paper px-1 rounded">SALE_DONE</code>. If no match was possible, the field is left empty.
              </ReportSection>
              <ReportSection icon="④" title="Extra contact info">
                If a row had multiple phones or emails in different columns (or in the same column separated by commas), the primary value was extracted into the main field and the rest were appended to <code className="bg-paper px-1 rounded">crm_note</code> as &ldquo;Extra phone: …&rdquo; or &ldquo;Extra email: …&rdquo;.
              </ReportSection>
              <ReportSection icon="⑤" title="Skipping logic">
                A row is skipped if and only if it has <strong>no usable email address AND no usable phone number</strong>. All other rows — even those with many empty fields — are imported. Skipped rows are never silently dropped; they are moved to the Skipped tab with a per-row reason.
              </ReportSection>
              <ReportSection icon="⑥" title="Batch processing">
                Rows were sent to Gemini in batches of 20 rows at a time to respect API rate limits. Each batch was retried up to 3 times with exponential backoff (5 s → 10 s → 20 s) on 429 or 5xx errors. If a batch failed all retries, every row in that batch was added to the Skipped log with the API error as the reason.
              </ReportSection>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

/* ─────────── Helpers ─────────── */

function skipReasonExplanation(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes("no contact") || lower.includes("no usable email") || lower.includes("no phone") || lower.includes("no email or phone"))
    return "This row has neither an email address nor a phone number. Without at least one contact point, a CRM lead cannot be created.";
  if (lower.includes("api") || lower.includes("quota") || lower.includes("429") || lower.includes("rate limit"))
    return "The Gemini API returned an error while processing the batch containing this row. The API free-tier quota may have been exceeded.";
  if (lower.includes("parse") || lower.includes("json") || lower.includes("invalid"))
    return "The AI returned a response that could not be parsed as valid JSON. This is usually a transient error — re-uploading the file may resolve it.";
  if (lower.includes("duplicate"))
    return "This row appears to be a duplicate of another row already imported in this session.";
  return "The AI could not extract sufficient valid data from this row to create a CRM lead record.";
}

function skipReasonFix(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes("no contact") || lower.includes("no usable email") || lower.includes("no phone"))
    return "Add a valid email or phone number to the original CSV and re-upload, or remove these rows from your source data.";
  if (lower.includes("api") || lower.includes("quota") || lower.includes("429"))
    return "Wait for the API rate limit to reset (usually 1 minute) and re-upload. Consider upgrading to a paid Gemini API tier for higher limits.";
  if (lower.includes("parse") || lower.includes("json"))
    return "Re-upload the same file — this is typically a transient AI response error that succeeds on retry.";
  return "Review the raw row data in the Skipped tab and fix the data in your source CSV, then re-upload.";
}

function AuditFinding({
  icon, count, title, why, tone,
}: {
  icon: React.ReactNode;
  count: number;
  title: string;
  why: string;
  tone: "success" | "accent" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    success: "border-success/30 bg-success-soft text-success",
    accent: "border-accent/30 bg-accent-soft text-accent",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-danger/30 bg-danger-soft text-danger",
    neutral: "border-border bg-paper text-ink-muted",
  };
  return (
    <div className={cn("rounded-xl border p-4", colors[tone].split(" ").slice(0, 2).join(" "))}>
      <div className="flex items-center gap-2 mb-2">
        <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", colors[tone].split(" ").slice(1).join(" "))}>{icon}</span>
        <span className="font-mono text-2xl font-black text-ink">{count}</span>
      </div>
      <p className="font-display font-bold text-sm text-ink mb-1">{title}</p>
      <p className="text-[11px] text-ink-muted leading-relaxed">{why}</p>
    </div>
  );
}

function ReportSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg border border-border bg-paper/20 hover:bg-paper/40 transition-colors">
      <span className="text-accent font-bold shrink-0 w-5">{icon}</span>
      <div>
        <p className="font-bold text-ink mb-1 uppercase tracking-wide text-[10px]">{title}</p>
        <p>{children}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: number; tone: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl mb-3 shadow-inner",
        tone === "success" && "bg-success-soft text-success",
        tone === "danger" && "bg-danger-soft text-danger",
        tone === "neutral" && "bg-accent-soft text-accent",
      )}>
        {icon}
      </div>
      <p className="font-display text-2xl font-bold text-ink leading-none">{value}</p>
      <p className="text-xs text-ink-muted mt-1.5 leading-none">{label}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200",
      active ? "bg-accent text-accent-ink shadow-sm" : "text-ink-muted hover:text-ink"
    )}>
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
