/**
 * Hydro Facial matching.
 * The live menu row is named "Hydro Facial", its slug is empty, and the description
 * calls the treatment HydraFacial. Identity is the known service id, that name,
 * or the slug "hydra-facial" — never the slug alone.
 */

export const HYDRA_FACIAL_ID = "6a735938191b0594eab40f2f";

export type HydraServiceRef = {
  _id?: string;
  name?: string;
  slug?: string;
  category?: string;
};

function compact(value: string | undefined): string {
  return (value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, "")
    .trim();
}

/** "Hydro Facial", "Hydra Facial", "HydraFacial", or slug hydra-facial / hydro-facial. */
function isHydraName(value: string | undefined): boolean {
  const text = compact(value);
  return text === "hydrofacial" || text === "hydrafacial";
}

export function isHydraFacial(row: HydraServiceRef): boolean {
  if (row.category && row.category !== "facials") return false;
  if (row._id && row._id === HYDRA_FACIAL_ID) return true;
  return isHydraName(row.name) || isHydraName(row.slug);
}
