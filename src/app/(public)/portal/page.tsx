import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/jwt";
import { ClientDashboard } from "@/components/portal/ClientDashboard";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const session = await getSession();
  if (!session || session.role !== "client") {
    redirect("/login");
  }

  return <ClientDashboard initialSessionName={session.name || "Valued Client"} />;
}
