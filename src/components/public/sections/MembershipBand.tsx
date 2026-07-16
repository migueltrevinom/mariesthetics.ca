import Link from "next/link";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";

type Plan = {
  _id: string;
  name: string;
  description: string;
  interval: string;
  priceCents: number;
  billingNote?: string;
};

export function MembershipBand({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) return null;

  return (
    <section className="relative bg-[var(--background)] text-[var(--foreground)] py-24 md:py-32 transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div>
              <p className="eyebrow">Memberships</p>
              <h2 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl">
                Keep the glow, all year.
              </h2>
              <p className="mt-6 max-w-md text-ink-soft leading-relaxed">
                Join a membership for regular lash maintenance and skin care.
                Pay yearly and enjoy twelve visits for the price of ten.
              </p>
              <Link href="/book" className="btn-primary mt-8">
                Start a membership
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {plans.slice(0, 2).map((plan, i) => (
              <Reveal key={plan._id} delay={i * 120}>
                <div className="card h-full p-7">
                  <h3 className="display text-2xl text-[var(--ink)]">{plan.name}</h3>
                  <p className="mt-3 gold-text text-3xl font-semibold">
                    {formatCad(plan.priceCents)}
                    <span className="text-sm font-normal text-ink-soft">
                      {" "}
                      /{plan.interval}
                    </span>
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                    {plan.description}
                  </p>
                  {plan.billingNote && (
                    <p className="mt-4 text-xs uppercase tracking-wider text-gold">
                      {plan.billingNote}
                    </p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
