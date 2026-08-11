import { Reveal } from "@/components/public/Reveal";

const steps = [
  {
    n: "01",
    title: "Pick Your Ritual",
    body: "Explore 13 curated facials, lash sets, and brow treatments with transparent pricing.",
  },
  {
    n: "02",
    title: "Select Your Time",
    body: "Pick a date and time that fits your day with live Edmonton appointment availability.",
  },
  {
    n: "03",
    title: "Lock Your Session",
    body: "Secure your private 1-on-1 slot instantly with a small card deposit or Interac e-Transfer.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative bg-[var(--background)] text-[var(--foreground)] py-24 md:py-32 transition-colors duration-200 border-b border-[var(--border-color)]">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Effortless Online Booking</p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-[var(--ink)] sm:text-5xl">
            Your appointment in <span className="gold-text italic">3 easy steps.</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120}>
              <div className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <p className="display text-5xl gold-text">{step.n}</p>
                  <h3 className="mt-6 text-xl font-semibold text-[var(--ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
