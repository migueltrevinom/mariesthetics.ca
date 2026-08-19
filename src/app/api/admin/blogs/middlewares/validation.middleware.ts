import { NextResponse } from "next/server";
import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  slug: z.string().optional(),
  excerpt: z.string().optional().default(""),
  content: z.string().min(1, "Content is required"),
  coverImage: z.string().optional().default(""),
  language: z.enum(["en", "es", "tl", "pa", "ar"]).default("en"),
  serviceIds: z.array(z.string()).optional().default([]),
  category: z.string().optional().default(""),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  publishedAt: z.string().nullable().optional(),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  author: z.string().optional().default("Marinelle Tala"),
  promoConfig: z
    .object({
      enabled: z.boolean().default(false),
      promoCode: z.string().optional().default(""),
      customPromoText: z.string().optional().default(""),
      ctaButtonText: z.string().optional().default("Book Treatment Now →"),
      ctaUrl: z.string().optional().default("/book"),
    })
    .optional()
    .default({
      enabled: false,
      promoCode: "",
      customPromoText: "",
      ctaButtonText: "Book Treatment Now →",
      ctaUrl: "/book",
    }),
});

export const updateBlogSchema = createBlogSchema.partial();

export const sendNewsletterSchema = z.object({
  subject: z.string().min(1, "Subject line is required"),
  targetLanguage: z.enum(["all", "en", "es", "tl", "pa", "ar"]).default("all"),
});

export const createSubscriberSchema = z.object({
  email: z.string().email("Valid email address is required").toLowerCase().trim(),
  name: z.string().optional().default(""),
  language: z.enum(["en", "es", "tl", "pa", "ar"]).default("en"),
  source: z.enum(["website", "booking", "blog", "admin"]).default("admin"),
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
