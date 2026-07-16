import { NextResponse } from "next/server";
import { z } from "zod";

export const sendOtpSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export const verifyOtpSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
	code: z.string().min(6, "Code must be exactly 6 characters").max(6, "Code must be exactly 6 characters"),
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
