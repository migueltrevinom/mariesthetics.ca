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
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6 py-20 relative overflow-hidden">
        <div className="aurora pointer-events-none fixed inset-0" />
        <div className="w-full max-w-md border border-[var(--border-color)] bg-[var(--card-bg)] p-8 rounded-3xl shadow-2xl text-center relative z-10 backdrop-blur-md">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-2xl mb-4">
            🎁
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
            Gift Certificate Not Found
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
            We couldn't locate an active gift certificate matching code <strong className="text-[var(--ink)] font-mono">{code}</strong>. It may have already been fully redeemed or expired.
          </p>
          <div className="mt-8 space-y-2">
            <Link href="/gift-cards" className="btn-primary w-full text-center block !py-3 text-xs font-bold">
              Purchase a Gift Certificate
            </Link>
            <Link href="/" className="px-4 py-2 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] block text-center">
              Return to Homepage
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
