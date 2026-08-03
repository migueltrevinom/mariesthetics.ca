import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { withManagerAuth } from "@/lib/auth/jwt";

const patchCategorySchema = z.object({
  serviceId: z.string().min(1, "Service ID is required"),
  categorySlug: z.string().min(1, "Category slug is required"),
});

export const PATCH = withManagerAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const { serviceId, categorySlug } = patchCategorySchema.parse(body);

    await connectDb();
    const service = await Service.findByIdAndUpdate(
      serviceId,
      { category: categorySlug },
      { new: true, runValidators: true }
    );

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      service,
      message: `Service "${service.name}" assigned to category "${categorySlug}".`,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    console.error("[Service Category PATCH Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to update service category" }, { status: 500 });
  }
});
