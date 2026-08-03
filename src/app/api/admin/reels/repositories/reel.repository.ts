import { connectDb } from "@/lib/db/connect";
import { SocialReel } from "@/lib/db/models";

export class ReelRepository {
  static async findAll() {
    await connectDb();
    return SocialReel.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
  }

  static async findActive() {
    await connectDb();
    return SocialReel.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
  }

  static async upsertReel(data: {
    id?: string;
    platform: string;
    videoUrl: string;
    thumbnailUrl: string;
    externalUrl?: string;
    caption?: string;
    serviceName?: string;
    active?: boolean;
    sortOrder?: number;
  }) {
    await connectDb();
    const payload = {
      platform: data.platform,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      externalUrl: data.externalUrl ?? "",
      caption: data.caption ?? "",
      serviceName: data.serviceName ?? "",
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
    };

    if (data.id) {
      return SocialReel.findByIdAndUpdate(data.id, payload, {
        returnDocument: "after",
        runValidators: true,
      });
    }

    return SocialReel.create(payload);
  }

  static async deleteReel(id: string) {
    await connectDb();
    return SocialReel.findByIdAndDelete(id);
  }
}
