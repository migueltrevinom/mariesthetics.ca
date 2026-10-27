/**
 * Volume Set / Volume Fill matching.
 * Volume Fill's slug is empty in production (and "fill-service" is shared with other fills in older data),
 * so identity is the service name and the known service id — never the slug alone.
 */

export const VOLUME_SET_ID = "6a6fdccb61dda32cf4b924f1";
export const VOLUME_FILL_ID = "6a6fe50561dda32cf4b924f6";

/** Slugs that belong to more than one lash fill. Never treat these as "the" volume fill. */
const AMBIGUOUS_FILL_SLUGS = new Set(["", "fill", "fill-service", "fill service"]);

export type VolumeServiceRef = {
  _id?: string;
  name?: string;
  slug?: string;
  category?: string;
};

const BANNED = /\b(mega|russian|lift|lifts|tint|tinting)\b/i;
const VOLUME = /\bvolume\b/i;
const FILL = /\b(fill|fills|refill|refills)\b/i;
const SET = /\bset\b/i;

function words(value: string | undefined): string {
  return (value || "").normalize("NFKC").toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function categoryOk(category: string | undefined): boolean {
  return !category || category === "lashes";
}

function banned(row: VolumeServiceRef): boolean {
  return BANNED.test(words(row.name)) || BANNED.test(words(row.slug));
}

export function isVolumeSet(row: VolumeServiceRef): boolean {
  if (!categoryOk(row.category) || banned(row)) return false;
  if (row._id && row._id === VOLUME_SET_ID) return true;
  const name = words(row.name);
  const slug = words(row.slug);
  if (FILL.test(name) || FILL.test(slug)) return false;
  const volume = VOLUME.test(name) || VOLUME.test(slug);
  const set = SET.test(name) || SET.test(slug) || slug === "volume set";
  return volume && set;
}

export function isVolumeFill(row: VolumeServiceRef): boolean {
  if (!categoryOk(row.category) || banned(row)) return false;
  if (row._id && row._id === VOLUME_FILL_ID) return true;
  const name = words(row.name);
  if (VOLUME.test(name) && FILL.test(name)) return true;
  const slug = words(row.slug);
  if (AMBIGUOUS_FILL_SLUGS.has(slug)) return false;
  return VOLUME.test(slug) && FILL.test(slug);
}

export function isVolumeLash(row: VolumeServiceRef): boolean {
  return isVolumeSet(row) || isVolumeFill(row);
}

function preferId<T extends VolumeServiceRef>(rows: T[], id: string): T | undefined {
  return rows.find((row) => row._id === id) || rows[0];
}

/** One set and one fill. Known ids win when the menu has duplicates; otherwise the first match. */
export function pickVolumePair<T extends VolumeServiceRef>(rows: T[]): { set?: T; fill?: T } {
  const set = preferId(rows.filter(isVolumeSet), VOLUME_SET_ID);
  const fill = preferId(
    rows.filter((row) => isVolumeFill(row) && row !== set),
    VOLUME_FILL_ID
  );
  return { set, fill };
}

/** 0 = volume set, 1 = volume fill, 2 = everything else. Used to list volume first in the lash menu. */
export function lashMenuRank(row: VolumeServiceRef): number {
  if (isVolumeSet(row)) return 0;
  if (isVolumeFill(row)) return 1;
  return 2;
}
