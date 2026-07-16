import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Payment } from "@/lib/db/models";
import { PaymentsManager } from "@/components/admin/PaymentsManager";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
	let payments: any[] = [];
	try {
		await connectDb();
		const dbPayments = await Payment.find().sort({ createdAt: -1 }).limit(100).lean();
		payments = dbPayments.map((p) => ({
			_id: String(p._id),
			createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
			kind: String(p.kind),
			method: String(p.method),
			amountCents: Number(p.amountCents),
			status: String(p.status),
		}));
	} catch {
		payments = [];
	}

	return (
		<AdminShell>
			<PaymentsManager initialPayments={payments} />
		</AdminShell>
	);
}
