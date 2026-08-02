import { NextResponse } from "next/server";
import { z } from "zod";

export const saveTranslationSchema = z.object({
  page: z.string().min(1, "Page is required"),
  key: z.string().min(1, "Key is required"),
  translations: z.object({
    en: z.string().optional(),
    tl: z.string().optional(),
    pa: z.string().optional(),
    ar: z.string().optional(),
    es: z.string().optional(),
  }),
});

export const seedTranslationsSchema = z.object({
  items: z.array(
    z.object({
      page: z.string().min(1),
      key: z.string().min(1),
      translations: z.object({
        en: z.string().optional(),
        tl: z.string().optional(),
        pa: z.string().optional(),
        ar: z.string().optional(),
        es: z.string().optional(),
      }),
    })
  ),
});

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: Request, validatedData: T) => Promise<NextResponse>
) {
  return async (req: Request) => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return await handler(req, validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", details: error.issues },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }
  };
}
