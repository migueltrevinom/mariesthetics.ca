import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { Client, ClientSettings, Manager } from "@/lib/db/models";
import { requestOtp } from "@/lib/auth/otp";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const bodySchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["client_login", "manager_login", "link_account"]),
  channel: z.enum(["email", "sms"]).optional(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);
    await connectDb();

    const email = body.email.toLowerCase();

    if (body.purpose === "manager_login") {
      const manager = await Manager.findOne({ email, active: true });
      if (!manager) {
        return NextResponse.json(
          { error: "No active manager account for this email" },
          { status: 404 },
        );
      }
    }

    if (body.purpose === "client_login" || body.purpose === "link_account") {
      let client = await Client.findOne({ email });
      if (!client) {
        if (!body.name) {
          return NextResponse.json(
            {
              error: "Create an account by providing your name, then verify the code.",
              needsProfile: true,
            },
            { status: 400 },
          );
        }
        client = await Client.create({
          name: body.name,
          email,
          phone: body.phone ?? "",
          referralCode: nanoid(),
        });
        await ClientSettings.create({ clientId: client._id });
      }
    }

    const result = await requestOtp({
      target: email,
      purpose: body.purpose,
      channel: body.channel,
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
