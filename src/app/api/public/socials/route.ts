import { NextResponse } from "next/server";
import { getActiveSocialLinks } from "@/app/api/admin/socials/modules/socialLink.module";

export async function GET(): Promise<NextResponse> {
  try {
    const socials = await getActiveSocialLinks();
    return NextResponse.json({ socials });
  } catch (err: any) {
    console.error("[Public Socials GET Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 });
  }
}
