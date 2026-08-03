"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/public/Reveal";

const defaultQuotes = [
  {
    quote: "The calmest, most personalized facial I've had in Edmonton. My skin has never looked better.",
    name: "A. R.",
    detail: "Signature Facial",
  },
  {
    quote: "Booking took a minute, the studio is gorgeous, and the lash lift lasted weeks.",
    name: "J. M.",
    detail: "Classic Lash Lift",
  },
  {
    quote: "Finally an esthetician who actually listens. Thoughtful, precise, and so relaxing.",
    name: "S. L.",
    detail: "Brow Shape & Tint",
  },
];

export function Testimonials() {
  const [quotes, setQuotes] = useState(defaultQuotes);

  useEffect(() => {
    fetch("/api/public/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const liveQuotes = data.reviews.map((r: any) => ({
            quote: r.comment || "Exceptional service and beautiful results!",
            name: r.guest?.name || "Verified Client",
            detail: r.serviceId?.name || "Esthetics Treatment",
          }));
          setQuotes([...liveQuotes, ...defaultQuotes]);
        }
      })
      .catch((err) => console.error("[Public Testimonials Fetch Error]:", err));
  }, []);

  return (
    <section className="paper relative overflow-hidden py-24 md:py-32">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Kind words</p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-[var(--ink)] md:text-5xl">
            Loved by clients across Edmonton.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.slice(0, 6).map((q, i) => (
            <Reveal key={`${q.name}-${i}`} delay={i * 100}>
              <figure className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="display text-6xl leading-none gold-text">“</span>
                  <blockquote className="mt-2 text-base md:text-lg leading-relaxed text-[var(--ink)]">
                    {q.quote}
                  </blockquote>
                </div>
                <figcaption className="mt-6 text-sm text-[var(--ink-soft)] font-medium pt-4 border-t border-[var(--border-color)]">
                  <span className="text-[#c8a86b] font-bold">{q.name}</span> · {q.detail}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
