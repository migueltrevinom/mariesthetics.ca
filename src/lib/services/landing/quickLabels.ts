import type { Locale } from "@/components/i18n/LanguageContext";
import type { LandingKey } from "./types";

/** Short nav labels only — keep out of client bundles that import full landing copy. */
export const LANDING_CHIP_LABELS: Record<LandingKey, Record<Locale, string>> = {
  "lash-extensions": {
    en: "Lash extensions",
    es: "Extensiones de pestañas",
    tl: "Lash extensions",
    pa: "ਲੇਸ਼ ਐਕਸਟੈਂਸ਼ਨ",
    ar: "وصلات الرموش",
  },
  "powder-brows": {
    en: "Powder brows",
    es: "Cejas powder",
    tl: "Powder brows",
    pa: "ਪਾਊਡਰ ਬ੍ਰੋਜ਼",
    ar: "حواجب البودرة",
  },
  "lip-blush": {
    en: "Lip blush",
    es: "Lip blush",
    tl: "Lip blush",
    pa: "ਲਿਪ ਬਲੱਸ਼",
    ar: "توريد الشفاه",
  },
  "lip-neutralization": {
    en: "Lip neutralization",
    es: "Neutralización labios",
    tl: "Lip neutralization",
    pa: "ਲਿਪ ਨਿਊਟ੍ਰਲਾਈਜ਼ੇਸ਼ਨ",
    ar: "حياد الشفاه",
  },
  "facial-west": {
    en: "Facials",
    es: "Faciales",
    tl: "Facials",
    pa: "ਫੇਸ਼ੀਅਲ",
    ar: "فيشيال الوجه",
  },
  "hydra-facial": {
    en: "Hydra facial",
    es: "Hydra facial",
    tl: "Hydra facial",
    pa: "ਹਾਈਡ੍ਰਾ ਫੇਸ਼ੀਅਲ",
    ar: "هيدرا فيشيال",
  },
  "anti-aging-facial": {
    en: "Anti-aging facial",
    es: "Facial antiedad",
    tl: "Anti-aging facial",
    pa: "ਐਂਟੀ-ਏਜਿੰਗ ਫੇਸ਼ੀਅਲ",
    ar: "فيشيال مكافحة الشيخوخة",
  },
  "deep-cleansing-facial": {
    en: "Deep cleansing facial",
    es: "Limpieza profunda",
    tl: "Deep cleansing facial",
    pa: "ਡੀਪ ਕਲੀਨਜ਼ਿੰਗ",
    ar: "تنظيف عميق",
  },
};
