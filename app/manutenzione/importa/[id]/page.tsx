import { createClient } from "@/lib/supabase/server";
import type { ExtractIssue } from "@/lib/extract";
import { applyBatch, discardBatch } from "../actions";

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: batch } = await supabase.from("import_batch").select("*").eq("id", id).single();
  const { data: rows } = await supabase
    .from("import_row")
    .select("*")
    .eq("batch_id", id)
    .order("row_date")
    .order("start_time");

  if (!batch) return <p>Importazione non trovata.</p>;
  const issues: ExtractIssue[] = (rows ?? []).flatMap((r) => (Array.isArray(r.issues) ? r.issues : []));
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return (
    <>
      <h1>{batch.file_name}</h1>
      <p>{rows?.length ?? 0} righe, {errors.length} errori, {warnings.length} avvisi.</p>
      <form action={applyBatch}>
        <input type="hidden" name="id" value={id} />
        <button disabled={batch.status !== "draft" || errors.length > 0}>Applica</button>
      </form>
      <form action={discardBatch}>
        <input type="hidden" name="id" value={id} />
        <button disabled={batch.status !== "draft"}>Scarta</button>
      </form>
    </>
  );
}
