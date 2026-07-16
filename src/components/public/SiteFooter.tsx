import Link from "next/link";
import { whatsappUrl } from "@/lib/config";
import { business } from "@/lib/seo";
import { Logo } from "@/components/public/Logo";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

const nav = [
  { href: "/services", label: "Services" },
  { href: "/book", label: "Book an appointment" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Client login" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-color)] bg-[var(--mist)] text-[var(--ink)] transition-colors duration-200">
      <div className="aurora-soft pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo size="lg" tagline />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-ink-soft">
              A private esthetics studio serving {business.locality} and area.
              Personalized skin care in a calm, one-on-one setting.
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              Serving {business.neighbourhood} &amp; {business.regionName}
            </p>
          </div>

          <div>
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-gold-bright">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="eyebrow">Visit &amp; hours</p>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {nav.map((item) => (
                <li key={item.label} className="pt-0">{item.label === "Book an appointment" ? null : null}</li>
              ))}
              <li>Tuesday – Saturday</li>
              <li>9:00 am – 6:00 pm</li>
              <li className="pt-2">
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-gold-bright"
                >
                  WhatsApp {business.phoneDisplay}
                </a>
              </li>
              <li>{business.locality}, {business.region}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--ink-soft)] sm:flex-row sm:items-center">
          <div>
            <p>© {new Date().getFullYear()} {business.name}. Edmonton, Alberta.</p>
            <p className="mt-1 text-[var(--ink-soft)]/70">Personalized skin care · By appointment</p>
          </div>
          
          <div className="w-full sm:w-48 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
