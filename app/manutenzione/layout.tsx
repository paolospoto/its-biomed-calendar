import { requireAdmin } from "@/lib/admin";

export default async function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <main>{children}</main>;
}
