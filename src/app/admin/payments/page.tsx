import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Payment } from "@/lib/db/models";
import { StripePaymentLink } from "@/lib/db/models/StripePaymentLink";
import { PaymentsManager } from "@/components/admin/PaymentsManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
	let payments: any[] = [];
	let paymentLinks: any[] = [];
	try {
		await connectDb();
		
		// 1. Fetch Transactions
		const dbPayments = await Payment.find().sort({ createdAt: -1 }).limit(100).lean();
		payments = dbPayments.map((p) => ({
			_id: String(p._id),
			createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
			kind: String(p.kind),
			method: String(p.method),
			amountCents: Number(p.amountCents),
			status: String(p.status),
		}));

		// 2. Fetch Stripe Payment Links
		const dbLinks = await StripePaymentLink.find()
			.sort({ createdAt: -1 })
			.limit(100)
			.populate("bookingId")
			.lean();
		paymentLinks = dbLinks.map((l) => ({
			_id: String(l._id),
			createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
			amountCents: Number(l.amountCents),
			kind: String(l.kind),
			description: String(l.description),
			stripePaymentLinkUrl: String(l.stripePaymentLinkUrl),
			stripeSessionId: String(l.stripeSessionId),
			status: String(l.status),
			clientEmail: String(l.clientEmail || ""),
			booking: l.bookingId ? {
				_id: String((l.bookingId as any)._id),
				start: (l.bookingId as any).start ? new Date((l.bookingId as any).start).toISOString() : "",
			} : null,
		}));
	} catch (err) {
		console.error("Failed to load admin payments:", err);
	}

	return (
		<AdminShell>
			<PaymentsManager initialPayments={payments} initialPaymentLinks={paymentLinks} />
		</AdminShell>
	);
}
