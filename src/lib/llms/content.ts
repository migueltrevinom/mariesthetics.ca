import { getPublishedPostsForDiscovery, type PublishedBlogDiscoveryRow } from "@/lib/blog/queries";
import { blogPostUrl } from "@/lib/blog/locales";
import { SERVICE_LANDING_PAGES } from "@/lib/services/landing/registry";
import { getLandingContent } from "@/lib/services/landing/content";
import { serviceLandingPath } from "@/lib/services/landing/paths";
import { landingDefinitionForService } from "@/lib/services/landing/resolve";
import { LANDING_CHIP_LABELS } from "@/lib/services/landing/quickLabels";
import type { LandingDefinition, LandingKey } from "@/lib/services/landing/types";
import { business, siteUrl } from "@/lib/seo";
import { formatCad } from "@/lib/money";
import { connectDb } from "@/lib/db/connect";
import { BlogPost, Service } from "@/lib/db/models";
import { isVolumeLash } from "@/lib/services/landing/volumeMatch";

export type LlmsServiceRow = { _id: string; name: string; slug: string; category: string; priceCents: number; depositCents: number; durationMin: number };

export type LlmsBlogRow = {
  slug: string;
  language: string;
  title: string;
  excerpt: string;
  shortAnswer?: string;
  category?: string;
  serviceIds?: string[];
  translationGroupId: string;
};

const LANGS = ["en", "es", "tl", "pa", "ar"] as const;
const LANG_NAMES: Record<string, string> = { en: "English", es: "Español", tl: "Tagalog", pa: "ਪੰਜਾਬੀ (Punjabi)", ar: "العربية (Arabic)" };
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

function siteOverview(): string {
  return `# Mari Esthetics

> Private home esthetics studio in West Edmonton (Glastonbury / The Hamptons, T5T), Alberta, Canada.
> Lash extensions, powder brows, lip blush, lip neutralization and facials in a calm one-on-one setting with esthetician Marinelle Trevino.

- Website: ${siteUrl}
- Booking: ${siteUrl}/book
- Services & pricing: ${siteUrl}/services
- Location (service area): ${siteUrl}/locations/west-edmonton
- Blog index: ${siteUrl}/blog
- Author: ${siteUrl}/about/marinelle (Marinelle Trevino, esthetician, Mari Esthetics)
- Contact: ${siteUrl}/contact
- Phone: ${business.phoneDisplay}
- Prices below are read live from the studio's booking system.
`;
}

function matches(def: LandingDefinition, s: LlmsServiceRow) {
  if (def.match.type === "category") return s.category === def.match.category;
  if (def.match.type === "volumeLashes") return isVolumeLash(s);
  return def.match.slugs.includes(s.slug);
}

/** Service guides with live prices from the DB (exported for tests). */
export function formatLlmsServiceLandingsSection(services: LlmsServiceRow[]): string {
  let out = "\n## Service guides (West Edmonton)\n\n";
  for (const def of SERVICE_LANDING_PAGES) {
    const en = getLandingContent(def.key, "en");
    out += `### ${en.h1}\n`;
    out += `- Summary: ${en.metaDescription}\n`;
    const priced = services.filter((s) => matches(def, s) && s.priceCents > 0).sort((a, b) => a.priceCents - b.priceCents);
    if (priced.length) {
      out += `- Live prices: ${priced
        .map((s) => `${s.name} ${formatCad(s.priceCents)} (${s.durationMin} min${s.depositCents ? `, ${formatCad(s.depositCents)} deposit` : ""})`)
        .join("; ")}\n`;
    }
    for (const locale of LANGS) {
      const segment = def.slugs[locale];
      if (!segment) continue;
      out += `- [${locale}] ${siteUrl}${serviceLandingPath(segment)}\n`;
    }
    out += "\n";
  }
  return out;
}

function serviceKeyFor(row: LlmsBlogRow, byId: Map<string, LlmsServiceRow>): LandingKey | "other" {
  for (const id of row.serviceIds || []) {
    const s = byId.get(id);
    const def = s ? landingDefinitionForService({ category: s.category, slug: s.slug, name: s.name, _id: s._id }) : undefined;
    if (def) return def.key;
  }
  if (row.category === "lashes") return "lash-extensions";
  if (row.category === "facials") return "facial-west";
  return "other";
}

/** Blog posts grouped by language, then service; each with its short answer (or excerpt). */
export function formatLlmsBlogSection(rows: LlmsBlogRow[], full: boolean, services: LlmsServiceRow[] = []): string {
  if (!rows.length) return "\n## Blog\n\nNo published articles yet.\n";
  const byId = new Map(services.map((s) => [s._id, s]));
  const order: Array<LandingKey | "other"> = [...SERVICE_LANDING_PAGES.map((d) => d.key), "other"];
  let out = `\n## Blog articles (${rows.length} published, by language and service)\n`;
  for (const lang of LANGS) {
    const inLang = rows.filter((r) => r.language === lang);
    if (!inLang.length) continue;
    out += `\n## Blog — ${LANG_NAMES[lang]} (${inLang.length})\n`;
    for (const key of order) {
      const group = inLang.filter((r) => serviceKeyFor(r, byId) === key);
      if (!group.length) continue;
      const label = key === "other" ? "Other topics" : LANDING_CHIP_LABELS[key]?.[lang] || LANDING_CHIP_LABELS[key]?.en || key;
      out += `\n### ${label}\n`;
      for (const r of group) {
        const summary = oneLine(r.shortAnswer || r.excerpt || r.title);
        out += `- [${oneLine(r.title)}](${blogPostUrl(r.slug)}): ${full ? summary : summary.slice(0, 400)}\n`;
      }
    }
  }
  return out;
}

async function loadServices(): Promise<LlmsServiceRow[]> {
  try {
    await connectDb();
    const rows = (await Service.find({ active: true }).select("name slug category priceCents depositCents durationMin").lean()) as Array<Record<string, unknown>>;
    return rows.map((s) => ({
      _id: String(s._id),
      name: String(s.name ?? ""),
      slug: String(s.slug ?? ""),
      category: String(s.category ?? ""),
      priceCents: Number(s.priceCents) || 0,
      depositCents: Number(s.depositCents) || 0,
      durationMin: Number(s.durationMin) || 0,
    }));
  } catch {
    return [];
  }
}

/** Cheap change fingerprint: published count + newest updatedAt + services' newest updatedAt. */
async function fingerprint(): Promise<string> {
  await connectDb();
  const [count, newest, svc] = await Promise.all([
    BlogPost.countDocuments({ status: "published" }),
    BlogPost.findOne({ status: "published" }).sort({ updatedAt: -1 }).select("updatedAt").lean<{ updatedAt?: Date }>(),
    Service.findOne({}).sort({ updatedAt: -1 }).select("updatedAt").lean<{ updatedAt?: Date }>(),
  ]);
  return `${count}|${newest?.updatedAt ? new Date(newest.updatedAt).getTime() : 0}|${svc?.updatedAt ? new Date(svc.updatedAt).getTime() : 0}`;
}

const cache = new Map<boolean, { fp: string; at: number; body: string }>();
const MAX_AGE_MS = 60 * 60 * 1000;

/** Rebuilt whenever a post/service is inserted or updated (fingerprint changes); else served from memory. */
export async function buildLlmsTxt(full = false): Promise<string> {
  const fp = await fingerprint();
  const hit = cache.get(full);
  if (hit && hit.fp === fp && Date.now() - hit.at < MAX_AGE_MS) return hit.body;

  const [discovery, services] = await Promise.all([getPublishedPostsForDiscovery(), loadServices()]);
  const rows: LlmsBlogRow[] = discovery.map((r: PublishedBlogDiscoveryRow) => ({
    slug: r.slug,
    language: r.language,
    title: r.title,
    excerpt: r.excerpt,
    shortAnswer: r.shortAnswer,
    category: r.category,
    serviceIds: r.serviceIds,
    translationGroupId: r.translationGroupId,
  }));
  const footer = full
    ? `\n## Business\n\n${business.description}\n\nAreas served: ${business.areasServed.join(", ")}.\n`
    : "";
  const body = `${siteOverview()}${formatLlmsServiceLandingsSection(services)}${formatLlmsBlogSection(rows, full, services)}${footer}`.trim() + "\n";
  cache.set(full, { fp, at: Date.now(), body });
  return body;
}
