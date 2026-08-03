import { NextResponse } from "next/server";
import { fetchEtransferSettings, saveEtransferSettings, recordEtransferPayment } from "../modules/etransfer.module";
import type { SessionPayload } from "@/lib/auth/jwt";

export async function handleGetEtransferSettings(): Promise<NextResponse> {
  try {
    const settings = await fetchEtransferSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error("[e-Transfer Controller GET Settings Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch e-Transfer settings" }, { status: 500 });
  }
}

export async function handleSaveEtransferSettings(
  req: Request,
  validatedData: {
    accountName: string;
    email: string;
    phone: string;
    autoDepositEnabled: boolean;
    instructions?: string;
  },
  manager: SessionPayload,
): Promise<NextResponse> {
  try {
    const settings = await saveEtransferSettings(validatedData, manager.email || "Admin");
    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error("[e-Transfer Controller Save Settings Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to save e-Transfer settings" }, { status: 500 });
  }
}

export async function handleRecordEtransfer(
  req: Request,
  validatedData: {
    amountCad: number;
    referenceNumber?: string;
    bookingId?: string;
    kind: "deposit" | "balance" | "tip" | "adjustment";
    note?: string;
    clientEmail?: string;
    clientName?: string;
  },
  manager: SessionPayload,
): Promise<NextResponse> {
  try {
    const payment = await recordEtransferPayment(validatedData, manager.email || "Admin", manager.sub);
    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    console.error("[e-Transfer Controller Record Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to record manual e-Transfer" }, { status: 500 });
  }
}
