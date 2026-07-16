import { NextResponse } from "next/server";
import { z } from "zod";

export const createPaymentLinkSchema = z.object({
	amountCad: z.number().positive("Amount must be greater than zero"),
	description: z.string().min(1, "Description is required"),
	kind: z.enum(["deposit", "balance", "tip", "custom"]),
	bookingId: z.string().optional(),
	clientEmail: z.string().email("Invalid email address").or(z.literal("")).optional(),
});

export function withValidation<T>(
	schema: z.Schema<T>,
	handler: (req: Request, validatedData: T) => Promise<NextResponse>
) {
	return async (req: Request): Promise<NextResponse> => {
		try {
			const clonedReq = req.clone();
			const body = await clonedReq.json();
			const validatedData = schema.parse(body);
			return handler(req, validatedData);
		} catch (err: any) {
			if (err instanceof z.ZodError) {
				return NextResponse.json(
					{ error: err.issues[0]?.message || "Validation error" },
					{ status: 400 }
				);
			}
			return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
		}
	};
}
