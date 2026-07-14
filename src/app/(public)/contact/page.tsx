import type { Metadata } from "next";
import Link from "next/link";
import { whatsappUrl } from "@/lib/config";
import { business, buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with Mari Esthetics in Edmonton, AB via WhatsApp, or book your appointment online. Serving Edmonton and surrounding communities.",
  path: "/contact",
});

export default function ContactPage() {
  const href = whatsappUrl(
    "Hi Mari! I’d like to get in touch about Mari Esthetics.",
  );

  return (
    <div className="aurora grain relative min-h-[90svh] overflow-hidden pt-40 pb-24 md:pt-48">
      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
        <p className="reveal eyebrow">Contact</p>
        <h1 className="reveal reveal-delay-1 display mt-5 text-5xl text-ivory md:text-7xl">
          Let’s talk skin.
        </h1>
        <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-md text-ink-soft leading-relaxed">
          The quickest way to reach Mari is WhatsApp. For appointments, booking
          online is fastest — your deposit locks the time instantly.
        </p>

        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap justify-center gap-4">
          <a href={href} target="_blank" rel="noreferrer" className="btn-primary">
            Message on WhatsApp
          </a>
          <Link href="/book" className="btn-ghost">
            Book an appointment
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-xl gap-4 sm:grid-cols-3">
          <div className="card p-6">
            <p className="eyebrow">WhatsApp</p>
            <p className="mt-3 text-sm text-ivory">{business.phoneDisplay}</p>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Hours</p>
            <p className="mt-3 text-sm text-ivory">Tue – Sat</p>
            <p className="text-sm text-ink-soft">9:00 am – 6:00 pm</p>
          </div>
          <div className="card p-6">
            <p className="eyebrow">Service area</p>
            <p className="mt-3 text-sm text-ivory">
              {business.locality}, {business.region}
            </p>
            <p className="text-sm text-ink-soft">&amp; surrounding area</p>
          </div>
        </div>

        <p className="mt-10 text-xs text-[var(--ivory-faint)]">
          Private home studio — the exact address is shared once your
          appointment is confirmed.
        </p>
      </div>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
    </div>
  );
}
