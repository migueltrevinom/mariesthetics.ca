import Image from "next/image";
import Link from "next/link";
import { business } from "@/lib/seo";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-night">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=2000&q=80"
          alt="Calm esthetics treatment room at Mari Esthetics in Edmonton"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
      {/* Cinematic overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,16,13,0.55)_0%,rgba(11,16,13,0.35)_35%,rgba(11,16,13,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_20%_30%,rgba(31,77,58,0.45),transparent_60%)]" />
      <div className="grain absolute inset-0" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-24 pt-40 md:px-10 md:pb-32">
        <p className="reveal eyebrow">{business.locality}, {business.regionName} · By appointment</p>
        <h1 className="reveal reveal-delay-1 display mt-6 max-w-4xl text-[3.4rem] leading-[0.95] text-ivory sm:text-7xl md:text-[6.5rem]">
          Edmonton skin care,
          <br />
          <span className="gold-text italic">tailored to you.</span>
        </h1>
        <p className="reveal reveal-delay-2 mt-8 max-w-xl text-lg leading-relaxed text-ink-soft">
          A private esthetics studio for facials, lash lifts, brows and
          dermaplaning — quiet, unhurried, and personalized to your skin.
        </p>
        <div className="reveal reveal-delay-3 mt-10 flex flex-wrap gap-4">
          <Link href="/book" className="btn-primary">
            Book a service
          </Link>
          <Link href="/services" className="btn-ghost">
            View services &amp; pricing
          </Link>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[var(--ivory-faint)] md:flex">
        <span className="text-[0.65rem] uppercase tracking-[0.3em]">Scroll</span>
        <span className="scrollcue h-8 w-px bg-[var(--gold)]" />
      </div>
    </section>
  );
}
