import { NextResponse } from "next/server";
import { getActiveCategories } from "@/app/api/admin/categories/modules/category.module";

export async function GET() {
  try {
    const rawCategories = await getActiveCategories();
    const categories = rawCategories.map((c: any) => ({
      _id: String(c._id),
      name: String(c.name),
      slug: String(c.slug),
      description: String(c.description ?? ""),
      active: Boolean(c.active),
      sortOrder: Number(c.sortOrder ?? 0),
      imageUrl: String(c.imageUrl ?? ""),
    }));

    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    console.error("[Public Categories GET Error]:", err.message);
    return NextResponse.json({ success: false, categories: [] }, { status: 500 });
  }
}
