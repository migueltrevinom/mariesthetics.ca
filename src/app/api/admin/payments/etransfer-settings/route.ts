import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDb } from "@/lib/db/connect";
import { EtransferSettings } from "@/lib/db/models/EtransferSettings";
import { AuthError, requireManager } from "@/lib/auth/jwt";

const bodySchema = z.object({
  accountName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  autoDepositEnabled: z.boolean().default(true),
  instructions: z.string().optional().default(""),
});

export async function GET() {
  try {
    await requireManager();
    await connectDb();

    let settings = await EtransferSettings.findOne().lean();
    if (!settings) {
      settings = await EtransferSettings.create({
        accountName: "Mari Esthetics / Marinelle Tala",
        email: "mari@mariesthetics.ca",
        phone: "+1 7809133081",
        autoDepositEnabled: true,
        instructions: "Please include your appointment date and full name in the e-Transfer note.",
      });
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Failed to fetch e-Transfer settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const manager = await requireManager();
    const body = bodySchema.parse(await req.json());
    await connectDb();

    let settings = await EtransferSettings.findOne();
    if (!settings) {
      settings = new EtransferSettings(body);
    } else {
      settings.accountName = body.accountName;
      settings.email = body.email;
      settings.phone = body.phone;
      settings.autoDepositEnabled = body.autoDepositEnabled;
      settings.instructions = body.instructions;
    }

    settings.updatedBy = manager.email || "Admin";
    await settings.save();

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save e-Transfer settings" }, { status: 500 });
  }
}
