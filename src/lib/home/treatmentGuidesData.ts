import { connectDb } from "@/lib/db/connect";
import { BlogPost, Service, ServiceImage } from "@/lib/db/models";
import { buildTreatmentGuideCards, readMinutesFromHtml, type GuideServiceRow, type TreatmentGuideCard } from "./treatmentGuides";

/** Treatment guide cards with live prices, durations and photos from the Service collection. */
export async function loadTreatmentGuideCards(): Promise<TreatmentGuideCard[]> {
  try {
    await connectDb();
    const services = (await Service.find({ active: true })
      .sort({ sortOrder: 1 })
      .select("name slug category priceCents depositCents durationMin photos")
      .lean()) as Array<Record<string, unknown>>;

    const imageMap = new Map<string, string[]>();
    try {
      const images = (await ServiceImage.find({ isPrivate: false }).select("serviceId url").lean()) as Array<{
        serviceId: unknown;
        url?: string;
      }>;
      for (const img of images) {
        if (!img.url) continue;
        const id = String(img.serviceId);
        imageMap.set(id, [...(imageMap.get(id) || []), img.url]);
      }
    } catch {
      // optional
    }

    const rows: GuideServiceRow[] = services.map((s) => {
      const photos = Array.isArray(s.photos) ? (s.photos as unknown[]).map(String).filter(Boolean) : [];
      return {
        _id: String(s._id),
        name: String(s.name ?? ""),
        slug: String(s.slug ?? ""),
        category: String(s.category ?? "general"),
        priceCents: Number(s.priceCents) || 0,
        depositCents: Number(s.depositCents) || 0,
        durationMin: Number(s.durationMin) || 0,
        photos: photos.length ? photos : imageMap.get(String(s._id)) || [],
      };
    });
    return buildTreatmentGuideCards(rows);
  } catch {
    // No DB: still render crawlable guide links, just without prices or photos.
    return buildTreatmentGuideCards([]);
  }
}

/** Reading time per post id, computed from the stored post body. */
export async function loadReadMinutes(ids: string[]): Promise<Record<string, number>> {
  const valid = ids.filter((id) => /^[0-9a-f]{24}$/i.test(id));
  if (!valid.length) return {};
  try {
    await connectDb();
    const rows = (await BlogPost.find({ _id: { $in: valid } }).select("content").lean()) as Array<{
      _id: unknown;
      content?: string;
    }>;
    const out: Record<string, number> = {};
    for (const r of rows) {
      if (r.content) out[String(r._id)] = readMinutesFromHtml(String(r.content));
    }
    return out;
  } catch {
    return {};
  }
}
