// Canonical CRM record shape the AI must extract every uploaded CSV into.

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number] | "";

export interface CrmRecord {
  created_at: string;
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: CrmStatus | "";
  crm_note: string;
  data_source: DataSource;
  possession_time: string;
  description: string;
}

export const CRM_FIELDS: (keyof CrmRecord)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
];

/** A raw row parsed straight from the uploaded CSV, headers untouched. */
export type RawRow = Record<string, string>;

export interface SkippedRow {
  row: RawRow;
  reason: string;
  rowIndex: number;
}

export interface ExtractionSummary {
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
}

/** Server-Sent-Event-style progress messages streamed to the client. */
export type ExtractEvent =
  | { type: "batch_start"; batch: number; totalBatches: number }
  | {
      type: "batch_done";
      batch: number;
      totalBatches: number;
      imported: CrmRecord[];
      skipped: SkippedRow[];
    }
  | { type: "batch_retry"; batch: number; attempt: number; error: string }
  | { type: "batch_failed"; batch: number; error: string; skipped: SkippedRow[] }
  | { type: "complete"; summary: ExtractionSummary }
  | { type: "error"; message: string };
