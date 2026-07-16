import { NextResponse } from "next/server";
import { z } from "zod";

export const createServiceSchema = z.object({
	name: z.string().min(1, "Service name is required"),
	description: z.string().optional().default(""),
	durationMin: z.number().int().min(15, "Duration must be at least 15 minutes"),
	priceCents: z.number().int().min(0, "Price cannot be negative"),
	depositCents: z.number().int().min(0, "Deposit cannot be negative"),
	category: z.enum(["lashes", "permanentMakeUp", "facials"]),
	sortOrder: z.number().int().optional().default(0),
	active: z.boolean().optional().default(true),
	photos: z.array(z.string().url("Please enter valid image URLs")).max(5, "Maximum of 5 photos allowed").optional().default([]),
});

export const updateServiceSchema = createServiceSchema.extend({
	id: z.string().min(1, "Service ID is required"),
});

export function withValidation<T>(schema: z.Schema<T>, handler: (req: Request, validatedData: T) => Promise<NextResponse>) {
	return async (req: Request): Promise<NextResponse> => {
		try {
			const clonedReq = req.clone();
			const body = await clonedReq.json();
			const validatedData = schema.parse(body);
			return handler(req, validatedData);
		} catch (err: any) {
			if (err instanceof z.ZodError) {
				return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
			}
			return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
		}
	};
}
