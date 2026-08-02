import { NextResponse } from "next/server";
import { z } from "zod";

export const saveSocialLinkSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, "Platform is required"),
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Please enter a valid URL (starting with http:// or https://)"),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
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
