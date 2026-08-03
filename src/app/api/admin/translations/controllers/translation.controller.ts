import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";
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
    const session = await getSession();
    const updatedBy = session
      ? session.name
        ? `${session.name} (${session.email})`
        : session.email
      : data.updatedBy || "Manager";

    const translation = await saveTranslation({
      ...data,
      updatedBy,
    });
    return NextResponse.json({ translation });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save translation" }, { status: 500 });
  }
}

export async function handleSeedTranslations(req: Request, data: any) {
  try {
    const session = await getSession();
    const updatedBy = session
      ? session.name
        ? `${session.name} (${session.email})`
        : session.email
      : "System Seed";

    const items = (data.items || []).map((item: any) => ({
      ...item,
      updatedBy,
    }));

    const count = await seedTranslations(items);
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
