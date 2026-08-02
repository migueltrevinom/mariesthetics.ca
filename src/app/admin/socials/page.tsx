import { getAllSocialLinks } from "@/app/api/admin/socials/modules/socialLink.module";
import { SocialsManager } from "@/components/admin/SocialsManager";

export const dynamic = "force-dynamic";

export default async function AdminSocialsPage() {
  const rawSocials = await getAllSocialLinks();
  const socials = rawSocials.map((s: any) => ({
    _id: String(s._id),
    platform: String(s.platform),
    label: String(s.label),
    url: String(s.url),
    active: Boolean(s.active),
    sortOrder: Number(s.sortOrder ?? 0),
  }));

  return <SocialsManager initialSocials={socials} />;
}
