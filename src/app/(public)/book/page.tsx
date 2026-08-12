import type { Metadata } from "next";
import { BookingWizard } from "@/components/book/BookingWizard";
import { BookPageHeader } from "@/components/book/BookPageHeader";
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
        <BookPageHeader />

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
