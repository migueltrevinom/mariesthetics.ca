"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingBookButton() {
  const pathname = usePathname();

  // Suppress floating book button on portal, booking flow, and auth screens to prevent obstructing action cards
  if (
    pathname?.startsWith("/portal") ||
    pathname?.startsWith("/book") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <aside aria-label="Quick booking" className="fixed bottom-5 right-5 z-30 md:hidden print:hidden">
      <Link href="/book" className="btn-primary shadow-[var(--shadow)]">
        Book
      </Link>
    </aside>
  );
}
