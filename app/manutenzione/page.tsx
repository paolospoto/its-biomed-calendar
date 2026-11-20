import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MaintenancePage() {
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("import_batch")
    .select("id, file_name, status, period_start, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <h1>Manutenzione</h1>
      <Link href="/manutenzione/importa">Importa calendario</Link>
      <h2>Storico importazioni</h2>
      <table>
        <tbody>
          {batches?.map((b) => (
            <tr key={b.id}>
              <td><Link href={`/manutenzione/importa/${b.id}`}>{b.file_name}</Link></td>
              <td>{b.period_start}</td>
              <td>{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
