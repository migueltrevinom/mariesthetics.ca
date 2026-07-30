import { NextResponse } from "next/server";
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().default(""),
  kind: z.enum(["full_payment", "deposit", "balance", "custom"]).default("full_payment"),
  priceCents: z.number().min(0, "Price must be non-negative"),
  serviceId: z.string().nullable().optional(),
  stripeProductId: z.string().optional().default(""),
  stripePriceId: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  sku: z.string().optional().default(""),
});

export const updateProductSchema = createProductSchema.partial();

export const generateProductsSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
});

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: Request, validatedData: T, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(req, validatedData, ...args);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: err.issues[0]?.message || "Validation failed" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: err.message || "Invalid request payload" },
        { status: 400 }
      );
    }
  };
}
