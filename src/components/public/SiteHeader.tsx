"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MegaMenu, type NavService } from "@/components/public/MegaMenu";
import { Logo } from "@/components/public/Logo";

export function SiteHeader({ navServices = [] }: { navServices?: NavService[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "border-b border-[var(--line-strong)] bg-[rgba(9,13,10,0.9)] backdrop-blur-xl"
            : "border-b border-transparent bg-gradient-to-b from-[rgba(6,9,7,0.55)] to-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" aria-label="Mari Esthetics home">
            <Logo size="md" />
          </Link>

          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/book"
              className="btn-primary hidden !py-2.5 !px-5 text-sm sm:inline-flex"
            >
              Book a service
            </Link>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="group flex items-center gap-3 rounded-full border border-[var(--line-strong)] py-2 pl-4 pr-3 text-sm text-ivory transition hover:border-gold hover:text-gold-bright"
            >
              <span className="tracking-wide">Menu</span>
              <span className="flex h-6 w-6 flex-col items-center justify-center gap-1">
                <span className="h-px w-4 bg-current transition-all duration-300 group-hover:w-5" />
                <span className="h-px w-5 bg-current" />
                <span className="h-px w-3 bg-current transition-all duration-300 group-hover:w-5" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MegaMenu
        open={open}
        onClose={() => setOpen(false)}
        navServices={navServices}
      />
    </>
  );
}
