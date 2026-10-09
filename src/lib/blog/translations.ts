import type { Locale } from "@/components/i18n/LanguageContext";
import type { BlogLanguage, BlogListItem } from "@/lib/blog/types";

type GroupedDoc = BlogListItem & { translationGroupId?: string };

function groupIdFor(doc: GroupedDoc): string {
  return doc.translationGroupId || doc._id;
}

/**
 * For each translation group, pick the visitor locale variant or English fallback.
 */
export function pickLocalizedPostsForListing(
  published: GroupedDoc[],
  locale: Locale
): BlogListItem[] {
  const byGroup = new Map<string, GroupedDoc[]>();

  for (const post of published) {
    const gid = groupIdFor(post);
    if (!byGroup.has(gid)) byGroup.set(gid, []);
    byGroup.get(gid)!.push(post);
  }

  const selected: BlogListItem[] = [];

  for (const variants of byGroup.values()) {
    const inLocale = variants.find((p) => p.language === locale);
    const match = inLocale || variants.find((p) => p.language === "en") || variants[0];
    if (match) {
      selected.push({
        _id: match._id,
        translationGroupId: match.translationGroupId || match._id,
        title: match.title,
        slug: match.slug,
        excerpt: match.excerpt,
        coverImage: match.coverImage,
        language: match.language,
        category: match.category,
        publishedAt: match.publishedAt,
        localeFallback: !inLocale && locale !== match.language,
      });
    }
  }

  selected.sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });

  return selected;
}

export function toTranslationLinks(
  docs: Array<{ language: BlogLanguage; slug: string; title?: string; status?: string }>
): Array<{ language: BlogLanguage; slug: string; title?: string }> {
  return docs
    .filter((d) => d.status === undefined || d.status === "published")
    .map((d) => ({
      language: d.language,
      slug: d.slug,
      title: d.title,
    }));
}
