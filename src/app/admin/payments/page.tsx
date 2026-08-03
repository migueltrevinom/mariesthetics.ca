import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Payment } from "@/lib/db/models";
import { StripePaymentLink } from "@/lib/db/models/StripePaymentLink";
import { EtransferSettings } from "@/lib/db/models/EtransferSettings";
import { PaymentsManager } from "@/components/admin/PaymentsManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
	let payments: any[] = [];
	let paymentLinks: any[] = [];
	let etransferPayments: any[] = [];
	let etransferSettings: any = {
		accountName: "Mari Esthetics / Marinelle Tala",
		email: "mari@mariesthetics.ca",
		phone: "+1 7809133081",
		autoDepositEnabled: true,
		instructions: "Please include your appointment date and full name in the e-Transfer note.",
	};

	try {
		await connectDb();
		
		// 1. Fetch All Transactions
		const dbPayments = await Payment.find().sort({ createdAt: -1 }).limit(100).lean();
		payments = dbPayments.map((p) => ({
			_id: String(p._id),
			createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
			kind: String(p.kind),
			method: String(p.method),
			amountCents: Number(p.amountCents),
			status: String(p.status),
			referenceNumber: String(p.referenceNumber || ""),
			note: String(p.note || ""),
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

		// 3. Fetch e-Transfer Specific Transactions
		const dbEtransfers = await Payment.find({ method: "etransfer" })
			.sort({ createdAt: -1 })
			.limit(100)
			.populate({
				path: "bookingId",
				populate: { path: "serviceId" },
			})
			.lean();
		etransferPayments = dbEtransfers.map((p) => ({
			_id: String(p._id),
			createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
			kind: String(p.kind),
			amountCents: Number(p.amountCents),
			status: String(p.status),
			referenceNumber: String(p.referenceNumber || ""),
			note: String(p.note || ""),
			proofUrl: String(p.proofUrl || ""),
			booking: p.bookingId ? {
				_id: String((p.bookingId as any)._id),
				start: (p.bookingId as any).start ? new Date((p.bookingId as any).start).toISOString() : "",
				guestName: (p.bookingId as any).guest?.name || "",
				guestEmail: (p.bookingId as any).guest?.email || "",
				serviceName: (p.bookingId as any).serviceId?.name || "Service",
			} : null,
		}));

		// 4. Fetch Studio e-Transfer Receiving Settings
		const dbSettings = await EtransferSettings.findOne().lean();
		if (dbSettings) {
			etransferSettings = {
				accountName: String(dbSettings.accountName || "Mari Esthetics / Marinelle Tala"),
				email: String(dbSettings.email || "mari@mariesthetics.ca"),
				phone: String(dbSettings.phone || "+1 7809133081"),
				autoDepositEnabled: Boolean(dbSettings.autoDepositEnabled ?? true),
				instructions: String(dbSettings.instructions || "Please include your appointment date and full name in the e-Transfer note."),
				updatedBy: String(dbSettings.updatedBy || ""),
			};
		}
	} catch (err) {
		console.error("Failed to load admin payments page:", err);
	}

	return (
		<AdminShell>
			<Suspense fallback={<div className="text-sm text-[var(--ink-soft)] p-4">Loading Payments...</div>}>
				<PaymentsManager
					initialPayments={payments}
					initialPaymentLinks={paymentLinks}
					initialEtransfers={etransferPayments}
					initialEtransferSettings={etransferSettings}
				/>
			</Suspense>
		</AdminShell>
	);
}
