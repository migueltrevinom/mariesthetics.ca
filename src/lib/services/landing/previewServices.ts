import type { LandingDefinition } from "./types";
import type { LandingServiceRow } from "./queries";

/** Offline/dev fallback when MongoDB is unavailable (screenshots, local QA). */
export function previewServicesForLanding(definition: LandingDefinition): LandingServiceRow[] {
  const base = (row: Partial<LandingServiceRow> & Pick<LandingServiceRow, "name" | "slug" | "priceCents">): LandingServiceRow => ({
    _id: row._id || "preview-id",
    name: row.name,
    description: row.description || "",
    slug: row.slug,
    durationMin: row.durationMin ?? 90,
    priceCents: row.priceCents,
    depositCents: row.depositCents ?? 2500,
    category: row.category ?? "general",
    photos: row.photos?.length ? row.photos : [`/images/services/${row.slug}.jpg`],
  });

  switch (definition.key) {
    case "lash-extensions":
      return [
        base({ _id: "p1", name: "Classic Set", slug: "classic-set", priceCents: 7000, category: "lashes" }),
        base({ _id: "p2", name: "Hybrid Set", slug: "hybrid-set", priceCents: 9000, category: "lashes" }),
      ];
    case "powder-brows":
      return [base({ _id: "p3", name: "Soft Powder Brows", slug: "soft-powder-brows", priceCents: 25000, category: "permanentMakeUp" })];
    case "lip-blush":
      return [base({ _id: "p4", name: "Lip Blush", slug: "lip-blush", priceCents: 25000, category: "permanentMakeUp" })];
    case "lip-neutralization":
      return [base({ _id: "p5", name: "Lip Neutralization", slug: "lip-neutralization", priceCents: 20000, category: "permanentMakeUp" })];
    case "facial-west":
      return [
        base({ _id: "p6", name: "Basic Facial", slug: "basic-facial", priceCents: 5000, category: "facials" }),
        base({ _id: "p7", name: "Deep Cleansing Facial", slug: "deep-cleansing-facial", priceCents: 8000, category: "facials" }),
      ];
    case "hydra-facial":
      return [base({ _id: "p8", name: "Hydra Facial", slug: "hydra-facial", priceCents: 10000, category: "facials" })];
    case "anti-aging-facial":
      return [base({ _id: "p9", name: "Anti-aging Facial", slug: "anti-aging-facial", priceCents: 10000, category: "facials" })];
    case "deep-cleansing-facial":
      return [base({ _id: "p10", name: "Deep Cleansing Facial", slug: "deep-cleansing-facial", priceCents: 8000, category: "facials" })];
    default:
      return [];
  }
}

export const SERVICE_LANDING_DEV_PREVIEW =
  process.env.SERVICE_LANDING_DEV_PREVIEW === "1" ||
  process.env.NODE_ENV === "development";
