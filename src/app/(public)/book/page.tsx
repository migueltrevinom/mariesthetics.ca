import type { Metadata } from "next";
import { BookingWizard } from "@/components/book/BookingWizard";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Book an Appointment",
  description:
    "Book your esthetics appointment in Edmonton, AB. Pick a service and time, then secure your slot with a Stripe or Interac e-Transfer deposit.",
  path: "/book",
});

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="aurora grain relative min-h-screen overflow-hidden pt-40 pb-24 md:pt-48">
      <div className="relative mx-auto max-w-3xl px-6 md:px-10">
        <p className="eyebrow">Book</p>
        <h1 className="display mt-5 text-5xl text-[var(--ink)] md:text-7xl">
          Reserve your time.
        </h1>
        <p className="mt-6 max-w-xl text-ink-soft leading-relaxed">
          Pick a service, choose a slot, and pay a deposit. Stripe confirms
          instantly; Interac e-Transfer holds your slot for two hours.
        </p>
        <div className="mt-12">
          <BookingWizard initialServiceId={params.serviceId} />
        </div>
      </div>
    </div>
  );
}
