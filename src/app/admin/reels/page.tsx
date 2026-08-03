import { AdminShell } from "@/components/admin/AdminShell";
import { ReelsManager } from "@/components/admin/ReelsManager";
import { getAllReels, getShowcaseVisibility } from "@/app/api/admin/reels/modules/reel.module";

export const dynamic = "force-dynamic";

export default async function AdminReelsPage() {
  const [rawReels, showcaseVisible] = await Promise.all([
    getAllReels(),
    getShowcaseVisibility(),
  ]);

  const reels = rawReels.map((r: any) => ({
    _id: String(r._id),
    platform: String(r.platform),
    videoUrl: String(r.videoUrl),
    thumbnailUrl: String(r.thumbnailUrl),
    externalUrl: String(r.externalUrl ?? ""),
    caption: String(r.caption ?? ""),
    serviceName: String(r.serviceName ?? ""),
    active: Boolean(r.active),
    sortOrder: Number(r.sortOrder ?? 0),
  }));

  return (
    <AdminShell>
      <ReelsManager initialReels={reels} initialShowcaseVisible={showcaseVisible} />
    </AdminShell>
  );
}
