import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { formatCad } from "@/lib/money";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/public/Reveal";
import {
  breadcrumbJsonLd,
  buildMetadata,
  business,
  faqJsonLd,
  siteUrl,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "West Edmonton Esthetics Studio · Glastonbury & The Hamptons",
  description:
    "Private home esthetics studio serving West Edmonton (Glastonbury, The Hamptons, Granville, Lewis Estates, T5T). Tailored facials, lash lifts, brow shaping, and dermaplaning in a calm 1-on-1 sanctuary.",
  path: "/locations/west-edmonton",
  keywords: [
    "esthetician West Edmonton",
    "facials Glastonbury Edmonton",
    "lash lift The Hamptons Edmonton",
    "dermaplaning West Edmonton",
    "brow shaping Glastonbury",
    "home studio esthetician T5T",
    "esthetics Lewis Estates",
    "skincare studio Granville Edmonton",
  ],
});

type PreviewService = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
};

async function getServices(): Promise<PreviewService[]> {
  try {
    await connectDb();
    const services = await Service.find({ active: true })
      .sort({ sortOrder: 1 })
      .limit(6)
      .lean();
    return services.map((s) => ({
      _id: String(s._id),
      name: String(s.name),
      description: String(s.description ?? ""),
      durationMin: Number(s.durationMin),
      priceCents: Number(s.priceCents),
    }));
  } catch {
    return [];
  }
}

const localFaqs = [
  {
    q: "Where is Mari Esthetics located in West Edmonton?",
    a: "Mari Esthetics is a private home studio located in Glastonbury (T5T), West Edmonton — just minutes from Lessard Road and Anthony Henday Drive. For client privacy, the exact address is shared immediately upon booking confirmation.",
  },
  {
    q: "What neighborhoods do you serve in Edmonton?",
    a: "We primarily serve West Edmonton including Glastonbury, The Hamptons, Granville, Lewis Estates, Secord, Callingwood, Webber Greens, and Windermere across the river.",
  },
  {
    q: "Is parking available at the West Edmonton studio?",
    a: "Yes! Dedicated free street and driveway parking is available directly outside the studio, eliminating commercial mall parking stress.",
  },
  {
    q: "How do I book an appointment?",
    a: "Select your desired treatment on our online booking tool, pick a date & time in Edmonton local time, and secure your session with a deposit via credit card (Stripe) or Interac e-Transfer.",
  },
];

export default async function WestEdmontonLocationPage() {
  const services = await getServices();

  const locationJsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": `${siteUrl}/locations/west-edmonton#business`,
    name: `${business.name} — West Edmonton Studio`,
    description:
      "Private esthetics studio serving West Edmonton, Glastonbury, and The Hamptons. Custom facials, lash lifts, and skin treatments.",
    url: `${siteUrl}/locations/west-edmonton`,
    telephone: business.phone,
    priceRange: business.priceRange,
    currenciesAccepted: "CAD",
    image: `${siteUrl}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Edmonton",
      addressRegion: "AB",
      postalCode: "T5T 6M5",
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 53.4975,
      longitude: -113.6358,
    },
    areaServed: [
      { "@type": "City", name: "West Edmonton" },
      { "@type": "City", name: "Glastonbury" },
      { "@type": "City", name: "The Hamptons" },
      { "@type": "City", name: "Granville" },
      { "@type": "City", name: "Lewis Estates" },
      { "@type": "City", name: "Secord" },
    ],
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2000&q=80"
            alt="West Edmonton Esthetics Studio interior at Mari Esthetics"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30 dark:opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/60 via-[var(--background)]/85 to-[var(--background)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-10">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c8a86b]/40 bg-[#c8a86b]/10 px-4 py-1.5 text-xs font-semibold text-[#c8a86b] backdrop-blur-md">
              📍 West Edmonton Studio · Glastonbury &amp; The Hamptons (T5T)
            </span>
            <h1 className="font-[family-name:var(--font-display)] mt-6 text-4xl sm:text-6xl md:text-7xl font-light text-[var(--ink)] leading-[1.05]">
              Your neighborhood retreat for <span className="gold-text italic font-normal">glowing skin</span>.
            </h1>
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[var(--ink-soft)]">
              Located in Glastonbury, West Edmonton. Escape the commercial salon noise and enjoy quiet, customized skincare, lash lifts, brow artistry, and dermaplaning in a private 1-on-1 home studio.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/book" className="btn-primary">
                Book Treatment in West Edmonton
              </Link>
              <Link href="/services" className="btn-ghost">
                View Full Pricing
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── WHY WEST EDMONTON NEIGHBORS CHOOSE MARI ESTHETICS ── */}
      <section className="paper relative py-20 border-t border-b border-[var(--border-color)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 md:px-10">
          <Reveal>
            <p className="eyebrow">Neighborhood Benefits</p>
            <h2 className="font-[family-name:var(--font-display)] mt-3 text-3xl sm:text-4xl text-[var(--ink)]">
              Designed for West Edmonton locals.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Reveal delay={0}>
              <div className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">🌿</span>
                  <h3 className="font-[family-name:var(--font-display)] mt-4 text-xl text-[var(--ink)]">
                    1-on-1 Quiet Sanctuary
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
                    No crowded waiting rooms or overlapping appointments. Every session is exclusively yours in a peaceful setting.
                  </p>
                </div>
                <span className="mt-6 text-xs text-[#c8a86b] font-semibold">Glastonbury Studio</span>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <div className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">🚗</span>
                  <h3 className="font-[family-name:var(--font-display)] mt-4 text-xl text-[var(--ink)]">
                    Zero Traffic &amp; Free Parking
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
                    Minutes off Lessard Road and Anthony Henday Drive. Pull right up with free, stress-free driveway &amp; street parking.
                  </p>
                </div>
                <span className="mt-6 text-xs text-[#c8a86b] font-semibold">The Hamptons &amp; Granville</span>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="text-3xl">✨</span>
                  <h3 className="font-[family-name:var(--font-display)] mt-4 text-xl text-[var(--ink)]">
                    Tailored Skincare &amp; Lashes
                  </h3>
                  <p className="mt-3 text-sm text-[var(--ink-soft)] leading-relaxed">
                    Personalized facials, dermaplaning, lash lifts, and brow shaping customized to your exact skin goals.
                  </p>
                </div>
                <span className="mt-6 text-xs text-[#c8a86b] font-semibold">Transparent Pricing</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── POPULAR TREATMENTS MENU ── */}
      {services.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <Reveal>
              <p className="eyebrow">Popular Treatments</p>
              <h2 className="font-[family-name:var(--font-display)] mt-3 text-3xl sm:text-4xl text-[var(--ink)]">
                Featured West Edmonton services.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {services.map((service, i) => (
                <Reveal key={service._id} delay={i * 80}>
                  <Link
                    href={`/book?serviceId=${service._id}`}
                    className="card group flex h-full flex-col p-7 hover:border-[#c8a86b]/40 transition-all"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                        {service.name}
                      </h3>
                      <span className="gold-text font-semibold text-lg">
                        {formatCad(service.priceCents)}
                      </span>
                    </div>
                    <p className="mt-3 flex-1 text-xs leading-relaxed text-[var(--ink-soft)]">
                      {service.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--ink-faint)] border-t border-[var(--border-color)] pt-4">
                      <span>{service.durationMin} mins</span>
                      <span className="text-[#c8a86b] font-bold group-hover:translate-x-1 transition-transform">
                        Book Now →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── AREA COVERAGE & DIRECTIONS ── */}
      <section className="paper relative py-20 border-t border-[var(--border-color)]">
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-6 md:px-10">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <Reveal>
              <div>
                <p className="eyebrow">Convenient West End Access</p>
                <h2 className="font-[family-name:var(--font-display)] mt-3 text-3xl sm:text-4xl text-[var(--ink)]">
                  Serving West Edmonton &amp; surrounding areas.
                </h2>
                <p className="mt-4 text-sm text-[var(--ink-soft)] leading-relaxed">
                  Our private studio is located in Glastonbury (postal code T5T 6M5), conveniently accessible from:
                </p>

                <ul className="mt-6 grid grid-cols-2 gap-3 text-xs text-[var(--ink)] font-medium">
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Glastonbury
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> The Hamptons
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Granville
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Lewis Estates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Secord &amp; Rosenthal
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Callingwood &amp; Ormsby
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Windermere (via Henday)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#c8a86b]">✓</span> Spruce Grove
                  </li>
                </ul>

                <div className="mt-8">
                  <Link href="/book" className="btn-primary">
                    Reserve Your Appointment
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-3xl space-y-6 shadow-xl">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  Driving Directions
                </h3>

                <div className="space-y-4 text-xs text-[var(--ink-soft)] leading-relaxed">
                  <div className="border-b border-[var(--border-color)] pb-3">
                    <strong className="text-[var(--ink)] font-bold block mb-1">
                      From Anthony Henday Drive:
                    </strong>
                    Take the Lessard Road / 62 Ave NW exit West, turn into Glastonbury. Studio is under 3 minutes from the Henday.
                  </div>

                  <div className="border-b border-[var(--border-color)] pb-3">
                    <strong className="text-[var(--ink)] font-bold block mb-1">
                      From Whitemud Drive:
                    </strong>
                    Follow Whitemud West towards Lewis Estates / Henday South, exit on Lessard Road into Glastonbury.
                  </div>

                  <div>
                    <strong className="text-[var(--ink)] font-bold block mb-1">
                      Parking &amp; Arrival:
                    </strong>
                    Free driveway &amp; street parking available right outside. Detailed arrival instructions are texted/emailed upon booking.
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <Reveal>
            <p className="eyebrow">Location FAQ</p>
            <h2 className="font-[family-name:var(--font-display)] mt-3 text-3xl sm:text-4xl text-[var(--ink)]">
              West Edmonton Studio Questions
            </h2>
          </Reveal>

          <div className="mt-10 space-y-6 divide-y divide-[var(--border-color)]">
            {localFaqs.map((faq, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="pt-6">
                  <h3 className="text-base font-semibold text-[var(--ink)]">
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">
                    {faq.a}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="aurora relative py-20 border-t border-[var(--border-color)]">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl text-[var(--ink)]">
              Ready to book your West Edmonton session?
            </h2>
            <p className="mt-4 text-sm text-[var(--ink-soft)] max-w-md mx-auto">
              Select your service, choose a time, and lock your slot with a deposit. Takes under 60 seconds.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link href="/book" className="btn-primary">
                Book Online Now
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Structured Data */}
      <JsonLd
        data={[
          locationJsonLd,
          faqJsonLd(localFaqs),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Locations", path: "/locations/west-edmonton" },
            { name: "West Edmonton", path: "/locations/west-edmonton" },
          ]),
        ]}
      />
    </div>
  );
}
