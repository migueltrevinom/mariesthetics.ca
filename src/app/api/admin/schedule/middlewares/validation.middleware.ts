import { NextResponse } from "next/server";
import { z } from "zod";

const timeShiftSchema = z.object({
  openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

export const updateWeeklyScheduleSchema = z.object({
  weeklyHours: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      isOpen: z.boolean(),
      shifts: z.array(timeShiftSchema).default([]),
    })
  ),
});

export const dateOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isOpen: z.boolean(),
  shifts: z.array(timeShiftSchema).optional(),
  note: z.string().optional(),
});

export const blackoutBlockSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  reason: z.string().optional(),
});

export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (req: Request, validatedData: T, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]): Promise<NextResponse> => {
    try {
      const body = await req.json();
      const validatedData = schema.parse(body);
      return handler(req, validatedData, ...args);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: err.issues },
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
