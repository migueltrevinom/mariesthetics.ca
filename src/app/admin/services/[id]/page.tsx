import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";
import { ServiceEditor } from "@/components/admin/ServiceEditor";

export const dynamic = "force-dynamic";

interface AdminEditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditServicePage({ params }: AdminEditServicePageProps) {
  const { id } = await params;
  
  let dbService: any = null;
  try {
    await connectDb();
    // Ensure ServiceImage is imported for mongoose virtuals populate
    import("@/lib/db/models/ServiceImage");
    dbService = await Service.findById(id).populate("images").lean();
  } catch (err) {
    console.error("Database connection failed on admin service edit page", err);
  }

  if (!dbService) {
    notFound();
  }

  const serviceImages = Array.isArray(dbService.images)
    ? dbService.images.map((img: any) => ({
        id: String(img._id),
        url: String(img.url),
        ipfsHash: String(img.ipfsHash),
        type: String(img.type),
        isPrivate: Boolean(img.isPrivate),
      }))
    : [];

  const photos = serviceImages.length > 0
    ? serviceImages.filter((img: any) => img.type === "service").map((img: any) => img.url)
    : (Array.isArray(dbService.photos) ? dbService.photos.map(String) : []);

  const formattedService = {
    id: String(dbService._id),
    name: String(dbService.name),
    description: String(dbService.description ?? ""),
    durationMin: Number(dbService.durationMin),
    priceCents: Number(dbService.priceCents),
    depositCents: Number(dbService.depositCents),
    active: Boolean(dbService.active),
    sortOrder: Number(dbService.sortOrder ?? 0),
    category: String(dbService.category ?? "general"),
    photos,
    images: serviceImages,
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 w-full text-left">
        {/* Page Header */}
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Edit Service Info
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Modify values, categories, duration constraints, or upload image galleries for this specific profile.
          </p>
        </div>

        {/* Single Edit Panel */}
        <div className="mt-4">
          <ServiceEditor initialService={formattedService} isEdit={true} />
        </div>
      </div>
    </AdminShell>
  );
}
