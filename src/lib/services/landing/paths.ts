import { decodeBlogSlugParam, encodeBlogSlugPathSegment } from "@/lib/blog/slug";

export function normalizeServiceLandingSlugParam(raw: string): string {
  return decodeBlogSlugParam(raw).normalize("NFKC").toLowerCase();
}

export function serviceLandingPath(slugSegment: string): string {
  const segment = encodeBlogSlugPathSegment(slugSegment);
  return segment ? `/services/${segment}` : "/services";
}
