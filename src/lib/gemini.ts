import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  CRM_FIELDS,
  type CrmRecord,
  type RawRow,
  type SkippedRow,
} from "./types";

const MODEL_NAME = "gemini-2.0-flash";
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;

interface RawAiResponse {
  records?: Partial<CrmRecord>[];
  skipped?: { rowIndex: number; reason: string }[];
}

function sanitizeRecord(raw: Partial<CrmRecord>): CrmRecord {
  const record = {} as CrmRecord;
  for (const field of CRM_FIELDS) {
    const value = raw[field];
    record[field] = (
      typeof value === "string" ? value : value == null ? "" : String(value)
    ) as never;
  }
  return record;
}

function extractJson(text: string): RawAiResponse {
  // Gemini occasionally wraps JSON in markdown fences despite instructions.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callGeminiBatch(
  client: GoogleGenerativeAI,
  rows: RawRow[]
): Promise<RawAiResponse> {
  const model = client.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  });

  const result = await model.generateContent([
    buildSystemPrompt(),
    buildUserPrompt(rows),
  ]);

  const text = result.response.text();
  return extractJson(text);
}

async function processBatchWithRetry(
  client: GoogleGenerativeAI,
  rows: RawRow[],
  onRetry: (attempt: number, error: string) => void
): Promise<{ records: CrmRecord[]; skipped: SkippedRow[] }> {
  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const parsed = await callGeminiBatch(client, rows);
      const records = (parsed.records ?? []).map(sanitizeRecord);
      const skipped: SkippedRow[] = (parsed.skipped ?? [])
        .filter((s) => rows[s.rowIndex] !== undefined)
        .map((s) => ({
          row: rows[s.rowIndex],
          reason: s.reason || "Missing email and phone number",
          rowIndex: s.rowIndex,
        }));
      return { records, skipped };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES) {
        onRetry(attempt + 1, lastError);
        await new Promise((r) =>
          setTimeout(r, RETRY_BASE_DELAY_MS * 2 ** attempt)
        );
      }
    }
  }

  throw new Error(lastError || "Unknown extraction error");
}

export interface BatchJob {
  batchIndex: number;
  rows: RawRow[];
}

export function chunkRows(rows: RawRow[], batchSize: number): BatchJob[] {
  const jobs: BatchJob[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    jobs.push({ batchIndex: jobs.length, rows: rows.slice(i, i + batchSize) });
  }
  return jobs;
}

export { processBatchWithRetry };
export function createGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey);
}
