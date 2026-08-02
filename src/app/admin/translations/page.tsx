import { getAllTranslations } from "@/app/api/admin/translations/modules/translation.module";
import { TranslationsManager } from "@/components/admin/TranslationsManager";

export const dynamic = "force-dynamic";

export default async function AdminTranslationsPage() {
  const rawTranslations = await getAllTranslations();
  const translations = rawTranslations.map((t: any) => ({
    _id: String(t._id),
    page: String(t.page),
    key: String(t.key),
    translations: {
      en: String(t.translations?.en || ""),
      tl: String(t.translations?.tl || ""),
      pa: String(t.translations?.pa || ""),
      ar: String(t.translations?.ar || ""),
      es: String(t.translations?.es || ""),
    },
    updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : undefined,
  }));

  return <TranslationsManager initialTranslations={translations} />;
}
