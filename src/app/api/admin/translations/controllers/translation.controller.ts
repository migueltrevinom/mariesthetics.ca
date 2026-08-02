import { NextResponse } from "next/server";
import {
  getAllTranslations,
  saveTranslation,
  seedTranslations,
  deleteTranslationById,
} from "../modules/translation.module";

export async function handleGetAllTranslations() {
  try {
    const translations = await getAllTranslations();
    return NextResponse.json({ translations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch translations" }, { status: 500 });
  }
}

export async function handleSaveTranslation(req: Request, data: any) {
  try {
    const translation = await saveTranslation(data);
    return NextResponse.json({ translation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save translation" }, { status: 500 });
  }
}

export async function handleSeedTranslations(req: Request, data: any) {
  try {
    const count = await seedTranslations(data.items || []);
    return NextResponse.json({ message: `Seeded ${count} default translation keys into database`, count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to seed translations" }, { status: 500 });
  }
}

export async function handleDeleteTranslation(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing translation ID" }, { status: 400 });
    }
    const success = await deleteTranslationById(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete translation" }, { status: 500 });
  }
}
