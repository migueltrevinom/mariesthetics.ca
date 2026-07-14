import { Reveal } from "@/components/public/Reveal";

// Placeholder testimonials — replace with real client quotes.
// Intentionally NOT emitted as Review/AggregateRating structured data
// until genuine reviews exist (avoids Google rich-result penalties).
const quotes = [
  {
    quote:
      "The calmest, most personalized facial I've had in Edmonton. My skin has never looked better.",
    name: "A. R.",
    detail: "Signature Facial",
  },
  {
    quote:
      "Booking took a minute, the studio is gorgeous, and the lash lift lasted weeks.",
    name: "J. M.",
    detail: "Classic Lash Lift",
  },
  {
    quote:
      "Finally an esthetician who actually listens. Thoughtful, precise, and so relaxing.",
    name: "S. L.",
    detail: "Brow Shape & Tint",
  },
];

export function Testimonials() {
  return (
    <section className="paper relative overflow-hidden py-24 md:py-32">
      <div className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-6 md:px-10">
        <Reveal>
          <p className="eyebrow">Kind words</p>
          <h2 className="display mt-4 max-w-2xl text-4xl text-ivory md:text-5xl">
            Loved by clients across Edmonton.
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={q.name} delay={i * 120}>
              <figure className="card h-full p-8">
                <span className="display text-6xl leading-none gold-text">“</span>
                <blockquote className="mt-2 text-lg leading-relaxed text-ivory">
                  {q.quote}
                </blockquote>
                <figcaption className="mt-6 text-sm text-ink-soft">
                  <span className="text-gold-bright">{q.name}</span> · {q.detail}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
