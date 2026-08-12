import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { SubscriptionPlan } from "@/lib/db/models";
import { AuthError, requireManager } from "@/lib/auth/jwt";
import { syncStripePriceForPlan } from "@/lib/payments/subscriptionSync";

const updateSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	interval: z.enum(["month", "year"]).optional(),
	priceCents: z.number().min(0).optional(),
	billingNote: z.string().optional(),
	includedServiceIds: z.array(z.string()).optional(),
	visitsPerPeriod: z.number().min(1).optional(),
	active: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requireManager();
		const { id } = await params;
		const body = updateSchema.parse(await req.json());
		await connectDb();

		const existingPlan = await SubscriptionPlan.findById(id);
		if (!existingPlan) {
			return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
		}

		let updatedStripePriceId = existingPlan.stripePriceId;
		const nameChanged = body.name && body.name !== existingPlan.name;
		const priceChanged = body.priceCents !== undefined && body.priceCents !== existingPlan.priceCents;
		const intervalChanged = body.interval && body.interval !== existingPlan.interval;

		if (!existingPlan.stripePriceId || nameChanged || priceChanged || intervalChanged) {
			updatedStripePriceId = await syncStripePriceForPlan({
				name: body.name || existingPlan.name,
				priceCents: body.priceCents !== undefined ? body.priceCents : existingPlan.priceCents,
				interval: body.interval || existingPlan.interval,
				existingStripePriceId: existingPlan.stripePriceId,
			});
		}

		const plan = await SubscriptionPlan.findByIdAndUpdate(id, { ...body, stripePriceId: updatedStripePriceId }, { new: true }).populate("includedServiceIds");

		return NextResponse.json({ plan });
	} catch (err) {
		if (err instanceof AuthError) {
			return NextResponse.json({ error: err.message }, { status: err.status });
		}
		if (err instanceof z.ZodError) {
			return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
		}
		console.error(err);
		return NextResponse.json({ error: "Failed to update subscription plan" }, { status: 500 });
	}
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		await requireManager();
		const { id } = await params;
		await connectDb();

		const deleted = await SubscriptionPlan.findByIdAndDelete(id);
		if (!deleted) {
			return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		if (err instanceof AuthError) {
			return NextResponse.json({ error: err.message }, { status: err.status });
		}
		console.error(err);
		return NextResponse.json({ error: "Failed to delete subscription plan" }, { status: 500 });
	}
}
