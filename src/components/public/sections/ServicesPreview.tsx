import Link from "next/link";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";

type PreviewService = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
};

export function ServicesPreview({ services }: { services: PreviewService[] }) {
  if (services.length === 0) return null;

  return (
    <section className="paper relative overflow-hidden py-24 md:py-32">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow">The menu</p>
            <h2 className="display mt-4 max-w-xl text-4xl text-[var(--ink)] md:text-5xl">
              Treatments crafted for your skin.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/services" className="btn-ghost">
              All services &amp; pricing
            </Link>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service._id} delay={i * 100}>
              <Link
                href={`/book?serviceId=${service._id}`}
                className="card group flex h-full flex-col p-8"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="display text-2xl text-[var(--ink)]">{service.name}</h3>
                  <span className="gold-text text-lg font-semibold">
                    {formatCad(service.priceCents)}
                  </span>
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                  {service.description}
                </p>
                <div className="mt-6 flex items-center justify-between text-xs uppercase tracking-wider text-[var(--ink-faint)]">
                  <span>{service.durationMin} min</span>
                  <span className="text-gold transition-transform duration-300 group-hover:translate-x-1">
                    Book →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
