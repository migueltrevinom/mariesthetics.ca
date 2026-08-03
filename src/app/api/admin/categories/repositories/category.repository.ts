import { connectDb } from "@/lib/db/connect";
import { Category } from "@/lib/db/models";

const DEFAULT_CATEGORIES = [
  {
    name: "Facials & Skin Care",
    slug: "facials",
    description: "Customized facial treatments, deep cleansing & dermaplaning for healthy glowing skin.",
    active: true,
    sortOrder: 1,
  },
  {
    name: "Lashes & Lift",
    slug: "lashes",
    description: "Lash lifts, tinting & extensions tailored to your natural beauty.",
    active: true,
    sortOrder: 2,
  },
  {
    name: "Permanent MakeUp & Brows",
    slug: "permanentMakeUp",
    description: "Brow shaping, tinting & permanent cosmetics for low-maintenance beauty.",
    active: true,
    sortOrder: 3,
  },
  {
    name: "General Services",
    slug: "general",
    description: "Additional esthetics and studio care treatments.",
    active: true,
    sortOrder: 4,
  },
];

export class CategoryRepository {
  static async seedDefaultsIfNeeded() {
    await connectDb();
    const count = await Category.countDocuments();
    if (count === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await Category.create(cat);
      }
    }
  }

  static async findAll() {
    await connectDb();
    await this.seedDefaultsIfNeeded();
    return Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async findActive() {
    await connectDb();
    await this.seedDefaultsIfNeeded();
    return Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean();
  }

  static async upsertCategory(data: {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    active?: boolean;
    sortOrder?: number;
    imageUrl?: string;
  }) {
    await connectDb();

    // Auto-generate slug if missing
    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "category";

    const payload = {
      name: data.name,
      slug,
      description: data.description ?? "",
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
      imageUrl: data.imageUrl ?? "",
    };

    if (data.id) {
      return Category.findByIdAndUpdate(data.id, payload, {
        returnDocument: "after",
        runValidators: true,
      });
    }

    return Category.create(payload);
  }

  static async deleteCategory(id: string) {
    await connectDb();
    return Category.findByIdAndDelete(id);
  }
}
