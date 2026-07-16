"use client";

import { useState } from "react";
import { faqItems } from "@/lib/faq";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative bg-[var(--background)] text-[var(--foreground)] py-24 md:py-32 transition-colors duration-200">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <p className="eyebrow">Questions</p>
        <h2 className="display mt-4 text-4xl text-[var(--ink)] md:text-5xl">
          Good to know.
        </h2>
        <div className="mt-12 divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)]">
          {faqItems.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                >
                  <span className="text-lg text-[var(--ink)]">{item.q}</span>
                  <span
                    className={`shrink-0 text-2xl text-gold transition-transform duration-300 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
