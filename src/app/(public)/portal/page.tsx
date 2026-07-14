import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { getSession, clearSessionCookie } from "@/lib/auth/jwt";
import { connectDb } from "@/lib/db/connect";
import { Booking } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { TipButton } from "@/components/client/TipButton";

export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}

export default async function PortalPage() {
  const session = await getSession();
  if (!session || session.role !== "client") {
    redirect("/login");
  }

  let bookings: Array<{
    _id: unknown;
    start: Date;
    status: string;
    paymentSummary?: {
      paidCents?: number;
      balanceDueCents?: number;
    };
    serviceId?: { name?: string } | null;
  }> = [];

  try {
    await connectDb();
    bookings = (await Booking.find({ clientId: session.sub })
      .sort({ start: -1 })
      .populate("serviceId")
      .lean()) as typeof bookings;
  } catch {
    bookings = [];
  }

  return (
    <div className="aurora grain relative min-h-screen overflow-hidden pt-40 pb-24 md:pt-48">
      <div className="relative mx-auto max-w-3xl px-6 md:px-10">
        <p className="eyebrow">Portal</p>
        <h1 className="display mt-3 text-5xl text-ivory">
          Hi, {session.name}
        </h1>
        <div className="mt-8 flex gap-3">
          <Link href="/book" className="btn-primary">
            Book again
          </Link>
          <form action={logout}>
            <button type="submit" className="btn-ghost">
              Log out
            </button>
          </form>
        </div>
        <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {bookings.map((b) => (
            <div key={String(b._id)} className="py-6">
              <p className="font-[family-name:var(--font-display)] text-2xl">
                {b.serviceId?.name ?? "Service"}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {format(new Date(b.start), "PPpp")} · {b.status}
              </p>
              <p className="mt-2 text-sm">
                Paid {formatCad(b.paymentSummary?.paidCents ?? 0)} · Balance{" "}
                {formatCad(b.paymentSummary?.balanceDueCents ?? 0)}
              </p>
              {(b.status === "completed" || b.status === "confirmed") && (
                <TipButton bookingId={String(b._id)} />
              )}
            </div>
          ))}
          {bookings.length === 0 && (
            <p className="py-10 text-ink-soft">No bookings linked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
