import { cookies } from "next/headers";
import type { Locale } from "@/components/i18n/LanguageContext";

const LOCALES: Locale[] = ["en", "tl", "pa", "ar", "es"];

export function parseLocale(value: string | undefined | null): Locale {
  if (value && LOCALES.includes(value as Locale)) {
    return value as Locale;
  }
  return "en";
}

/** Read the visitor locale from the NEXT_LOCALE cookie (set by LanguageSelector). */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return parseLocale(cookieStore.get("NEXT_LOCALE")?.value);
}
