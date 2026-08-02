import { NextResponse } from "next/server";
import { getAllSocialLinks, saveSocialLink, removeSocialLink } from "../modules/socialLink.module";

export async function handleGetAllSocials(): Promise<NextResponse> {
  try {
    const socials = await getAllSocialLinks();
    return NextResponse.json({ socials });
  } catch (err: any) {
    console.error("[Socials Controller GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load social links" }, { status: 500 });
  }
}

export async function handleSaveSocial(req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const social = await saveSocialLink(validatedData);
    return NextResponse.json({ social, message: "Social link saved successfully" });
  } catch (err: any) {
    console.error("[Socials Controller Save Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to save social link" }, { status: 500 });
  }
}

export async function handleDeleteSocial(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Social link ID is required" }, { status: 400 });
    }

    const social = await removeSocialLink(id);
    return NextResponse.json({ social, message: "Social link removed successfully" });
  } catch (err: any) {
    console.error("[Socials Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete social link" }, { status: 500 });
  }
}
