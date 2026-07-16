import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { getClientById } from "@/app/api/clients/modules/client.module";
import { getActiveServices } from "@/app/api/services/modules/service.module";
import { ClientEditor } from "@/components/admin/ClientEditor";

export const dynamic = "force-dynamic";

interface AdminEditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditClientPage({ params }: AdminEditClientPageProps) {
  const { id } = await params;

  let dbClient: any = null;
  let services: any[] = [];
  try {
    await connectDb();
    const [clientRes, servicesRes] = await Promise.all([
      getClientById(id),
      getActiveServices(),
    ]);
    dbClient = clientRes;
    services = servicesRes;
  } catch (err) {
    console.error("Database connection failed on admin client edit page", err);
  }

  if (!dbClient) {
    notFound();
  }

  const formattedClient = {
    id: String(dbClient._id),
    name: String(dbClient.name),
    email: String(dbClient.email),
    phone: String(dbClient.phone ?? ""),
    active: dbClient.active !== false,
    banned: Boolean(dbClient.banned),
    photoUrl: String(dbClient.photoUrl ?? ""),
    referralCode: String(dbClient.referralCode ?? ""),
    stripeCustomerId: String(dbClient.stripeCustomerId ?? ""),
    subscription: dbClient.subscription ? String(dbClient.subscription) : null,
  };

  const formattedServices = services.map((s) => ({
    id: String(s._id),
    name: String(s.name),
  }));

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Page Header */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Edit Client Info
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Adjust credentials, check subscription state, active logs, or toggle ban flags for this specific client profile.
          </p>
        </div>

        {/* Single Edit Panel */}
        <div className="mt-4">
          <ClientEditor initialClient={formattedClient} isEdit={true} services={formattedServices} />
        </div>
      </div>
    </AdminShell>
  );
}
