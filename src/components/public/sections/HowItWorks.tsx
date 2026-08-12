"use client";

import { Reveal } from "@/components/public/Reveal";
import { useLanguage } from "@/components/i18n/LanguageContext";

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    {
      n: "01",
      title:
        t("howItWorksSection.step1Title") !== "howItWorksSection.step1Title"
          ? t("howItWorksSection.step1Title")
          : "Pick Your Ritual",
      body:
        t("howItWorksSection.step1Body") !== "howItWorksSection.step1Body"
          ? t("howItWorksSection.step1Body")
          : "Explore 13 curated facials, lash sets, and brow treatments with transparent pricing.",
    },
    {
      n: "02",
      title:
        t("howItWorksSection.step2Title") !== "howItWorksSection.step2Title"
          ? t("howItWorksSection.step2Title")
          : "Select Your Time",
      body:
        t("howItWorksSection.step2Body") !== "howItWorksSection.step2Body"
          ? t("howItWorksSection.step2Body")
          : "Pick a date and time that fits your day with live Edmonton appointment availability.",
    },
    {
      n: "03",
      title:
        t("howItWorksSection.step3Title") !== "howItWorksSection.step3Title"
          ? t("howItWorksSection.step3Title")
          : "Lock Your Session",
      body:
        t("howItWorksSection.step3Body") !== "howItWorksSection.step3Body"
          ? t("howItWorksSection.step3Body")
          : "Secure your private 1-on-1 slot instantly with a small card deposit or Interac e-Transfer.",
    },
  ];

  return (
    <section className="relative bg-[var(--background)] text-[var(--foreground)] py-24 md:py-32 transition-colors duration-200 border-b border-[var(--border-color)]">
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">
            {t("howItWorksSection.eyebrow") !== "howItWorksSection.eyebrow"
              ? t("howItWorksSection.eyebrow")
              : "Effortless Online Booking"}
          </p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-[var(--ink)] sm:text-5xl">
            {t("howItWorksSection.title1") !== "howItWorksSection.title1"
              ? t("howItWorksSection.title1")
              : "Your appointment in"}{" "}
            <span className="gold-text italic">
              {t("howItWorksSection.title2") !== "howItWorksSection.title2"
                ? t("howItWorksSection.title2")
                : "3 easy steps."}
            </span>
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
