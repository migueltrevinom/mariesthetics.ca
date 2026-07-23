import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { AdminLoginForm } from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session && session.role === "manager") {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
