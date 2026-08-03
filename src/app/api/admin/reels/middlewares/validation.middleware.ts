import { NextResponse } from "next/server";
import { z } from "zod";

export const saveReelSchema = z.object({
  id: z.string().optional(),
  platform: z.enum(["instagram", "tiktok"]),
  videoUrl: z.string().min(1, "Video URL is required"),
  thumbnailUrl: z.string().min(1, "Thumbnail URL is required"),
  externalUrl: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  serviceName: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const toggleShowcaseSchema = z.object({
  visible: z.boolean(),
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
