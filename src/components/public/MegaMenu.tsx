"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { whatsappUrl } from "@/lib/config";
import { business } from "@/lib/seo";
import { formatCad } from "@/lib/money";
import { Logo } from "@/components/public/Logo";

export type NavService = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  facial: "Facials",
  lashes: "Lashes",
  brows: "Brows",
  general: "More",
};

const CATEGORY_ORDER = ["facial", "lashes", "brows", "general"];

const CATEGORY_BLURB: Record<string, string> = {
  facial: "Custom facials & dermaplaning",
  lashes: "Lifts & lash maintenance",
  brows: "Shaping, tint & definition",
  general: "Everything else we offer",
};

const exploreLinks = [
  { href: "/services", label: "All services" },
  { href: "/book", label: "Book an appointment" },
  { href: "/services#memberships", label: "Memberships" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Client login" },
];

function groupByCategory(services: NavService[]) {
  const map = new Map<string, NavService[]>();
  for (const svc of services) {
    const key = CATEGORY_LABELS[svc.category] ? svc.category : "general";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(svc);
  }
  const ordered = [...map.entries()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]),
  );
  return ordered.map(([category, items]) => ({
    category,
    label: CATEGORY_LABELS[category] ?? "More",
    blurb: CATEGORY_BLURB[category] ?? "Explore our menu",
    count: items.length,
    from: Math.min(...items.map((i) => i.priceCents)),
  }));
}

export function MegaMenu({
  open,
  onClose,
  navServices,
}: {
  open: boolean;
  onClose: () => void;
  navServices: NavService[];
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const t = setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const categories = groupByCategory(navServices);
  const tiles = categories.length > 0 ? categories : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 transition-all duration-500 ${
        open ? "visible opacity-100" : "invisible opacity-0"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-[rgba(6,9,7,0.6)] backdrop-blur-sm"
      />

      {/* Panel */}
      <div
        className={`mega-frame absolute inset-2 overflow-y-auto transition-all duration-500 md:inset-4 ${
          open ? "translate-y-0 scale-100" : "-translate-y-3 scale-[0.98]"
        }`}
      >
        <div className="grain absolute inset-0 rounded-[inherit]" />

        <div className="relative flex min-h-full flex-col px-6 py-6 md:px-12 md:py-10">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <Link href="/" onClick={onClose} aria-label="Mari Esthetics home">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/book"
                onClick={onClose}
                className="btn-primary hidden !py-2.5 !px-5 text-sm sm:inline-flex"
              >
                Book a service
              </Link>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-ivory transition hover:border-gold hover:text-gold-bright"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M1 1l16 16M17 1L1 17"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="mt-10 grid flex-1 gap-10 md:mt-14 md:grid-cols-[0.9fr_1.4fr_0.7fr] md:gap-12">
            {/* Left: heading + motif */}
            <div className={`menu-enter ${open ? "is-in" : ""} relative flex flex-col`}>
              <p className="eyebrow">The studio</p>
              <h2 className="display mt-4 text-4xl leading-[0.95] text-ivory md:text-5xl">
                Edmonton skin care,
                <span className="gold-text italic"> by appointment.</span>
              </h2>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-soft">
                Private, unhurried treatments tailored to your skin. Explore the
                menu or jump straight to booking.
              </p>

              <div className="relative mt-auto hidden pt-10 md:block">
                <span
                  aria-hidden
                  className="display pointer-events-none absolute -bottom-10 -left-4 select-none text-[14rem] leading-none text-[rgba(200,168,107,0.06)]"
                >
                  M
                </span>
                <svg
                  className="relative w-full max-w-[260px]"
                  viewBox="0 0 260 120"
                  fill="none"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="megaline" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#e2c78c" />
                      <stop offset="0.6" stopColor="#2f6b50" />
                      <stop offset="1" stopColor="#c8a86b" />
                    </linearGradient>
                  </defs>
                  <path
                    className={open ? "drawline" : ""}
                    d="M2 60 L70 60 L100 20 L150 100 L190 40 L258 40"
                    stroke="url(#megaline)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Center: tiles */}
            <div className={`menu-enter ${open ? "is-in" : ""} grid gap-4 sm:grid-cols-2`} style={{ transitionDelay: "60ms" }}>
              {tiles ? (
                tiles.map((tile, i) => (
                  <Link
                    key={tile.category}
                    href={`/services#${tile.category}`}
                    onClick={onClose}
                    className="mega-tile group"
                    style={{ transitionDelay: `${100 + i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="display text-3xl text-ivory md:text-4xl">
                        {tile.label}
                      </h3>
                      <span className="text-gold opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                        →
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ink-soft">{tile.blurb}</p>
                    <p className="mt-6 text-xs uppercase tracking-wider text-[var(--ivory-faint)]">
                      {tile.count} {tile.count === 1 ? "treatment" : "treatments"}
                      {" · from "}
                      {formatCad(tile.from)}
                    </p>
                  </Link>
                ))
              ) : (
                <Link
                  href="/services"
                  onClick={onClose}
                  className="mega-tile group sm:col-span-2"
                >
                  <h3 className="display text-3xl text-ivory md:text-4xl">
                    View all services
                  </h3>
                  <p className="mt-2 text-sm text-ink-soft">
                    Browse treatments and transparent pricing.
                  </p>
                </Link>
              )}

              <Link
                href="/book"
                onClick={onClose}
                className="mega-tile mega-tile--accent group sm:col-span-2"
                style={{ transitionDelay: "340ms" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="display text-3xl text-[#24180a] md:text-4xl">
                      Book an appointment
                    </h3>
                    <p className="mt-2 text-sm text-[#4a3a1e]">
                      Choose a time and secure it with a quick deposit.
                    </p>
                  </div>
                  <span className="text-2xl text-[#24180a] transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: explore + footer */}
            <div className={`menu-enter ${open ? "is-in" : ""} flex flex-col`} style={{ transitionDelay: "120ms" }}>
              <p className="eyebrow">Explore</p>
              <ul className="mt-5 space-y-1">
                {exploreLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="group flex items-center justify-between border-b border-[var(--line-soft)] py-3 text-lg text-ivory transition-colors hover:text-gold-bright"
                    >
                      {link.label}
                      <span className="text-gold opacity-0 transition group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={whatsappUrl("Hi Mari, I’d like to ask about an appointment.")}
                    target="_blank"
                    rel="noreferrer"
                    onClick={onClose}
                    className="group flex items-center justify-between border-b border-[var(--line-soft)] py-3 text-lg text-ivory transition-colors hover:text-gold-bright"
                  >
                    WhatsApp
                    <span className="text-gold opacity-0 transition group-hover:opacity-100">
                      ↗
                    </span>
                  </a>
                </li>
              </ul>

              <div className="mt-auto space-y-2 pt-10 text-sm text-ink-soft">
                <p>Tue – Sat · 9:00 am – 6:00 pm</p>
                <p>
                  {business.locality}, {business.region} · by appointment
                </p>
                <div className="flex gap-4 pt-2 text-xs uppercase tracking-wider">
                  {business.sameAs.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--ivory-faint)] transition hover:text-gold-bright"
                    >
                      {url.includes("instagram") ? "Instagram" : "Facebook"}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
