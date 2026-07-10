import Papa from "papaparse";
import type { RawRow } from "./types";

export interface ParsedCsv {
  headers: string[];
  rows: RawRow[];
  errors: string[];
}

/** Parses a CSV file client-side. No AI or field mapping happens here. */
export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data.filter((r) =>
          Object.values(r).some((v) => String(v ?? "").trim() !== "")
        );
        resolve({
          headers,
          rows,
          errors: results.errors.map(
            (e) => `Row ${e.row ?? "?"}: ${e.message}`
          ),
        });
      },
      error: (err) => reject(err),
    });
  });
}

/** Converts CRM records back into a downloadable CSV string. */
export function recordsToCsv<T extends object>(records: T[]): string {
  return Papa.unparse(records, { newline: "\n" });
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
