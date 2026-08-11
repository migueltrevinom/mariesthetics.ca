import Link from "next/link";
import { Reveal } from "@/components/public/Reveal";
import { whatsappUrl } from "@/lib/config";

export function CtaBand() {
  return (
    <section className="aurora relative overflow-hidden py-28 md:py-36">
      <div className="grain absolute inset-0 opacity-10" />
      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
        <Reveal>
          <p className="eyebrow">Your Private Appointment Awaits</p>
          <h2 className="display mt-5 text-4xl text-[var(--ink)] sm:text-6xl md:text-7xl">
            Ready for your <span className="gold-text italic">natural glow?</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-ink-soft text-sm sm:text-base leading-relaxed">
            Experience West Edmonton&apos;s premier 1-on-1 skin &amp; lash studio. Online booking takes under a minute.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-primary">
              Reserve Appointment →
            </Link>
            <a
              href={whatsappUrl("Hi Mari, I’d like to ask about an appointment.")}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              Ask on WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
