import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { ClientLoginForm } from "./ClientLoginForm";

export const dynamic = "force-dynamic";

export default async function ClientLoginPage() {
  const session = await getSession();
  if (session && session.role === "client") {
    redirect("/portal");
  }

  return <ClientLoginForm />;
}
