import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";
import { BLOG_DEV_PREVIEW_ENABLED, getPreviewListItems } from "@/lib/blog/previewPosts";
import { blogPostUrl } from "@/lib/blog/locales";
import { business, siteUrl } from "@/lib/seo";

type BlogLlmsRow = {
  slug: string;
  language: string;
  title: string;
  excerpt: string;
  translationGroupId: string;
};

async function fetchPublishedBlogRows(): Promise<BlogLlmsRow[]> {
  if (BLOG_DEV_PREVIEW_ENABLED) {
    return getPreviewListItems().map((p) => ({
      slug: p.slug,
      language: p.language,
      title: p.title,
      excerpt: p.excerpt,
      translationGroupId: p.translationGroupId,
    }));
  }
  await connectDb();
  const rows = await BlogPost.find({ status: "published" })
    .select("slug language title excerpt translationGroupId")
    .sort({ publishedAt: -1 })
    .lean();
  return rows.map((r) => ({
    slug: String(r.slug),
    language: String(r.language || "en"),
    title: String(r.title),
    excerpt: String(r.excerpt || ""),
    translationGroupId: String(r.translationGroupId || r._id),
  }));
}

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

function formatBlogSection(rows: BlogLlmsRow[], full: boolean): string {
  if (!rows.length) {
    return "\n## Blog\n\nNo published articles yet.\n";
  }

  const byGroup = new Map<string, BlogLlmsRow[]>();
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

export async function buildLlmsTxt(full = false): Promise<string> {
  const rows = await fetchPublishedBlogRows().catch(() => []);
  const header = siteOverview();
  const blog = formatBlogSection(rows, full);
  const footer = full
    ? `\n## Business\n\n${business.description}\n\nAreas served: ${business.areasServed.join(", ")}.\n`
    : "";
  return `${header}${blog}${footer}`.trim() + "\n";
}
