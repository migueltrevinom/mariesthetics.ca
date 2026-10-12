import type { LandingDefinition } from "./types";

export const SERVICE_LANDING_PAGES: LandingDefinition[] = [
  {
    key: "lash-extensions",
    match: { type: "category", category: "lashes" },
    heroServiceSlug: "classic-set",
    slugs: {
      en: "lash-extensions-edmonton",
      es: "extensiones-de-pestanas-edmonton-oeste",
      tl: "lash-extensions-west-edmonton",
      pa: "lash-extensions-west-edmonton-pa",
      ar: "وصلات-رموش-ادمونتون-الغرب",
    },
  },
  {
    key: "powder-brows",
    match: { type: "serviceSlugs", slugs: ["soft-powder-brows"] },
    heroServiceSlug: "soft-powder-brows",
    slugs: {
      en: "powder-brows-edmonton",
      es: "cejas-polvo-edmonton",
      tl: "powder-brows-edmonton-tl",
      pa: "powder-brows-edmonton-punjabi",
      ar: "حواجب-بودرة-ادمونتون",
    },
  },
  {
    key: "lip-blush",
    match: { type: "serviceSlugs", slugs: ["lip-blush"] },
    heroServiceSlug: "lip-blush",
    slugs: {
      en: "lip-blush-edmonton",
      es: "lip-blush-edmonton-es",
      tl: "lip-blush-edmonton-tl",
      pa: "lip-blush-edmonton-pa",
      ar: "توريد-شفاه-ادمونتون",
    },
  },
  {
    key: "lip-neutralization",
    match: { type: "serviceSlugs", slugs: ["lip-neutralization"] },
    heroServiceSlug: "lip-neutralization",
    slugs: {
      en: "lip-neutralization-edmonton",
      es: "neutralizacion-labios-edmonton",
      tl: "lip-neutralization-edmonton-tl",
      pa: "lip-neutralization-edmonton-pa",
      ar: "حياد-الشفاه-ادمونتون",
    },
  },
  {
    key: "facial-west",
    match: { type: "category", category: "facials" },
    heroServiceSlug: "basic-facial",
    slugs: {
      en: "facial-west-edmonton",
      es: "facial-edmonton-oeste",
      tl: "facial-west-edmonton-tl",
      pa: "facial-west-edmonton-pa",
      ar: "فيشيال-ادمونتون-الغرب",
    },
  },
  {
    key: "hydra-facial",
    match: { type: "serviceSlugs", slugs: ["hydra-facial"] },
    heroServiceSlug: "hydra-facial",
    slugs: {
      en: "hydra-facial-edmonton",
      es: "hydra-facial-edmonton-es",
      tl: "hydra-facial-edmonton-tl",
      pa: "hydra-facial-edmonton-pa",
      ar: "هيدرا-فيشيال-ادمونتون",
    },
  },
  {
    key: "anti-aging-facial",
    match: { type: "serviceSlugs", slugs: ["anti-aging-facial"] },
    heroServiceSlug: "anti-aging-facial",
    slugs: {
      en: "anti-aging-facial-edmonton",
      es: "facial-antiedad-edmonton",
      tl: "anti-aging-facial-edmonton-tl",
      pa: "anti-aging-facial-edmonton-pa",
      ar: "فيشيال-مكافحة-الشيخوخة-ادمونتون",
    },
  },
  {
    key: "deep-cleansing-facial",
    match: { type: "serviceSlugs", slugs: ["deep-cleansing-facial"] },
    heroServiceSlug: "deep-cleansing-facial",
    slugs: {
      en: "deep-cleansing-facial-edmonton",
      es: "limpieza-profunda-facial-edmonton",
      tl: "deep-cleansing-facial-edmonton-tl",
      pa: "deep-cleansing-facial-edmonton-pa",
      ar: "فيشيال-تنظيف-عميق-ادمونتون",
    },
  },
];
