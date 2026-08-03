import { NextResponse } from "next/server";
import { z } from "zod";

export const quizOptionSchema = z.object({
  optionId: z.string().min(1),
  optionText: z.string().min(1, "Option text is required"),
  icon: z.string().optional().default("✨"),
  recommendedServiceId: z.string().optional().nullable(),
  scoreWeight: z.number().optional().default(1),
});

export const quizQuestionSchema = z.object({
  questionId: z.string().min(1),
  questionText: z.string().min(1, "Question text is required"),
  subtitle: z.string().optional().default(""),
  order: z.number().optional().default(0),
  options: z.array(quizOptionSchema).min(1, "At least 1 option required"),
});

export const createQuizSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  slug: z.string().min(1, "Quiz slug is required"),
  description: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  questions: z.array(quizQuestionSchema).min(1, "At least 1 question is required"),
});

export const updateQuizSchema = createQuizSchema.partial().extend({
  id: z.string().min(1, "Quiz ID is required"),
});

export const submitQuizSchema = z.object({
  quizId: z.string().min(1, "Quiz ID is required"),
  clientId: z.string().optional(),
  guest: z
    .object({
      name: z.string().optional().default(""),
      email: z.string().optional().default(""),
      phone: z.string().optional().default(""),
    })
    .optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      optionId: z.string().min(1),
      selectedText: z.string().optional().default(""),
    })
  ),
  recommendedServiceId: z.string().min(1, "Recommended service ID is required"),
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
