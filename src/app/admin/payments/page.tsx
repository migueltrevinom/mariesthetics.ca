import { format } from "date-fns";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Payment } from "@/lib/db/models";
import { formatCad } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  let payments: Array<Record<string, unknown>> = [];
  try {
    await connectDb();
    payments = (await Payment.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()) as typeof payments;
  } catch {
    payments = [];
  }

  return (
    <AdminShell>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
        Payments
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Deposits, balances, tips, and manual adjustments.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-white/40">
            <tr>
              <th className="py-2 pr-4 font-normal">When</th>
              <th className="py-2 pr-4 font-normal">Kind</th>
              <th className="py-2 pr-4 font-normal">Method</th>
              <th className="py-2 pr-4 font-normal">Amount</th>
              <th className="py-2 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={String(p._id)} className="border-t border-white/10">
                <td className="py-3 pr-4 text-white/60">
                  {format(new Date(p.createdAt as string), "PP p")}
                </td>
                <td className="py-3 pr-4">{String(p.kind)}</td>
                <td className="py-3 pr-4">{String(p.method)}</td>
                <td className="py-3 pr-4">{formatCad(Number(p.amountCents))}</td>
                <td className="py-3">{String(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && (
          <p className="mt-6 text-sm text-white/50">No payments yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
