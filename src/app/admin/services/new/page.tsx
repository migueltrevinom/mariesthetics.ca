import { AdminShell } from "@/components/admin/AdminShell";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export const dynamic = "force-dynamic";

export default async function AdminNewServicePage() {
  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Page Header */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            New Service Profile
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Define pricing levels, duration limits, deposits, and image slideshows to register a new offering.
          </p>
        </div>

        {/* Creation Form */}
        <div className="mt-4">
          <ServiceEditor isEdit={false} />
        </div>
      </div>
    </AdminShell>
  );
}
