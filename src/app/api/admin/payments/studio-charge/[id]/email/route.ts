import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { StudioCharge } from "@/lib/db/models";
import { withManagerAuth } from "@/lib/auth/jwt";
import { getAppUrl } from "@/lib/config";
import { sendEmail } from "@/lib/mailgun";
import { formatCad } from "@/lib/money";
import { signStudioChargeToken } from "@/lib/payments/studioChargeToken";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export const POST = withManagerAuth(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await ctx.params;
    if (!/^[a-f0-9]{24}$/i.test(id)) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }
    await connectDb();
    const charge = await StudioCharge.findById(id).lean();
    if (!charge) return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    if (charge.status !== "open") {
      return NextResponse.json({ error: "Only open charges can be emailed" }, { status: 409 });
    }
    if (!charge.clientEmail) {
      return NextResponse.json({ error: "This charge has no client email" }, { status: 400 });
    }

    const payUrl = `${getAppUrl(req)}/pay?t=${encodeURIComponent(await signStudioChargeToken(String(charge._id)))}`;
    const firstName = escapeHtml((charge.clientName || "").trim().split(/\s+/)[0] || "there");
    const description = escapeHtml(charge.description || "Mari Esthetics");
    const html = `<!DOCTYPE html><html><body style="margin:0;padding:32px;background:#f6f3ec;font-family:Georgia,serif;color:#1c1814;">
<table style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4dccb;border-radius:16px;padding:32px;"><tr><td>
<p style="margin:0;letter-spacing:0.18em;text-transform:uppercase;font-size:12px;color:#8a7040;">Mari Esthetics</p>
<h1 style="margin:8px 0 16px;font-weight:400;font-size:26px;">Hi ${firstName}, your payment link</h1>
<p style="font-family:sans-serif;font-size:14px;">${description}: <strong>${formatCad(charge.baseAmountCents)}</strong> (before tip)</p>
<p style="margin:24px 0;"><a href="${payUrl}" style="background:#c8a86b;color:#1c1814;padding:12px 24px;border-radius:999px;text-decoration:none;font-family:sans-serif;font-weight:600;">Choose a tip and pay</a></p>
<p style="font-family:sans-serif;font-size:12px;color:#665b4e;">This link is private to you and expires in 7 days.</p>
</td></tr></table></body></html>`;

    const result = await sendEmail({
      to: charge.clientEmail,
      subject: `Your Mari Esthetics payment link (${formatCad(charge.baseAmountCents)})`,
      html,
    });
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Email failed" }, { status: 502 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Studio charge email]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to email link" }, { status: 500 });
  }
});
