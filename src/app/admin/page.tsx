import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Booking, Client, Payment, Service } from "@/lib/db/models";
import { RevenueDashboard } from "@/components/admin/RevenueDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let stats = { bookings: 0, held: 0, clients: 0, services: 0, pendingPay: 0 };
  try {
    await connectDb();
    const [bookings, held, clients, services, pendingPay] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: "held" }),
      Client.countDocuments(),
      Service.countDocuments({ active: true }),
      Payment.countDocuments({ status: "pending" }),
    ]);
    stats = { bookings, held, clients, services, pendingPay };
  } catch {
    // db offline
  }

  return (
    <AdminShell>
      <div className="space-y-10 text-left">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Overview
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Studio Management Dashboard & Financial Performance.
          </p>
        </div>

        {/* Revenue Analytics & Top Services Dashboard */}
        <RevenueDashboard />

        {/* System Summary Quick Links */}
        <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Studio System Totals
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Total Bookings", stats.bookings, "/admin/bookings"],
              ["Held (Proof Required)", stats.held, "/admin/bookings"],
              ["Active Services", stats.services, "/admin/services"],
              ["Registered Clients", stats.clients, "/admin/clients"],
              ["Pending Payments", stats.pendingPay, "/admin/payments"],
            ].map(([label, value, href]) => (
              <Link
                key={String(label)}
                href={String(href)}
                className="border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition-all duration-300 hover:border-[#c8a86b] rounded-2xl shadow-sm block"
              >
                <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-soft)] truncate">
                  {label}
                </p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  {value}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
