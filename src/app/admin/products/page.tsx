import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Product, Service } from "@/lib/db/models";
import { ProductsManager } from "@/components/admin/ProductsManager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let products: any[] = [];
  let services: any[] = [];

  try {
    await connectDb();
    const [rawProducts, rawServices] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).populate("serviceId").lean(),
      Service.find({ active: true }).sort({ sortOrder: 1 }).lean(),
    ]);

    products = rawProducts.map((p: any) => ({
      _id: String(p._id),
      name: String(p.name),
      description: String(p.description || ""),
      kind: p.kind || "full_payment",
      priceCents: Number(p.priceCents),
      serviceId: p.serviceId
        ? {
            _id: String(p.serviceId._id),
            name: String(p.serviceId.name),
            priceCents: Number(p.serviceId.priceCents),
            depositCents: Number(p.serviceId.depositCents),
          }
        : null,
      stripeProductId: String(p.stripeProductId || ""),
      stripePriceId: String(p.stripePriceId || ""),
      active: Boolean(p.active),
      sku: String(p.sku || ""),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    }));

    services = rawServices.map((s: any) => ({
      _id: String(s._id),
      name: String(s.name),
      priceCents: Number(s.priceCents),
      depositCents: Number(s.depositCents),
    }));
  } catch {
    // db offline
  }

  return (
    <AdminShell>
      <ProductsManager initialProducts={products} services={services} />
    </AdminShell>
  );
}
