import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { AdminNav } from "./AdminNav";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/app/admin/actions";

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
    <div className="admin-shell w-full">
      <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
        <aside className="border-b border-[var(--border-color)] px-6 py-5 md:border-b-0 md:border-r md:border-[var(--border-color)] md:px-6 md:py-10 flex flex-col bg-[var(--sidebar-bg)] md:bg-[var(--sidebar-bg)]/40 transition-colors duration-200">
          {/* Brand Logo & Header */}
          <div className="text-left">
            <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#c8a86b] font-bold">
              Mari Esthetics
            </p>
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)] tracking-wide mt-1">
              Admin Portal
            </p>
          </div>

          {/* Privy-style Monogram Profile Widget */}
          <div className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl p-3 mt-5 text-left shadow-inner transition-colors duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1f4d3a] to-[#c8a86b] flex items-center justify-center text-xs font-bold text-white shadow-md">
              {session.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-semibold text-[var(--ink)] truncate leading-tight">
                {session.name}
              </p>
              <p className="text-[10px] text-[var(--ink-soft)] truncate mt-0.5">
                {session.email}
              </p>
            </div>
          </div>

          {/* Privy-style Navigation */}
          <AdminNav />

          {/* Privy-style Theme Toggle */}
          <ThemeToggle />

          {/* Log out option at bottom */}
          <form action={logout} className="mt-6 md:mt-auto pt-4 md:pt-6 md:border-t border-[var(--border-color)]">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/[0.02] border border-transparent rounded-xl transition-all duration-200 cursor-pointer text-left"
            >
              <svg className="w-4 h-4 text-[var(--ink-soft)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log out</span>
            </button>
          </form>
        </aside>
        <div className="px-6 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
