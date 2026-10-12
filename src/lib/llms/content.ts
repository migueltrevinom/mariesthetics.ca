import { getPublishedPostsForDiscovery } from "@/lib/blog/queries";
import { blogPostUrl } from "@/lib/blog/locales";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { getLandingContent } from "@/lib/services/landing/content";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { business, siteUrl } from "@/lib/seo";

export type LlmsBlogRow = {
  slug: string;
  language: string;
  title: string;
  excerpt: string;
  translationGroupId: string;
};

function siteOverview(): string {
  return `# Mari Esthetics

> Private home esthetics studio in West Edmonton (Glastonbury / The Hamptons, T5T), Alberta, Canada.
> Personalized facials, lash lifts, brow shaping, dermaplaning, and skin care in a calm one-on-one setting.

- Website: ${siteUrl}
- Booking: ${siteUrl}/book
- Services & pricing: ${siteUrl}/services
- Location (service area): ${siteUrl}/locations/west-edmonton
- Blog: ${siteUrl}/blog
- Contact: ${siteUrl}/contact
- Phone: ${business.phoneDisplay}
`;
}

/** Renders the blog section for llms.txt / llms-full.txt (exported for tests). */
export function formatLlmsBlogSection(rows: LlmsBlogRow[], full: boolean): string {
  if (!rows.length) {
    return "\n## Blog\n\nNo published articles yet.\n";
  }

  const byGroup = new Map<string, LlmsBlogRow[]>();
  for (const row of rows) {
    const gid = row.translationGroupId;
    if (!byGroup.has(gid)) byGroup.set(gid, []);
    byGroup.get(gid)!.push(row);
  }

  let out = "\n## Blog articles\n\n";
  for (const variants of byGroup.values()) {
    const en = variants.find((v) => v.language === "en") || variants[0];
    out += `### ${en.title}\n`;
    out += `- Summary: ${en.excerpt || en.title}\n`;
    for (const v of variants.sort((a, b) => a.language.localeCompare(b.language))) {
      out += `- [${v.language}] ${blogPostUrl(v.slug)}\n`;
    }
    if (full) {
      out += "\n";
    }
  }
  return out;
}

function formatLlmsServiceLandingsSection(): string {
  let out = "\n## Service guides (West Edmonton)\n\n";
  for (const def of SERVICE_LANDING_PAGES) {
    const en = getLandingContent(def.key, "en");
    out += `### ${en.h1}\n`;
    out += `- Summary: ${en.metaDescription}\n`;
    for (const locale of ["en", "es", "tl", "pa", "ar"] as const) {
      const segment = def.slugs[locale];
      if (!segment) continue;
      out += `- [${locale}] ${siteUrl}${serviceLandingPath(segment)}\n`;
    }
    out += "\n";
  }
  return out;
}

export async function buildLlmsTxt(full = false): Promise<string> {
  const discovery = await getPublishedPostsForDiscovery();
  const rows: LlmsBlogRow[] = discovery.map((r) => ({
    slug: r.slug,
    language: r.language,
    title: r.title,
    excerpt: r.excerpt,
    translationGroupId: r.translationGroupId,
  }));

  const header = siteOverview();
  const services = formatLlmsServiceLandingsSection();
  const blog = formatLlmsBlogSection(rows, full);
  const footer = full
    ? `\n## Business\n\n${business.description}\n\nAreas served: ${business.areasServed.join(", ")}.\n`
    : "";
  return `${header}${services}${blog}${footer}`.trim() + "\n";
}
