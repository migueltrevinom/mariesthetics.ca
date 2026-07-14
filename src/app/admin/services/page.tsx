import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  let services: Array<Record<string, unknown>> = [];
  try {
    await connectDb();
    services = (await Service.find().sort({ sortOrder: 1 }).lean()) as typeof services;
  } catch {
    services = [];
  }

  return (
    <AdminShell>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
        Services
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Pricing table is driven by MongoDB — edit anytime.
      </p>
      <div className="mt-8">
        <ServiceEditor
          initial={services.map((s) => ({
            id: String(s._id),
            name: String(s.name),
            description: String(s.description ?? ""),
            durationMin: Number(s.durationMin),
            priceCents: Number(s.priceCents),
            depositCents: Number(s.depositCents),
            active: Boolean(s.active),
            sortOrder: Number(s.sortOrder ?? 0),
            category: String(s.category ?? "general"),
          }))}
        />
      </div>
      <div className="mt-10 space-y-3">
        {services.map((s) => (
          <div key={String(s._id)} className="border border-white/10 px-4 py-3 text-sm">
            <span className="text-white">{String(s.name)}</span>
            <span className="text-white/40">
              {" "}
              · {formatCad(Number(s.priceCents))} · deposit{" "}
              {formatCad(Number(s.depositCents))} ·{" "}
              {s.active ? "active" : "hidden"}
            </span>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
