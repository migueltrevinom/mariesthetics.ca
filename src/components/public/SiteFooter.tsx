"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { whatsappUrl } from "@/lib/config";
import { business } from "@/lib/seo";
import { Logo } from "@/components/public/Logo";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { useLanguage } from "@/components/i18n/LanguageContext";

export interface SocialLinkItem {
  _id: string;
  platform: string;
  label: string;
  url: string;
}

export function SiteFooter() {
  const { t } = useLanguage();
  const [socials, setSocials] = useState<SocialLinkItem[]>([]);

  useEffect(() => {
    async function loadSocials() {
      try {
        const res = await fetch("/api/public/socials");
        if (res.ok) {
          const data = await res.json();
          setSocials(data.socials || []);
        }
      } catch {
        // quiet catch fallback
      }
    }
    void loadSocials();
  }, []);

  const nav = [
    {
      href: "/services",
      label: t("nav.services") !== "nav.services" ? t("nav.services") : "Services",
    },
    {
      href: "/book",
      label: t("nav.book") !== "nav.book" ? t("nav.book") : "Book an appointment",
    },
    {
      href: "/contact",
      label: t("nav.contact") !== "nav.contact" ? t("nav.contact") : "Contact",
    },
    {
      href: "/login",
      label: t("megaMenu.clientLogin") !== "megaMenu.clientLogin" ? t("megaMenu.clientLogin") : "Client login",
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-[var(--border-color)] bg-[var(--mist)] text-[var(--ink)] transition-colors duration-200">
      <div className="aurora-soft pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand Info */}
          <div>
            <Logo size="lg" tagline />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-[var(--ink-soft)]">
              A private esthetics studio serving {business.locality} and area.
              Personalized skin care in a calm, one-on-one setting.
            </p>
            <p className="mt-4 text-sm text-[var(--ink-soft)]">
              Serving {business.neighbourhood} &amp; {business.regionName}
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <p className="eyebrow">
              {t("megaMenu.explore") !== "megaMenu.explore"
                ? t("megaMenu.explore")
                : "Explore"}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-gold-bright">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours & Location */}
          <div>
            <p className="eyebrow">
              {t("contactPage.hoursEyebrow") !== "contactPage.hoursEyebrow"
                ? t("contactPage.hoursEyebrow")
                : "Visit & Hours"}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-[var(--ink-soft)]">
              <li>
                {t("contactPage.hoursValue") !== "contactPage.hoursValue"
                  ? t("contactPage.hoursValue")
                  : "Monday – Saturday"}
              </li>
              <li>9:00 am – 8:00 pm</li>
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

          {/* Social Channels */}
          <div>
            <p className="eyebrow">Connect &amp; Socials</p>
            <p className="mt-4 text-xs text-[var(--ink-soft)] leading-relaxed">
              Follow Mari Esthetics for latest transformations, skin care tips &amp; promotions.
            </p>

            {socials.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {socials.map((item) => (
                  <a
                    key={item._id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] hover:border-[#c8a86b] hover:text-[#c8a86b] transition-all shadow-sm group"
                  >
                    <SocialIcon platform={item.platform} className="w-3.5 h-3.5 text-[#c8a86b] group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://instagram.com/mariesthetics"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] hover:border-[#c8a86b] hover:text-[#c8a86b] transition-all shadow-sm group"
                >
                  <SocialIcon platform="instagram" className="w-3.5 h-3.5 text-[#c8a86b] group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://facebook.com/mariesthetics"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--ink)] hover:border-[#c8a86b] hover:text-[#c8a86b] transition-all shadow-sm group"
                >
                  <SocialIcon platform="facebook" className="w-3.5 h-3.5 text-[#c8a86b] group-hover:scale-110 transition-transform" />
                  <span>Facebook</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-start justify-between gap-6 border-t border-[var(--border-color)] pt-6 text-xs text-[var(--ink-soft)] sm:flex-row sm:items-center">
          <div>
            <p>© {new Date().getFullYear()} {business.name}. Edmonton, Alberta.</p>
            <p className="mt-1 text-[var(--ink-soft)]/70">
              Personalized skin care ·{" "}
              {t("megaMenu.byAppointment") !== "megaMenu.byAppointment"
                ? t("megaMenu.byAppointment")
                : "By appointment"}
            </p>
          </div>
          
          <div className="w-full sm:w-48 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
