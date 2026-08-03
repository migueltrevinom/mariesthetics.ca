import type { Metadata } from "next";
import { BookingWizard } from "@/components/book/BookingWizard";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Book an Appointment",
  description:
    "Book your esthetics appointment in Edmonton, AB. Pick a treatment and time slot, then secure your slot with a Stripe or Interac e-Transfer deposit.",
  path: "/book",
});

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string; service?: string; date?: string; time?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="aurora grain relative min-h-screen overflow-hidden pt-36 pb-24 md:pt-44">
      <div className="relative mx-auto max-w-5xl px-6 md:px-10">
        <div className="text-center sm:text-left space-y-3 mb-10">
          <p className="eyebrow">Online Reservation</p>
          <h1 className="display text-4xl sm:text-5xl md:text-7xl text-[var(--ink)] tracking-tight">
            Reserve Your Treatment.
          </h1>
          <p className="max-w-2xl text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            Select your service, choose a date &amp; time slot, and secure your session with a deposit. Instant confirmation with Stripe or held for 2 hours with Interac e-Transfer.
          </p>
        </div>

        <BookingWizard
          initialServiceId={params.serviceId}
          initialServiceSlug={params.service}
          initialDate={params.date}
          initialTime={params.time}
        />
      </div>
    </div>
  );
}
