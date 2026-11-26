import type { Json } from "@/types/database.types";

type JsonObject = { [key: string]: Json | undefined };

export type ExtractIssue = { code: string; severity: "error" | "warning"; message: string };

export type ExtractResult = {
  file: { period_start: string; period_end: string; declared_hours: number | null; report: JsonObject };
  rows: JsonObject[];
};

export async function callExtractFunction(pdf: ArrayBuffer): Promise<ExtractResult> {
  const base =
    process.env.EXTRACT_FUNCTION_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const res = await fetch(`${base}/api/extract_calendar`, {
    method: "POST",
    headers: {
      "content-type": "application/pdf",
      "x-extract-secret": process.env.EXTRACT_FUNCTION_SECRET ?? "",
    },
    body: pdf,
  });
  if (!res.ok) {
    const detail = await res
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => undefined);
    throw new Error(`Extraction failed (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.json();
}
