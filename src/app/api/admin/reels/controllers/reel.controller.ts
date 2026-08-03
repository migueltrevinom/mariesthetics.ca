import { NextResponse } from "next/server";
import { getAllReels, saveReel, removeReel, getShowcaseVisibility, setShowcaseVisibility } from "../modules/reel.module";

export async function handleGetAllReels(): Promise<NextResponse> {
  try {
    const [reels, showcaseVisible] = await Promise.all([
      getAllReels(),
      getShowcaseVisibility(),
    ]);
    return NextResponse.json({ reels, showcaseVisible });
  } catch (err: any) {
    console.error("[Reels Controller GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to load reels" }, { status: 500 });
  }
}

export async function handleSaveReel(_req: Request, validatedData: any): Promise<NextResponse> {
  try {
    const reel = await saveReel(validatedData);
    return NextResponse.json({ reel, message: "Reel saved successfully" });
  } catch (err: any) {
    console.error("[Reels Controller Save Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to save reel" }, { status: 500 });
  }
}

export async function handleDeleteReel(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Reel ID is required" }, { status: 400 });
    }
    const reel = await removeReel(id);
    return NextResponse.json({ reel, message: "Reel removed successfully" });
  } catch (err: any) {
    console.error("[Reels Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete reel" }, { status: 500 });
  }
}

export async function handleToggleShowcase(_req: Request, validatedData: { visible: boolean }): Promise<NextResponse> {
  try {
    await setShowcaseVisibility(validatedData.visible);
    return NextResponse.json({
      showcaseVisible: validatedData.visible,
      message: validatedData.visible ? "Reel showcase is now visible on landing page" : "Reel showcase is now hidden from landing page",
    });
  } catch (err: any) {
    console.error("[Reels Controller Toggle Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to toggle showcase" }, { status: 500 });
  }
}
