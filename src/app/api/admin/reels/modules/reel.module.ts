import { ReelRepository } from "../repositories/reel.repository";
import { connectDb } from "@/lib/db/connect";
import { getOrCreateSettings, updateSettings } from "@/lib/db/models";

export async function getAllReels() {
  return ReelRepository.findAll();
}

export async function getActiveReels() {
  return ReelRepository.findActive();
}

export async function saveReel(data: {
  id?: string;
  platform: string;
  videoUrl: string;
  thumbnailUrl: string;
  externalUrl?: string;
  caption?: string;
  serviceName?: string;
  active?: boolean;
  sortOrder?: number;
}) {
  return ReelRepository.upsertReel(data);
}

export async function removeReel(id: string) {
  return ReelRepository.deleteReel(id);
}

export async function getShowcaseVisibility(): Promise<boolean> {
  await connectDb();
  const settings = await getOrCreateSettings();
  return settings.showReelsShowcase !== false;
}

export async function setShowcaseVisibility(visible: boolean) {
  await connectDb();
  return updateSettings({ showReelsShowcase: visible });
}
