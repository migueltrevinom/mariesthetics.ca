import Link from "next/link";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import type { NavService } from "@/components/public/MegaMenu";
import { connectDb } from "@/lib/db/connect";
import { Service } from "@/lib/db/models";

async function getNavServices(): Promise<NavService[]> {
  try {
    await connectDb();
    // ⚡ Bolt Optimization: Select only fields required by NavService (name, category, priceCents)
    // to reduce DB document payload size and network transfer bandwidth on every public page request.
    const services = await Service.find({ active: true })
      .select("name category priceCents")
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
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
