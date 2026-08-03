import { NextResponse } from "next/server";
import { z } from "zod";

export const saveCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Category name is required"),
  slug: z.string().optional().default(""),
  description: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
  imageUrl: z.string().optional().default(""),
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
        return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
      }
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
  };
}
