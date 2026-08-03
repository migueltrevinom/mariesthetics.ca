import { NextResponse } from "next/server";
import { z } from "zod";

export const requestReviewSchema = z.object({
	bookingId: z.string().min(1, "Booking ID is required"),
});

export const submitReviewSchema = z.object({
	token: z.string().min(1, "Review token is required"),
	rating: z.number().int().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
	comment: z.string().optional().default(""),
});

export const toggleVisibilitySchema = z.object({
	isVisibleOnLanding: z.boolean().optional(),
});

export function withValidation<T>(
	schema: z.Schema<T>,
	handler: (req: Request, validatedData: T) => Promise<NextResponse>,
) {
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
