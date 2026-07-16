import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { config } from "@/lib/config";
import Manager from "../models/manager.model";
import Otp from "../models/otp.model";
import { sendEmail } from "@/lib/mailgun";

export async function requestManagerOtp(email: string) {
  await connectDb();
  
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Verify manager exists and is active
  const manager = await Manager.findOne({ email: normalizedEmail, active: true });
  if (!manager) {
    throw new Error("No active manager account found for this email");
  }

  // 2. Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = addMinutes(new Date(), config.otpExpiryMinutes);

  // 3. Save OTP to DB
  await Otp.create({
    target: normalizedEmail,
    channel: "email",
    purpose: "manager_login",
    codeHash,
    expiresAt,
  });

  // 4. Send email using the EJS Mailgun service
  const emailResult = await sendEmail({
    to: normalizedEmail,
    subject: "Mari Esthetics Portal - Authentication Code",
    templateName: "otp",
    data: {
      name: manager.name,
      code,
      expiryMinutes: config.otpExpiryMinutes,
    },
  });

  if (!emailResult.success) {
    throw new Error(`Failed to send verification email: ${emailResult.error}`);
  }

  return {
    success: true,
    expiresAt,
    // Provide OTP in dev if Mailgun is not configured
    ...(process.env.NODE_ENV !== "production" && !config.mailgunApiKey ? { devCode: code } : {}),
  };
}

export async function verifyManagerOtp(email: string, code: string) {
  await connectDb();
  
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Find the latest valid OTP
  const otp = await Otp.findOne({
    target: normalizedEmail,
    purpose: "manager_login",
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return { ok: false as const, error: "Invalid or expired verification code" };
  }

  // 2. Prevent brute force checks
  if (otp.attempts >= 5) {
    return { ok: false as const, error: "Too many failed attempts. Please request a new code." };
  }

  // 3. Validate code
  const isMatch = await bcrypt.compare(code.trim(), otp.codeHash);
  otp.attempts += 1;

  if (!isMatch) {
    await otp.save();
    return { ok: false as const, error: "Invalid or expired verification code" };
  }

  // 4. Mark code as consumed
  otp.consumedAt = new Date();
  await otp.save();

  // 5. Load the Manager info
  const manager = await Manager.findOne({ email: normalizedEmail, active: true });
  if (!manager) {
    return { ok: false as const, error: "Manager account was deactivated or not found" };
  }

  return {
    ok: true as const,
    manager: {
      id: String(manager._id),
      email: manager.email,
      name: manager.name,
      role: manager.role,
    },
  };
}
