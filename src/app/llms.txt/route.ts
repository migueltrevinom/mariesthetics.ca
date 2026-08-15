import { connectDb } from "@/lib/db/connect";
import { Service, SubscriptionPlan } from "@/lib/db/models";
import { business, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  let servicesList = "";
  let plansList = "";

  try {
    await connectDb();
    const services = await Service.find({ active: true }).sort({ sortOrder: 1 }).lean();
    servicesList = services
      .map(
        (s) =>
          `- ${s.name}: ${s.description ? s.description + " " : ""}($${(s.priceCents / 100).toFixed(2)} CAD, ${s.durationMin} mins)`
      )
      .join("\n");

    const plans = await SubscriptionPlan.find({ active: true }).lean();
    plansList = plans
      .map(
        (p) =>
          `- ${p.name}: $${(p.priceCents / 100).toFixed(2)} CAD/${p.interval} — ${p.description || ""}`
      )
      .join("\n");
  } catch {
    servicesList = "- Customized Facials\n- Lash Lifts\n- Brow Shaping & Tinting\n- Dermaplaning";
    plansList = "- Monthly Esthetics Membership";
  }

  const content = `# ${business.name}

> Private esthetics studio in ${business.locality}, ${business.regionName}. ${business.description}

## Core Services & Pricing
${servicesList}

## Memberships
${plansList}

## Booking & Contact Information
- Online Booking: ${siteUrl}/book
- Services Catalog: ${siteUrl}/services
- WhatsApp Inquiry: ${siteUrl}/contact
- Deposit: Required via Stripe (card) or Interac e-Transfer to hold slot

## Studio Details
- Location: ${business.neighbourhood}, ${business.locality}, ${business.regionName}, ${business.country}
- Business Type: Private one-on-one esthetics studio (address provided upon booking confirmation)
- Operating Hours: Monday to Saturday, 9:00 AM – 8:00 PM
- Price Range: ${business.priceRange} (CAD)

## Social Media & Portfolios
- Instagram: ${business.sameAs[0]}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
