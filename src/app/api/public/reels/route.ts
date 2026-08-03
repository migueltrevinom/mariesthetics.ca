import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db/connect";
import { SocialReel, getOrCreateSettings } from "@/lib/db/models";

export async function GET() {
  try {
    await connectDb();

    const settings = await getOrCreateSettings();
    if (!settings.showReelsShowcase) {
      return NextResponse.json({ reels: [], showcaseVisible: false });
    }

    const reels = await SocialReel.find({ active: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const serialized = reels.map((r: any) => ({
      _id: String(r._id),
      platform: r.platform,
      videoUrl: r.videoUrl,
      thumbnailUrl: r.thumbnailUrl,
      externalUrl: r.externalUrl || "",
      caption: r.caption || "",
      serviceName: r.serviceName || "",
    }));

    return NextResponse.json({ reels: serialized, showcaseVisible: true });
  } catch (err: any) {
    console.error("[Public Reels GET Error]:", err.message);
    return NextResponse.json({ reels: [], showcaseVisible: false });
  }
}
