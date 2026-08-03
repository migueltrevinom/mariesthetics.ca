import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { getAllCategories } from "@/app/api/admin/categories/modules/category.module";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rawCategories = await getAllCategories();
  const categories = rawCategories.map((c: any) => ({
    _id: String(c._id),
    name: String(c.name),
    slug: String(c.slug),
    description: String(c.description ?? ""),
    active: Boolean(c.active),
    sortOrder: Number(c.sortOrder ?? 0),
    imageUrl: String(c.imageUrl ?? ""),
  }));

  return (
    <AdminShell>
      <CategoriesManager initialCategories={categories} />
    </AdminShell>
  );
}
