import { NextRequest } from "next/server";
import {
  chunkRows,
  createGeminiClient,
  processBatchWithRetry,
} from "@/lib/gemini";
import type { CrmRecord, ExtractEvent, RawRow, SkippedRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const BATCH_SIZE = 20;
const CONCURRENCY = 1;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        type: "error",
        message:
          "Server is missing GEMINI_API_KEY. Add it to your environment variables and redeploy.",
      } satisfies ExtractEvent),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let rows: RawRow[];
  try {
    const body = await req.json();
    rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No rows provided");
    }
  } catch {
    return new Response(
      JSON.stringify({
        type: "error",
        message: "Request body must be JSON with a non-empty `rows` array.",
      } satisfies ExtractEvent),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const client = createGeminiClient(apiKey);
  const jobs = chunkRows(rows, BATCH_SIZE);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: ExtractEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const allRecords: CrmRecord[] = [];
      const allSkipped: SkippedRow[] = [];
      let cursor = 0;

      const runJob = async (jobIndex: number) => {
        const job = jobs[jobIndex];
        send({
          type: "batch_start",
          batch: job.batchIndex + 1,
          totalBatches: jobs.length,
        });
        try {
          const { records, skipped } = await processBatchWithRetry(
            client,
            job.rows,
            (attempt, error) =>
              send({
                type: "batch_retry",
                batch: job.batchIndex + 1,
                attempt,
                error,
              })
          );
          allRecords.push(...records);
          allSkipped.push(...skipped);
          send({
            type: "batch_done",
            batch: job.batchIndex + 1,
            totalBatches: jobs.length,
            imported: records,
            skipped,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const skipped = job.rows.map((row, i) => ({
            row,
            reason: `Batch failed after retries: ${message}`,
            rowIndex: i,
          }));
          allSkipped.push(...skipped);
          send({
            type: "batch_failed",
            batch: job.batchIndex + 1,
            error: message,
            skipped,
          });
        }
      };

      // Bounded-concurrency worker pool so we don't fire all batches at once.
      const workers = Array.from(
        { length: Math.min(CONCURRENCY, jobs.length) },
        async () => {
          while (cursor < jobs.length) {
            const next = cursor++;
            await runJob(next);
          }
        }
      );

      await Promise.all(workers);

      send({
        type: "complete",
        summary: {
          totalRows: rows.length,
          totalImported: allRecords.length,
          totalSkipped: allSkipped.length,
        },
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
