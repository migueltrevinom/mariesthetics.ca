import { connectDb } from "@/lib/db/connect";
import { SocialLink } from "@/lib/db/models";

export class SocialLinkRepository {
  static async findAll() {
    await connectDb();
    return SocialLink.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  }

  static async findActive() {
    await connectDb();
    return SocialLink.find({ active: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();
  }

  static async upsertLink(data: {
    id?: string;
    platform: string;
    label: string;
    url: string;
    active?: boolean;
    sortOrder?: number;
  }) {
    await connectDb();
    if (data.id) {
      return SocialLink.findByIdAndUpdate(
        data.id,
        {
          platform: data.platform,
          label: data.label,
          url: data.url,
          active: data.active ?? true,
          sortOrder: data.sortOrder ?? 0,
        },
        { returnDocument: "after", runValidators: true }
      );
    }

    return SocialLink.create({
      platform: data.platform,
      label: data.label,
      url: data.url,
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
    });
  }

  static async deleteLink(id: string) {
    await connectDb();
    return SocialLink.findByIdAndDelete(id);
  }
}
