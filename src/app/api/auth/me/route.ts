import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/jwt";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.sub,
      role: session.role,
      email: session.email,
      name: session.name,
    },
  });
}
