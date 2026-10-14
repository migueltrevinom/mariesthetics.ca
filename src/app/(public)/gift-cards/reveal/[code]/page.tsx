import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { GiftCard } from "@/lib/db/models/GiftCard";
import { GiftCardUnwrapExperience, type GiftCardData } from "@/components/gift-card/GiftCardUnwrapExperience";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Digital Gift Certificate (${code.toUpperCase()}) | Mari Esthetics`,
    description: "You have received a luxury digital gift certificate from Mari Esthetics Studio in Edmonton, AB.",
    robots: { index: false, follow: false },
  };
}

export default async function GiftCardRevealPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) notFound();

  await connectDb();
  const rawGiftCard = await GiftCard.findOne({
    code: code.toUpperCase().trim(),
    active: true,
  }).lean();

  if (!rawGiftCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white px-6 py-20 relative overflow-hidden select-none">
        <div className="w-full max-w-md border border-white/10 bg-[#060606] p-8 sm:p-10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-center relative z-10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#ffb829]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" stroke="#8052ff" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="#ffb829" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="#ffb829" />
            </svg>
          </div>
          <h1 className="font-sans text-2xl sm:text-3xl text-white font-normal tracking-[-0.03em]">
            Gift Certificate Not Located
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[#9a9a9a] font-light leading-relaxed">
            We couldn't locate an active gift certificate matching code <strong className="text-white font-mono">{code}</strong>. It may have already been fully redeemed or reached expiration.
          </p>
          <div className="mt-8 space-y-2.5">
            <Link
              href="/gift-cards"
              className="w-full h-11 px-5 rounded-full bg-[#c8a86b] hover:bg-[#d8b87b] text-[#0b140f] text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>Purchase a Gift Certificate</span>
              <span>→</span>
            </Link>
            <Link
              href="/"
              className="py-2 px-4 text-xs tracking-wider uppercase text-white/60 hover:text-white block text-center transition-colors"
            >
              Return to Studio Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExpired = rawGiftCard.expiryDate ? new Date(rawGiftCard.expiryDate) < new Date() : false;

  const giftCardData: GiftCardData = {
    code: rawGiftCard.code,
    initialBalanceCents: rawGiftCard.initialBalanceCents,
    remainingBalanceCents: rawGiftCard.remainingBalanceCents,
    amountCad: rawGiftCard.remainingBalanceCents / 100,
    initialAmountCad: rawGiftCard.initialBalanceCents / 100,
    recipientName: rawGiftCard.recipientName || "Valued Client",
    senderName: rawGiftCard.senderName || "Mari Esthetics Studio",
    message: rawGiftCard.message || "",
    expiryDate: rawGiftCard.expiryDate ? String(rawGiftCard.expiryDate) : null,
    isExpired,
    createdAt: rawGiftCard.createdAt ? String(rawGiftCard.createdAt) : undefined,
  };

  return <GiftCardUnwrapExperience giftCard={giftCardData} />;
}
