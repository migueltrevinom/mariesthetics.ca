import { Reveal } from "@/components/public/Reveal";

const steps = [
  {
    n: "01",
    title: "Choose your service",
    body: "Browse treatments and transparent pricing, then pick the time that suits you.",
  },
  {
    n: "02",
    title: "Secure with a deposit",
    body: "Pay instantly by card via Stripe to lock your slot, or send an Interac e-Transfer — we hold the time for two hours while it clears.",
  },
  {
    n: "03",
    title: "Relax and enjoy",
    body: "Arrive to a calm, private studio. Settle the balance after your visit, and tip only if you loved it.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative bg-night py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">How booking works</p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-ivory md:text-5xl">
            Effortless from first tap to afterglow.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120}>
              <div className="card h-full p-8">
                <p className="display text-5xl gold-text">{step.n}</p>
                <h3 className="mt-6 text-xl font-semibold text-ivory">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
