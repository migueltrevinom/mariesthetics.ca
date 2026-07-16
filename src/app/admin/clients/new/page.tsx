import { AdminShell } from "@/components/admin/AdminShell";
import { ClientEditor } from "@/components/admin/ClientEditor";

export const dynamic = "force-dynamic";

export default async function AdminNewClientPage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Page Header */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            New Client Registration
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Add a new client account profile. They can login instantly using email OTP validation.
          </p>
        </div>

        {/* Creation Form */}
        <div className="mt-4">
          <ClientEditor isEdit={false} />
        </div>
      </div>
    </AdminShell>
  );
}
