import { PromotionRepository } from "../repositories/promotion.repository";

export async function createCoupon(data: {
  code: string;
  type: "percent" | "fixed";
  value: number;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
}) {
  return await PromotionRepository.createCoupon(data);
}

export async function fetchCoupons() {
  return await PromotionRepository.getAllCoupons();
}

export async function removeCoupon(id: string) {
  return await PromotionRepository.deleteCoupon(id);
}

export async function issueGiftCard(data: {
  amountCad: number;
  recipientEmail: string;
  recipientName?: string;
  senderName?: string;
  senderEmail?: string;
  message?: string;
  code?: string;
}) {
  return await PromotionRepository.createGiftCard(data);
}

export async function fetchGiftCards() {
  return await PromotionRepository.getAllGiftCards();
}

export async function removeGiftCard(id: string) {
  return await PromotionRepository.deleteGiftCard(id);
}
