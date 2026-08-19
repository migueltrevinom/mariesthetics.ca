import { NextResponse } from "next/server";
import { z } from "zod";
import { SubscriberRepository } from "@/app/api/admin/blogs/repositories/subscriber.repository";

export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  name: z.string().optional().default(""),
  language: z.enum(["en", "es", "tl", "pa", "ar"]).optional().default("en"),
  source: z.enum(["website", "booking", "blog", "admin"]).optional().default("website"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = subscribeSchema.parse(body);

    const subscriber = await SubscriberRepository.addSubscriber(validatedData);

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to Mari Esthetics updates!",
      subscriber: {
        email: subscriber.email,
        language: subscriber.language,
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to process subscription" },
      { status: 500 }
    );
  }
}
