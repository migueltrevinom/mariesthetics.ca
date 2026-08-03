import { NextResponse } from "next/server";
import { z } from "zod";

export const createCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive("Value must be greater than zero"),
  maxRedemptions: z.number().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export const issueGiftCardSchema = z.object({
  amountCad: z.number().positive("Amount must be greater than zero"),
  recipientEmail: z.string().email("Valid recipient email is required"),
  recipientName: z.string().optional().default(""),
  senderName: z.string().optional().default(""),
  senderEmail: z.string().optional().default(""),
  message: z.string().optional().default(""),
  code: z.string().optional().default(""),
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
