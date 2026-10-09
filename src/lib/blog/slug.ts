/**
 * Blog post slugs may contain Arabic and other non-Latin scripts.
 * Admin slugify() stores NFKC-normalized slugs; URLs must use encoded path segments.
 */

const ENCODED_SEGMENT = /%[0-9A-Fa-f]{2}/;

/** Decode route param (may arrive encoded or decoded depending on Next/static path). */
export function decodeBlogSlugParam(raw: string): string {
  let value = raw.trim();
  if (!value) return "";

  for (let i = 0; i < 3; i += 1) {
    if (!ENCODED_SEGMENT.test(value)) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  return value;
}

/** Canonical slug form for MongoDB lookup (matches admin slugify NFKC + lowercase). */
export function normalizeBlogSlugForLookup(raw: string): string {
  const decoded = decodeBlogSlugParam(raw);
  if (!decoded) return "";
  return decoded.normalize("NFKC").toLowerCase();
}

/** Path segment for `/blog/{segment}` (always percent-encoded when needed). */
export function encodeBlogSlugPathSegment(slug: string): string {
  const normalized = normalizeBlogSlugForLookup(slug);
  if (!normalized) return "";
  return encodeURIComponent(normalized);
}

export function blogPostPath(slug: string): string {
  const segment = encodeBlogSlugPathSegment(slug);
  return segment ? `/blog/${segment}` : "/blog";
}
