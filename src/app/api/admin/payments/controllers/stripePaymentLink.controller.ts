import { NextResponse } from "next/server";
import { createStripePaymentLink, getStripePaymentLinks, syncStripePaymentLink } from "../modules/stripePaymentLink.module";

export async function handleCreatePaymentLink(req: Request, validatedData: any): Promise<NextResponse> {
	try {
		const host = req.headers.get("host") || "localhost:3000";
		const result = await createStripePaymentLink({
			...validatedData,
			host,
		});

		return NextResponse.json({ url: result.url, link: result.record });
	} catch (err: any) {
		console.error("[StripePaymentLink Controller Create Error]:", err.message);
		return NextResponse.json(
			{ error: err.message || "Failed to generate Stripe payment link" },
			{ status: 500 }
		);
	}
}

export async function handleGetPaymentLinks(req: Request): Promise<NextResponse> {
	try {
		const { searchParams } = new URL(req.url);
		const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
		const limit = Math.max(1, parseInt(searchParams.get("limit") || "50"));

		const links = await getStripePaymentLinks({ page, limit });
		return NextResponse.json({ links });
	} catch (err: any) {
		console.error("[StripePaymentLink Controller GET Error]:", err.message);
		return NextResponse.json({ error: "Failed to load payment links" }, { status: 500 });
	}
}

export async function handleSyncPaymentLink(req: Request, validatedData: any): Promise<NextResponse> {
	try {
		const { stripeSessionId } = validatedData;
		const result = await syncStripePaymentLink(stripeSessionId);

		return NextResponse.json({ success: true, status: result.status, link: result.link });
	} catch (err: any) {
		console.error("[StripePaymentLink Controller Sync Error]:", err.message);
		return NextResponse.json(
			{ error: err.message || "Failed to synchronize Stripe payment link status" },
			{ status: 500 }
		);
	}
}
