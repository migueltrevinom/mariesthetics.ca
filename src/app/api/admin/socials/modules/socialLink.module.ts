import { SocialLinkRepository } from "../repositories/socialLink.repository";

export async function getAllSocialLinks() {
  return SocialLinkRepository.findAll();
}

export async function getActiveSocialLinks() {
  return SocialLinkRepository.findActive();
}

export async function saveSocialLink(data: {
  id?: string;
  platform: string;
  label: string;
  url: string;
  active?: boolean;
  sortOrder?: number;
}) {
  return SocialLinkRepository.upsertLink(data);
}

export async function removeSocialLink(id: string) {
  return SocialLinkRepository.deleteLink(id);
}
