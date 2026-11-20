"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { callExtractFunction } from "@/lib/extract";

export async function uploadCalendar(formData: FormData) {
  const supabase = await requireAdmin();
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) throw new Error("Missing PDF");

  const bytes = await file.arrayBuffer();
  const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  const extracted = await callExtractFunction(bytes);

  const month = extracted.file.period_start.slice(0, 7);
  const storagePath = `${month}/${sha256}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("calendar-sources")
    .upload(storagePath, bytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { data: course } = await supabase.from("course").select("id").limit(1).single();
  if (!course) throw new Error("No course configured");

  const { data: batchId, error } = await supabase.rpc("create_import_batch", {
    p_course_id: course.id,
    p_file: { ...extracted.file, file_name: file.name, storage_path: storagePath, sha256 },
    p_rows: extracted.rows,
  });
  if (error) throw error;

  redirect(`/manutenzione/importa/${batchId}`);
}

export async function applyBatch(formData: FormData) {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const { error } = await supabase.rpc("apply_import", { p_batch_id: id });
  if (error) throw error;
  redirect("/manutenzione");
}

export async function discardBatch(formData: FormData) {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const { error } = await supabase.from("import_batch").update({ status: "discarded" }).eq("id", id);
  if (error) throw error;
  redirect("/manutenzione");
}
