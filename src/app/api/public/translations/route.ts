import { NextResponse } from "next/server";
import { getAllTranslations } from "@/app/api/admin/translations/modules/translation.module";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawTranslations = await getAllTranslations();
    // Transform array into a nested map: { [locale]: { [key]: string } }
    const dictionaryOverrides: Record<string, Record<string, string>> = {
      en: {},
      tl: {},
      pa: {},
      ar: {},
      es: {},
    };

    for (const item of rawTranslations) {
      const { key, translations } = item;
      if (!key || !translations) continue;
      if (translations.en) dictionaryOverrides.en[key] = translations.en;
      if (translations.tl) dictionaryOverrides.tl[key] = translations.tl;
      if (translations.pa) dictionaryOverrides.pa[key] = translations.pa;
      if (translations.ar) dictionaryOverrides.ar[key] = translations.ar;
      if (translations.es) dictionaryOverrides.es[key] = translations.es;
    }

    return NextResponse.json({ overrides: dictionaryOverrides }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59",
      },
    });
  } catch {
    return NextResponse.json({ overrides: {} });
  }
}
