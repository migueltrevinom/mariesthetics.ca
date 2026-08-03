import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { getAllCategories } from "@/app/api/admin/categories/modules/category.module";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await connectDb();
  const [rawCategories, rawServices] = await Promise.all([
    getAllCategories(),
    Service.find().sort({ sortOrder: 1, name: 1 }).lean(),
  ]);

  const categories = rawCategories.map((c: any) => ({
    _id: String(c._id),
    name: String(c.name),
    slug: String(c.slug),
    description: String(c.description ?? ""),
    active: Boolean(c.active),
    sortOrder: Number(c.sortOrder ?? 0),
    imageUrl: String(c.imageUrl ?? ""),
  }));

  const services = rawServices.map((s: any) => ({
    _id: String(s._id),
    name: String(s.name),
    description: String(s.description ?? ""),
    durationMin: Number(s.durationMin),
    priceCents: Number(s.priceCents),
    depositCents: Number(s.depositCents),
    category: String(s.category ?? "general"),
    active: Boolean(s.active),
  }));

  return (
    <AdminShell>
      <CategoriesManager initialCategories={categories} initialServices={services} />
    </AdminShell>
  );
}
