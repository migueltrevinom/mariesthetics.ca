import { format } from "date-fns";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Booking, Client, Service } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { BookingActions } from "@/components/admin/BookingActions";
import { BookingCalendar } from "@/components/admin/BookingCalendar";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  let formattedServices: any[] = [];
  let formattedClients: any[] = [];
  let pendingConfirmations: any[] = [];

  try {
    await connectDb();
    
    // 1. Fetch active services for selection dropdown
    const dbServices = await Service.find({ active: true }).sort({ sortOrder: 1 });
    formattedServices = dbServices.map((s) => ({
      id: String(s._id),
      name: s.name,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      depositCents: s.depositCents,
    }));

    // 2. Fetch clients for autocomplete selection
    const dbClients = await Client.find().sort({ name: 1 });
    formattedClients = dbClients.map((c) => ({
      id: String(c._id),
      name: c.name,
      email: c.email,
      phone: c.phone || "",
    }));

    // 3. Fetch held bookings that need manual verification (e.g. e-transfers awaiting confirmations)
    pendingConfirmations = (await Booking.find({ 
      status: "held", 
      depositMethod: "etransfer" 
    })
      .sort({ createdAt: -1 })
      .populate("serviceId")
      .lean()) as any[];

  } catch (err) {
    console.error("Database connection failed on Bookings page", err);
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-[var(--ink)]">
        {/* Header */}
        <div className="text-left">
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Bookings
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Manage booking calendars, manual scheduling, and e-Transfer deposits.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          
          {/* Main Area: Fancy Interactive Calendar */}
          <div className="min-w-0">
            <BookingCalendar services={formattedServices} clients={formattedClients} />
          </div>

          {/* Right Sidebar: Awaiting Confirmations List */}
          <div className="border border-[var(--border-color)] bg-[var(--card-bg)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="border-b border-[var(--border-color)] pb-3 text-left">
              <h2 className="font-semibold text-base flex items-center gap-2">
                <span>Held e-Transfers</span>
                {pendingConfirmations.length > 0 && (
                  <span className="text-[10px] bg-blush/20 text-blush border border-blush/30 px-2 py-0.5 rounded-full font-bold">
                    {pendingConfirmations.length}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-[var(--ink-soft)] mt-0.5">
                Verify deposits and approve held slots
              </p>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin text-left">
              {pendingConfirmations.map((b) => {
                const service = b.serviceId as { name?: string } | null;
                const guest = b.guest as { name?: string; email?: string } | null;
                const summary = b.paymentSummary as {
                  balanceDueCents?: number;
                  paidCents?: number;
                } | null;

                return (
                  <div
                    key={String(b._id)}
                    className="border border-[var(--border-color)] bg-black/10 p-4 rounded-xl flex flex-col gap-3"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[var(--ink)] leading-tight">
                        {service?.name ?? "Service"}
                      </p>
                      <p className="text-[10px] text-[var(--ink-soft)] mt-1 font-medium">
                        {format(new Date(b.start as string), "PP · h:mm a")}
                      </p>
                      <p className="text-xs text-[var(--ink)] mt-2 font-medium">
                        {guest?.name}
                      </p>
                      <p className="text-[10px] text-[var(--ink-soft)] truncate">
                        {guest?.email}
                      </p>
                      {Boolean(b.etransferNote) && (
                        <div className="mt-2 text-[10px] border border-[#9dceb8]/20 bg-[#9dceb8]/5 px-2.5 py-1.5 rounded-lg text-[#9dceb8] font-mono leading-normal break-all">
                          Proof note: {String(b.etransferNote)}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[var(--border-color)] pt-2.5">
                      <BookingActions
                        bookingId={String(b._id)}
                        status={String(b.status)}
                        balanceDueCents={summary?.balanceDueCents ?? 0}
                      />
                    </div>
                  </div>
                );
              })}

              {pendingConfirmations.length === 0 && (
                <div className="py-8 text-center text-xs text-[var(--ink-soft)] italic">
                  No deposits awaiting verification.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
