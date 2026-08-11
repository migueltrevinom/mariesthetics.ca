import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";
import { getFastIpfsUrl } from "@/lib/ipfs";

type PreviewService = {
  _id: string;
  name: string;
  description: string;
  durationMin: number;
  priceCents: number;
  depositCents?: number;
  category?: string;
  photos?: string[];
};

const FALLBACK_IMAGES: Record<string, string> = {
  facials: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=800",
  lashes: "https://images.unsplash.com/photo-1583001809873-a1284d563572?auto=format&fit=crop&q=80&w=800",
  permanentMakeUp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
  general: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
};

export function ServicesPreview({ services }: { services: PreviewService[] }) {
  if (services.length === 0) return null;

  return (
    <section className="paper relative overflow-hidden py-24 md:py-32 border-b border-[var(--border-color)]">
      <div className="grain absolute inset-0 opacity-10" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <p className="eyebrow">Featured Treatments</p>
            <h2 className="display mt-4 max-w-xl text-4xl text-[var(--ink)] sm:text-5xl">
              Crafted for your <span className="gold-text italic">natural glow.</span>
            </h2>
            <p className="mt-3 text-sm text-[var(--ink-soft)] max-w-md">
              Bespoke skincare, lash sets, and brow shaping in a serene 1-on-1 studio.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/services" className="btn-ghost">
              Explore All 13 Treatments →
            </Link>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {services.slice(0, 3).map((service, i) => {
            const categoryKey = service.category || "facials";
            const rawPhotoUrl =
              service.photos && service.photos.length > 0
                ? service.photos[0]
                : FALLBACK_IMAGES[categoryKey] || FALLBACK_IMAGES.general;
            const photoUrl = getFastIpfsUrl(rawPhotoUrl);

            return (
              <Reveal key={service._id} delay={i * 100}>
                <Link
                  href={`/book?serviceId=${service._id}`}
                  className="group border border-[var(--border-color)] bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-[#c8a86b]/50 transition-all duration-500 flex flex-col justify-between h-full"
                >
                  {/* Photo Header */}
                  <div className="relative w-full h-56 overflow-hidden bg-black/10">
                    <Image
                      src={photoUrl}
                      alt={service.name}
                      fill
                      loading="lazy"
                      decoding="async"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                      <span className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
                        {categoryKey}
                      </span>
                      <span className="bg-[#c8a86b]/90 backdrop-blur-md text-[#24180a] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        ⏱ {service.durationMin} MINS
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-6 right-6">
                      <h3 className="font-[family-name:var(--font-display)] text-2xl text-white tracking-tight leading-tight">
                        {service.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <p className="text-xs text-[var(--ink-soft)] leading-relaxed line-clamp-3">
                      {service.description}
                    </p>

                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                      <div>
                        {service.depositCents ? (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-faint)] block">
                            Deposit: {formatCad(service.depositCents)}
                          </span>
                        ) : null}
                        <span className="gold-text text-2xl font-bold tracking-tight">
                          {formatCad(service.priceCents)}
                        </span>
                      </div>

                      <span className="text-xs font-bold text-[#c8a86b] group-hover:translate-x-1 transition-transform duration-300">
                        Book Now →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
