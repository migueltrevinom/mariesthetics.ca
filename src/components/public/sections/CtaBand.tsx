import Link from "next/link";
import { Reveal } from "@/components/public/Reveal";
import { whatsappUrl } from "@/lib/config";

export function CtaBand() {
  return (
    <section className="aurora relative overflow-hidden py-28 md:py-36">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-3xl px-6 text-center md:px-10">
        <Reveal>
          <p className="eyebrow">Your appointment awaits</p>
          <h2 className="display mt-5 text-5xl text-ivory md:text-7xl">
            Ready to glow?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-ink-soft leading-relaxed">
            Choose a service, pick your time, and secure it with a deposit. It
            takes about a minute.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/book" className="btn-primary">
              Book a service
            </Link>
            <a
              href={whatsappUrl("Hi Mari, I’d like to book an appointment.")}
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
