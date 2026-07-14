import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  robots: { index: false, follow: false },
};

export default async function BookSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; paid?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="aurora grain relative min-h-[80svh] overflow-hidden pt-40 pb-24 md:pt-48">
      <div className="relative mx-auto max-w-xl px-6 text-center md:px-10">
        <p className="eyebrow">Confirmed</p>
        <h1 className="display mt-5 text-5xl text-ivory md:text-6xl">
          Thank you.
        </h1>
        <p className="mt-5 text-ink-soft leading-relaxed">
          {params.paid === "tip"
            ? "Your tip was received — thank you for the kindness."
            : params.paid === "balance"
              ? "Remaining balance payment received."
              : "Your booking request is in. We’ll see you at the studio."}
        </p>
        {params.bookingId && (
          <p className="mt-4 text-sm text-[var(--ivory-faint)]">
            Ref: {params.bookingId}
          </p>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ghost">
            Home
          </Link>
          <Link href="/login" className="btn-primary">
            Save with client login
          </Link>
        </div>
      </div>
    </div>
  );
}
