import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { ServiceList } from "@/components/admin/ServiceList";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  let services: any[] = [];
  try {
    await connectDb();
    // Ensure ServiceImage is imported for mongoose virtuals populate
    import("@/lib/db/models/ServiceImage");
    services = await Service.find().sort({ sortOrder: 1 }).populate("images").lean();
  } catch (err) {
    console.error("Database connection failed on admin services page", err);
  }

  const formattedServices = services.map((s) => {
    const serviceImages = Array.isArray(s.images)
      ? s.images.map((img: any) => ({
          id: String(img._id),
          url: String(img.url),
          ipfsHash: String(img.ipfsHash),
          type: String(img.type),
          isPrivate: Boolean(img.isPrivate),
        }))
      : [];

    const photos = serviceImages.length > 0
      ? serviceImages.filter((img: any) => img.type === "service").map((img: any) => img.url)
      : (Array.isArray(s.photos) ? s.photos.map(String) : []);

    return {
      id: String(s._id),
      name: String(s.name),
      description: String(s.description ?? ""),
      durationMin: Number(s.durationMin),
      priceCents: Number(s.priceCents),
      depositCents: Number(s.depositCents),
      active: Boolean(s.active),
      sortOrder: Number(s.sortOrder ?? 0),
      category: String(s.category ?? "general"),
      photos,
      images: serviceImages,
    };
  });

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Page Header with Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
              Services
            </h1>
            <p className="mt-2 text-sm text-[var(--ink-soft)] max-w-xl">
              Pricing table and active offerings are driven by MongoDB. Modify details, photos, or toggle availability below.
            </p>
          </div>
          
          <Link
            href="/admin/services/new"
            className="self-start sm:self-center bg-gradient-to-r from-[#c8a86b] to-[#e2c78c] hover:from-[#e2c78c] hover:to-[#c8a86b] hover:shadow-[0_0_15px_rgba(200,168,107,0.25)] text-[#24180a] font-semibold text-sm py-2.5 px-6 rounded-xl transition-all duration-300 cursor-pointer shadow-md text-center block"
          >
            + Register Service
          </Link>
        </div>

        {/* Unified Service List Grid */}
        <div className="mt-4">
          <ServiceList services={formattedServices} />
        </div>
      </div>
    </AdminShell>
  );
}
