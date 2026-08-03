import { NextResponse } from "next/server";
import { getAllCategories, saveCategory, removeCategory } from "../modules/category.module";

export async function handleGetAllCategories(): Promise<NextResponse> {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    console.error("[Categories Controller GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}

export async function handleSaveCategory(_req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const category = await saveCategory(validatedData);
    return NextResponse.json({ category, message: "Category saved successfully" });
  } catch (err: any) {
    console.error("[Categories Controller Save Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to save category" }, { status: 500 });
  }
}

export async function handleDeleteCategory(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }
    const category = await removeCategory(id);
    return NextResponse.json({ category, message: "Category removed successfully" });
  } catch (err: any) {
    console.error("[Categories Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete category" }, { status: 500 });
  }
}
