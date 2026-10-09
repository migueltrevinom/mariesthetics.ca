import Link from "next/link";
import { formatCad } from "@/lib/money";
import type { BlogServiceRef } from "@/lib/blog/types";

export function BlogRelatedServices({ services }: { services: BlogServiceRef[] }) {
  if (!services.length) return null;

  return (
    <section className="mt-14 border-t border-[var(--border-color)] pt-10">
      <p className="eyebrow">Related treatments</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {services.map((svc) => (
          <li key={svc._id}>
            <Link
              href={svc.slug ? `/services#${svc.slug}` : "/services"}
              className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3 text-sm transition-colors hover:border-gold hover:text-gold-bright"
            >
              <span className="font-semibold text-[var(--ink)]">{svc.name}</span>
              {svc.priceCents != null ? (
                <span className="text-[var(--ink-soft)]">{formatCad(svc.priceCents)}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
