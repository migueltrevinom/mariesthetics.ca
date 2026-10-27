import type { Locale } from "@/components/i18n/LanguageContext";
import { blogPostPath } from "@/lib/blog/slug";
import { connectDb } from "@/lib/db/connect";
import { BlogPost } from "@/lib/db/models";

export type VolumePostLink = { slug: string; title: string };

/**
 * Strongest existing volume posts (by internal links at the 2026-10-27 check), per language.
 * Titles are fallbacks; render time replaces them with the published post title when the DB has it.
 */
export const VOLUME_FEATURED_POSTS: Record<Locale, VolumePostLink[]> = {
  en: [
    { slug: "volume-lash-fill-west-edmonton-cat-eye-shape-drift-runway-salsa-gala", title: "Volume lash fill and cat-eye shape drift" },
    { slug: "hybrid-lashes-west-edmonton-classic-vs-hybrid-vs-volume-parka-test", title: "Classic vs hybrid vs volume: the parka test" },
    { slug: "volume-lash-extensions-edmonton-toque-and-scarf-season", title: "Volume lashes in toque and scarf season" },
    { slug: "volume-lashes-edmonton-light-volume-2d-5d-west-edmonton-diwali", title: "Light volume lashes in West Edmonton" },
    { slug: "volume-lashes-west-edmonton-diy-clusters-vs-volume-set", title: "DIY clusters vs a volume set" },
  ],
  es: [
    { slug: "relleno-pestanas-volumen-west-edmonton-ojo-de-gato-desfile-gala-salsa", title: "Relleno de volumen y el ojo de gato" },
    { slug: "pestanas-hibridas-west-edmonton-clasicas-hibridas-o-volumen-prueba-del-abrigo", title: "Clásicas, híbridas o volumen: la prueba del abrigo" },
    { slug: "pestanas-de-volumen-edmonton-entre-el-gorro-y-la-bufanda", title: "Pestañas de volumen entre el gorro y la bufanda" },
    { slug: "pestanas-de-volumen-edmonton-volumen-ligero-2d-5d-west-edmonton-diwali", title: "Volumen ligero en el oeste de Edmonton" },
    { slug: "pestanas-volumen-west-edmonton-clusters-caseros-vs-set-de-volumen", title: "Clusters caseros o set de volumen" },
  ],
  tl: [
    { slug: "volume-lash-fill-west-edmonton-cat-eye-pa-rin-ba-runway-salsa-gala", title: "Volume lash fill at cat-eye" },
    { slug: "hybrid-lashes-west-edmonton-classic-hybrid-o-volume-parka-test-tl", title: "Classic, hybrid o volume: parka test" },
    { slug: "volume-lash-extensions-edmonton-toque-at-scarf", title: "Volume lashes sa toque at scarf season" },
    { slug: "volume-lashes-edmonton-magaan-na-volume-2d-5d-west-edmonton-diwali", title: "Magaan na volume lashes sa West Edmonton" },
    { slug: "volume-lashes-west-edmonton-diy-clusters-vs-volume-set-tl", title: "DIY clusters vs volume set" },
  ],
  pa: [
    { slug: "west-edmonton-volume-fill-cat-eye-runway-salsa-gala", title: "Volume lash fill ਅਤੇ cat eye" },
    { slug: "west-edmonton-hybrid-lashes-classic-hybrid-volume-parka-test", title: "Classic, hybrid ਜਾਂ volume" },
    { slug: "edmonton-volume-lash-extension-topi-te-scarf", title: "ਸਰਦੀਆਂ ਵਿੱਚ volume lashes" },
    { slug: "volume-lashes-edmonton-diwali-halka-volume-2d-5d-west-edmonton", title: "ਹਲਕਾ volume West Edmonton" },
    { slug: "west-edmonton-volume-lashes-diy-clusters-vs-volume-set", title: "Clusters ਬਨਾਮ volume set" },
  ],
  ar: [
    { slug: "تعبئة-رموش-فوليوم-غرب-ادمونتون-عين-القطة-عرض-ازياء-حفل-سالسا", title: "تعبئة الفوليوم وعين القطة" },
    { slug: "رموش-هايبرد-غرب-ادمونتون-كلاسيك-هايبرد-فوليوم-اختبار-المعطف", title: "كلاسيك أم هايبرد أم فوليوم" },
    { slug: "رموش-فوليوم-ادمونتون-بين-القبعة-والوشاح", title: "رموش الفوليوم بين القبعة والوشاح" },
    { slug: "رموش-فوليوم-ادمونتون-فوليوم-خفيف-2d-5d-غرب-ادمونتون-ديوالي", title: "فوليوم خفيف في غرب إدمونتون" },
    { slug: "رموش-فوليوم-غرب-ادمونتون-كلستر-منزلي-مقابل-مجموعة-فوليوم", title: "كلستر منزلي أم مجموعة فوليوم" },
  ],
};

/** Dedicated volume cost post, one published URL per language. */
export const VOLUME_COST_POST: Record<Locale, string> = {
  en: "volume-lash-cost-edmonton-2026-full-set-fill-prices",
  es: "precio-pestanas-de-volumen-edmonton-2026",
  tl: "magkano-volume-lashes-edmonton-2026",
  pa: "edmonton-volume-lashes-kimat-2026",
  ar: "كم-سعر-رموش-الفوليوم-في-ادمونتون-2026",
};

export const VOLUME_PARKA_POST: Record<Locale, string> = {
  en: VOLUME_FEATURED_POSTS.en[1].slug,
  es: VOLUME_FEATURED_POSTS.es[1].slug,
  tl: VOLUME_FEATURED_POSTS.tl[1].slug,
  pa: VOLUME_FEATURED_POSTS.pa[1].slug,
  ar: VOLUME_FEATURED_POSTS.ar[1].slug,
};

export function volumePostPath(slug: string): string {
  return blogPostPath(slug);
}

/** Swap in live titles for posts that are actually published. Unpublished slugs are dropped. */
export async function resolvePublishedVolumePosts(links: VolumePostLink[]): Promise<VolumePostLink[]> {
  if (!links.length) return [];
  try {
    await connectDb();
  } catch {
    return links;
  }
  const rows = (await BlogPost.find({ status: "published", slug: { $in: links.map((l) => l.slug) } })
    .select("slug title")
    .lean()) as Array<{ slug?: string; title?: string }>;
  const bySlug = new Map(rows.map((row) => [String(row.slug), String(row.title || "")]));
  if (!bySlug.size) return links;
  return links
    .filter((link) => bySlug.has(link.slug))
    .map((link) => ({ slug: link.slug, title: bySlug.get(link.slug) || link.title }));
}
