import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Otp } from "@/lib/db/models";
import { config } from "@/lib/config";
import { emailOtpProvider } from "./providers/email";
import { smsOtpProvider } from "./providers/sms";
import type { OtpChannel } from "./providers/types";

export type OtpPurpose = "client_login" | "manager_login" | "link_account";

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getProvider(channel: OtpChannel) {
  return channel === "sms" ? smsOtpProvider : emailOtpProvider;
}

export async function requestOtp(input: {
  target: string;
  purpose: OtpPurpose;
  channel?: OtpChannel;
}) {
  await connectDb();
  const channel = input.channel ?? config.otpDefaultChannel;
  const provider = getProvider(channel);
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = addMinutes(new Date(), config.otpExpiryMinutes);
  const target = input.target.trim().toLowerCase();

  await Otp.create({
    target,
    channel,
    purpose: input.purpose,
    codeHash,
    expiresAt,
  });

  await provider.send({ target, code, purpose: input.purpose });

  return {
    ok: true as const,
    channel,
    expiresAt,
    // Dev convenience when Resend is not configured
    ...(process.env.NODE_ENV !== "production" && !provider.isConfigured()
      ? { devCode: code }
      : {}),
  };
}

export async function verifyOtp(input: {
  target: string;
  code: string;
  purpose: OtpPurpose;
}) {
  await connectDb();
  const target = input.target.trim().toLowerCase();

  const otp = await Otp.findOne({
    target,
    purpose: input.purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { ok: false as const, error: "Invalid or expired code" };
  }

  if (otp.attempts >= 5) {
    return { ok: false as const, error: "Too many attempts" };
  }

  const match = await bcrypt.compare(input.code.trim(), otp.codeHash);
  otp.attempts += 1;

  if (!match) {
    await otp.save();
    return { ok: false as const, error: "Invalid or expired code" };
  }

  otp.consumedAt = new Date();
  await otp.save();
  return { ok: true as const };
}
