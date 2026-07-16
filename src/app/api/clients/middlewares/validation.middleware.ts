import { NextResponse } from "next/server";
import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
  banned: z.boolean().optional().default(false),
});

export const updateClientSchema = createClientSchema.extend({
  id: z.string().min(1, "Client ID is required"),
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
