import Link from "next/link";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import type { NavService } from "@/components/public/MegaMenu";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";

async function getNavServices(): Promise<NavService[]> {
  try {
    await connectDb();
    const services = await Service.find({ active: true })
      .sort({ sortOrder: 1 })
      .lean();
    return services.map((s) => ({
      id: String(s._id),
      name: String(s.name),
      category: String(s.category ?? "general"),
      priceCents: Number(s.priceCents),
    }));
  } catch {
    return [];
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navServices = await getNavServices();

  return (
    <div className="min-h-screen bg-night">
      <SiteHeader navServices={navServices} />
      <main id="main">{children}</main>
      <SiteFooter />
      <div className="fixed bottom-5 right-5 z-30 md:hidden">
        <Link href="/book" className="btn-primary shadow-[var(--shadow)]">
          Book
        </Link>
      </div>
    </div>
  );
}
