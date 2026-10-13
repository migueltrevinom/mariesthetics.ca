import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Client, Manager } from "@/lib/db/models";
import { verifyClientOtp, verifyOtp } from "@/lib/auth/otp";
import { setSessionCookie, signSession } from "@/lib/auth/jwt";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  purpose: z.enum(["client_login", "manager_login", "link_account"]),
});

export async function POST(req: Request) {
  try {
    const body = bodySchema.parse(await req.json());
    await connectDb();
    const email = body.email.trim().toLowerCase();

    if (body.purpose === "manager_login") {
      const verified = await verifyOtp({
        target: email,
        code: body.code,
        purpose: "manager_login",
      });

      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: 400 });
      }

      const manager = await Manager.findOne({ email, active: true });
      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      const token = await signSession({
        sub: String(manager._id),
        role: "manager",
        email: manager.email,
        name: manager.name,
      });
      await setSessionCookie(token);

      return NextResponse.json({
        ok: true,
        role: "manager",
        user: { id: manager._id, email: manager.email, name: manager.name },
      });
    }

    // Client login verification against Client document encrypted OTP
    const verified = await verifyClientOtp(email, body.code);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status || 400 });
    }

    const client = verified.client;
    const token = await signSession({
      sub: String(client._id),
      role: "client",
      email: client.email,
      name: client.name,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      ok: true,
      role: "client",
      user: {
        id: client._id,
        email: client.email,
        name: client.name,
        subscription: client.subscription,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
  }
}
