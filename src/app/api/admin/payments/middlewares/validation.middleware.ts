import { NextResponse } from "next/server";
import { z } from "zod";

export const createPaymentLinkSchema = z.object({
  amountCad: z.number().positive("Amount must be greater than zero"),
  description: z.string().min(1, "Description is required"),
  kind: z.enum(["deposit", "balance", "tip", "custom"]),
  bookingId: z.string().optional(),
  clientEmail: z.string().email("Invalid email address").or(z.literal("")).optional(),
});

export const syncPaymentLinkSchema = z.object({
  stripeSessionId: z.string().min(1, "Stripe Session ID is required"),
});

export const etransferSettingsSchema = z.object({
  accountName: z.string().min(1, "Account name is required"),
  email: z.string().email("Invalid e-Transfer email address"),
  phone: z.string().min(1, "Phone number is required"),
  autoDepositEnabled: z.boolean().default(true),
  instructions: z.string().optional().default(""),
});

export const recordEtransferSchema = z.object({
  amountCad: z.number().positive("Amount must be greater than zero"),
  referenceNumber: z.string().optional().default(""),
  bookingId: z.string().optional().default(""),
  kind: z.enum(["deposit", "balance", "tip", "adjustment"]).default("balance"),
  note: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  clientName: z.string().optional().default(""),
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
        return NextResponse.json(
          { error: err.issues[0]?.message || "Validation error" },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  };
}
