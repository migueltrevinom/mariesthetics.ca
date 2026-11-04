import { isVolumeLash, type VolumeServiceRef } from "./volumeMatch";

const EXCLUDE = /\b(lift|lifts|removal|remove|tint|tinting)\b/i;
const HYBRID = /\bhybrid\b/i;

/** Hybrid or volume lash services from the live menu. Classic, lifts, and tints are not included. */
export function isWestLashService(row: VolumeServiceRef): boolean {
  if (row.category && row.category !== "lashes") return false;
  const blob = `${row.name || ""} ${(row.slug || "").replace(/-/g, " ")}`;
  if (EXCLUDE.test(blob)) return false;
  if (isVolumeLash(row)) return true;
  return HYBRID.test(blob);
}
