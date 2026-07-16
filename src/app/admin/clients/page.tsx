import { AdminShell } from "@/components/admin/AdminShell";
import { ClientsDashboard } from "@/components/admin/ClientsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  return (
    <AdminShell>
      <ClientsDashboard />
    </AdminShell>
  );
}
