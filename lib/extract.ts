export type ExtractResult = {
  file: { period_start: string; period_end: string; declared_hours: number | null; report: Record<string, unknown> };
  rows: Record<string, unknown>[];
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
  if (!res.ok) throw new Error(`Extraction failed (${res.status})`);
  return res.json();
}
