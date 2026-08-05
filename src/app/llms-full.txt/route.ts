import { connectDb } from "@/lib/db/connect";
import { Service, SubscriptionPlan } from "@/lib/db/models";
import { business, siteUrl } from "@/lib/seo";
import { faqItems } from "@/lib/faq";

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
          `### ${s.name}\n- **Price:** $${(s.priceCents / 100).toFixed(2)} CAD\n- **Duration:** ${s.durationMin} minutes\n- **Description:** ${s.description || "N/A"}\n- **Booking:** ${siteUrl}/book?serviceId=${s._id}`
      )
      .join("\n\n");

    const plans = await SubscriptionPlan.find({ active: true }).lean();
    plansList = plans
      .map(
        (p) =>
          `### ${p.name}\n- **Price:** $${(p.priceCents / 100).toFixed(2)} CAD / ${p.interval}\n- **Details:** ${p.description || "N/A"}\n${p.billingNote ? `- **Note:** ${p.billingNote}\n` : ""}`
      )
      .join("\n\n");
  } catch {
    servicesList = "Detailed services available at " + siteUrl + "/services";
    plansList = "Membership plans available at " + siteUrl;
  }

  const faqList = faqItems
    .map((item) => `### Q: ${item.q}\n**A:** ${item.a}`)
    .join("\n\n");

  const content = `# Mari Esthetics — Full Machine-Readable Knowledge Base

> Private esthetics studio in ${business.locality}, ${business.regionName}. Personalized facials, lash lifts, brow shaping, and dermaplaning in a quiet, one-on-one setting.

---

## Detailed Service Catalog
${servicesList}

---

## Membership Options
${plansList}

---

## Frequently Asked Questions (FAQ)
${faqList}

---

## Deposit & Payment Terms
- **Deposit Policy:** A deposit is required to secure any appointment.
- **Payment Methods:** Instant card payments via Stripe, or Interac e-Transfer (held for 2 hours while payment verifies).
- **Remaining Balance:** Settle the remaining balance after your session via cash, Interac e-Transfer, or credit card link.
- **Tipping:** Tipping is optional.

---

## Location & Privacy
- **Service Areas Served:** ${business.areasServed.join(", ")}
- **Address Privacy:** Studio is a private home studio located in ${business.neighbourhood}, ${business.locality}. Precise street address is provided immediately following appointment confirmation for guest privacy.

---

## Links
- Website: ${siteUrl}
- Services & Pricing: ${siteUrl}/services
- Book Online: ${siteUrl}/book
- Gift Cards: ${siteUrl}/gift-cards
- Instagram: ${business.sameAs[0]}
- Facebook: ${business.sameAs[1]}
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
