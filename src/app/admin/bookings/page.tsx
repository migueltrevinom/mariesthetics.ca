import { format } from "date-fns";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { BookingActions } from "@/components/admin/BookingActions";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  let bookings: Array<Record<string, unknown>> = [];
  try {
    await connectDb();
    bookings = (await Booking.find()
      .sort({ start: -1 })
      .limit(80)
      .populate("serviceId")
      .lean()) as typeof bookings;
  } catch {
    bookings = [];
  }

  return (
    <AdminShell>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-white">
        Bookings
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Confirm e-Transfer deposits, complete visits, adjust payments.
      </p>
      <div className="mt-8 space-y-4">
        {bookings.map((b) => {
          const service = b.serviceId as { name?: string } | null;
          const guest = b.guest as { name?: string; email?: string } | null;
          const summary = b.paymentSummary as {
            balanceDueCents?: number;
            paidCents?: number;
          } | null;
          return (
            <div
              key={String(b._id)}
              className="border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl">
                    {service?.name ?? "Service"}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {format(new Date(b.start as string), "PPpp")} ·{" "}
                    <span className="uppercase tracking-wide">{String(b.status)}</span>
                  </p>
                  <p className="mt-2 text-sm text-white/70">
                    {guest?.name} · {guest?.email}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    Paid {formatCad(summary?.paidCents ?? 0)} · Due{" "}
                    {formatCad(summary?.balanceDueCents ?? 0)} ·{" "}
                    {String(b.depositMethod)}
                  </p>
                  {Boolean(b.etransferNote) && (
                    <p className="mt-2 text-xs text-[#9dceb8]">
                      Proof note: {String(b.etransferNote)}
                    </p>
                  )}
                </div>
                <BookingActions
                  bookingId={String(b._id)}
                  status={String(b.status)}
                  balanceDueCents={summary?.balanceDueCents ?? 0}
                />
              </div>
            </div>
          );
        })}
        {bookings.length === 0 && (
          <p className="text-sm text-white/50">No bookings yet.</p>
        )}
      </div>
    </AdminShell>
  );
}
