import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Manager } from "@/lib/db/models";
import { requestClientOtp, requestOtp } from "@/lib/auth/otp";

const bodySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  purpose: z.enum(["client_login", "manager_login", "link_account"]).optional().default("client_login"),
  channel: z.enum(["email", "sms"]).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);
    await connectDb();

    const email = body.email.toLowerCase().trim();

    if (body.purpose === "manager_login") {
      const manager = await Manager.findOne({ email, active: true });
      if (!manager) {
        return NextResponse.json(
          { error: "No active manager account found for this email." },
          { status: 404 },
        );
      }
      const result = await requestOtp({
        target: email,
        purpose: "manager_login",
        channel: body.channel,
      });
      return NextResponse.json(result);
    }

    // Client login: verify against Client table / guest bookings & store encrypted 10-min OTP
    const result = await requestClientOtp(email);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 400 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error("[request-otp Error]:", err);
    return NextResponse.json({ error: "Failed to send verification code. Please try again." }, { status: 500 });
  }
}
