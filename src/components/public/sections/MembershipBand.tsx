"use client";

import { useState } from "react";
import { Reveal } from "@/components/public/Reveal";
import { formatCad } from "@/lib/money";
import { SubscribeModal, type PlanItem } from "@/components/public/SubscribeModal";

export function MembershipBand({ plans }: { plans: PlanItem[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(plans[0] || null);

  if (plans.length === 0) return null;

  function handleOpenSubscribe(plan?: PlanItem) {
    if (plan) setSelectedPlan(plan);
    else setSelectedPlan(plans[0] || null);
    setIsModalOpen(true);
  }

  return (
    <section className="relative bg-[var(--background)] text-[var(--foreground)] py-24 md:py-32 transition-colors duration-200 border-b border-[var(--border-color)]">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div>
              <p className="eyebrow">VIP Esthetics Memberships</p>
              <h2 className="display mt-4 text-4xl text-[var(--ink)] sm:text-5xl">
                Keep the glow, <span className="gold-text italic">all year.</span>
              </h2>
              <p className="mt-6 max-w-md text-ink-soft text-sm sm:text-base leading-relaxed">
                Join a monthly or yearly membership for regular lash maintenance and skincare routines. Pay yearly and enjoy 12 visits for the price of 10.
              </p>
              <button
                type="button"
                onClick={() => handleOpenSubscribe()}
                className="btn-primary mt-8 cursor-pointer shadow-md"
              >
                Start a Membership →
              </button>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan, i) => (
              <Reveal key={plan._id} delay={i * 120}>
                <div
                  onClick={() => handleOpenSubscribe(plan)}
                  className="card group h-full p-7 cursor-pointer hover:border-[#c8a86b]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h3 className="display text-2xl text-[var(--ink)] group-hover:text-[#c8a86b] transition-colors">
                      {plan.name}
                    </h3>
                    <p className="mt-3 gold-text text-3xl font-semibold">
                      {formatCad(plan.priceCents)}
                      <span className="text-sm font-normal text-ink-soft">
                        /{plan.interval}
                      </span>
                    </p>
                    <p className="mt-4 text-xs leading-relaxed text-ink-soft">
                      {plan.description}
                    </p>
                    {plan.includedServiceIds && plan.includedServiceIds.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--ink-soft)]">
                            Covered Services:
                          </p>
                          {plan.visitsPerPeriod && (
                            <span className="text-[10px] font-semibold text-[#c8a86b] bg-[#c8a86b]/10 px-2 py-0.5 rounded-md">
                              {plan.visitsPerPeriod} visit{plan.visitsPerPeriod > 1 ? "s" : ""} / {plan.interval}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {plan.includedServiceIds.map((s) => {
                            const name = typeof s === "object" && s !== null && s.name ? s.name : "Service";
                            const price = typeof s === "object" && s !== null && s.priceCents ? formatCad(s.priceCents) : null;
                            return (
                              <span
                                key={typeof s === "object" ? s._id : String(s)}
                                className="bg-[#c8a86b]/15 border border-[#c8a86b]/30 text-[#c8a86b] text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                              >
                                <span>✨</span>
                                <span>{name}</span>
                                {price && <span className="text-[10px] opacity-80 font-normal">({price} val)</span>}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {plan.billingNote && (
                      <p className="mt-4 text-[11px] uppercase tracking-wider text-gold font-bold">
                        💡 {plan.billingNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
                    <span className="font-bold text-[#c8a86b] group-hover:translate-x-1 transition-transform">
                      Select Plan →
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* SUBSCRIBE MODAL */}
      <SubscribeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedPlan={selectedPlan}
        allPlans={plans}
      />
    </section>
  );
}
