import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: isAdmin }, { data: lessons }] = await Promise.all([
    supabase.rpc("is_admin"),
    supabase
      .from("lesson")
      .select("id, lesson_date, start_time, end_time")
      .order("lesson_date")
      .order("start_time")
      .limit(20),
  ]);

  return (
    <main>
      <h1>Calendario</h1>
      {isAdmin && <Link href="/manutenzione">Manutenzione</Link>}
      <p>{lessons?.length ?? 0} lezioni caricate (anteprima).</p>
    </main>
  );
}
