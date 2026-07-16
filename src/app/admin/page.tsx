import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Booking, Client, Payment, Service } from "@/lib/db/models";

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
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        Overview
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Hidden management dashboard — JWT + email OTP.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Total bookings", stats.bookings, "/admin/bookings"],
          ["Held (awaiting proof)", stats.held, "/admin/bookings"],
          ["Active services", stats.services, "/admin/services"],
          ["Clients", stats.clients, "/admin/clients"],
          ["Pending payments", stats.pendingPay, "/admin/payments"],
        ].map(([label, value, href]) => (
          <Link
            key={String(label)}
            href={String(href)}
            className="border border-[var(--border-color)] bg-[var(--card-bg)] p-5 transition-all duration-300 hover:border-[var(--line)] rounded-2xl shadow-sm"
          >
            <p className="text-xs uppercase tracking-wider text-[var(--ink-soft)]">
              {label}
            </p>
            <p className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
              {value}
            </p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
