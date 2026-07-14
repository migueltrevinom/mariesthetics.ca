import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Client } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  let clients: Array<Record<string, unknown>> = [];
  try {
    await connectDb();
    clients = (await Client.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("subscription")
      .lean()) as typeof clients;
  } catch {
    clients = [];
  }

  return (
    <AdminShell>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
        Clients
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Accounts linked via email OTP. Subscription lives on{" "}
        <code className="text-white/80">client.subscription</code>.
      </p>
      <div className="mt-8 space-y-3">
        {clients.map((c) => (
          <div
            key={String(c._id)}
            className="border border-white/10 bg-white/5 px-4 py-4"
          >
            <p className="text-white">{String(c.name)}</p>
            <p className="text-sm text-white/50">
              {String(c.email)} · {String(c.phone || "no phone")}
            </p>
            <p className="mt-1 text-xs text-white/40">
              Referral: {String(c.referralCode || "—")} · Subscription:{" "}
              {c.subscription ? String(c.subscription) : "none"}
            </p>
          </div>
        ))}
        {clients.length === 0 && (
          <p className="text-sm text-white/50">No clients yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
