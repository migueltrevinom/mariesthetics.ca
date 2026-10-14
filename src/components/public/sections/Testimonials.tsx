"use client";

import { useEffect, useState } from "react";
import { Reveal } from "@/components/public/Reveal";
import type { GoogleReviewsSnapshot } from "@/lib/googleReviews";

type Quote = { quote: string; name: string; detail: string; href?: string };

/** Real reviews only: Google Business Profile reviews (server) + submitted site reviews. No placeholders. */
export function Testimonials({ google }: { google?: GoogleReviewsSnapshot | null }) {
  const googleQuotes: Quote[] = (google?.reviews || [])
    .filter((r) => r.text.trim())
    .slice(0, 3)
    .map((r) => ({
      quote: r.text,
      name: r.authorName,
      detail: `${"★".repeat(Math.round(r.rating))} Google${r.relativeTime ? ` · ${r.relativeTime}` : ""}`,
      href: r.authorUri,
    }));
  const [siteQuotes, setSiteQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    fetch("/api/public/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reviews)) {
          setSiteQuotes(
            data.reviews
              .filter((r: { comment?: string }) => r.comment && r.comment.trim())
              .map((r: { comment: string; guest?: { name?: string }; serviceId?: { name?: string } }) => ({
                quote: r.comment,
                name: r.guest?.name || "Client",
                detail: r.serviceId?.name || "Esthetics Treatment",
              }))
          );
        }
      })
      .catch((err) => console.error("[Public Testimonials Fetch Error]:", err));
  }, []);

  const quotes = [...googleQuotes, ...siteQuotes].slice(0, 6);
  if (!quotes.length && !google) return null;

  return (
    <section className="paper relative overflow-hidden py-24 md:py-32">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Kind words</p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-[var(--ink)] md:text-5xl">
            Loved by clients across Edmonton.
          </h2>
          {google && (
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              <span className="text-[#c8a86b] font-bold">{google.rating.toFixed(1)} ★</span> from{" "}
              {google.googleMapsUri ? (
                <a href={google.googleMapsUri} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {google.userRatingCount} Google reviews
                </a>
              ) : (
                `${google.userRatingCount} Google reviews`
              )}
            </p>
          )}
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={`${q.name}-${i}`} delay={i * 100}>
              <figure className="card h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="display text-6xl leading-none gold-text">“</span>
                  <blockquote className="mt-2 text-base md:text-lg leading-relaxed text-[var(--ink)]">
                    {q.quote}
                  </blockquote>
                </div>
                <figcaption className="mt-6 text-sm text-[var(--ink-soft)] font-medium pt-4 border-t border-[var(--border-color)]">
                  {q.href ? (
                    <a href={q.href} target="_blank" rel="noopener noreferrer" className="text-[#c8a86b] font-bold">
                      {q.name}
                    </a>
                  ) : (
                    <span className="text-[#c8a86b] font-bold">{q.name}</span>
                  )}{" "}
                  · {q.detail}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
