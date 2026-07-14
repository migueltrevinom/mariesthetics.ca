import { redirect } from "next/navigation";
import { getSession, clearSessionCookie } from "@/lib/auth/jwt";
import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/clients", label: "Clients" },
];

async function logout() {
  "use server";
  await clearSessionCookie();
  redirect("/admin/login");
}

export async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.role !== "manager") {
    redirect("/admin/login");
  }
  return session;
}

export async function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="admin-shell">
      <div className="mx-auto grid min-h-screen max-w-6xl md:grid-cols-[220px_1fr]">
        <aside className="border-b border-white/10 px-6 py-5 md:border-b-0 md:border-r md:px-8 md:py-10">
          <p className="font-[family-name:var(--font-display)] text-2xl text-white">
            Mari Admin
          </p>
          <p className="mt-1 text-xs text-white/50">{session.name}</p>
          <nav className="mt-8 flex flex-wrap gap-3 md:flex-col md:gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="mt-8">
            <button type="submit" className="text-xs text-white/40 hover:text-white">
              Log out
            </button>
          </form>
        </aside>
        <div className="px-6 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
