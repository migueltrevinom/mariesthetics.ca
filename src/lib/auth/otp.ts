import bcrypt from "bcryptjs";
import { addMinutes } from "date-fns";
import { connectDb } from "@/lib/db/connect";
import { Otp, Client, Booking } from "@/lib/db/models";
import { findOrCreateClientForGuest } from "@/lib/booking/clientResolver";
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

/**
 * Request an OTP for a client.
 * Stores the encrypted OTP code directly on the Client document with a strict 10-minute expiry.
 */
export async function requestClientOtp(email: string) {
  await connectDb();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Locate client in Client collection
  let client = await Client.findOne({ email: normalizedEmail });

  // 2. If client document doesn't exist yet, check if they have past bookings as guest
  if (!client) {
    const existingBooking = await Booking.findOne({ "guest.email": normalizedEmail }).sort({ createdAt: -1 });
    if (existingBooking && existingBooking.guest) {
      client = await findOrCreateClientForGuest(existingBooking.guest);
    }
  }

  if (!client) {
    return {
      ok: false as const,
      status: 404,
      error: "No account found with this email. Please book an appointment first to access your client portal.",
    };
  }

  // 3. Generate 6-digit code and bcrypt hash
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // 4. Store encrypted OTP in Otp collection
  await Otp.updateMany(
    { target: normalizedEmail, purpose: "client_login", consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  await Otp.create({
    target: normalizedEmail,
    channel: "email",
    purpose: "client_login",
    codeHash,
    expiresAt,
  });

  // Also update Client document for schema compatibility
  try {
    client.otp = {
      codeHash,
      expiresAt,
      attempts: 0,
    };
    await client.save();
  } catch (err) {
    console.warn("[requestClientOtp] Could not update client.otp subdoc, using Otp collection:", err);
  }

  // 5. Send code via email
  await emailOtpProvider.send({
    target: normalizedEmail,
    code,
    purpose: "client_login",
  });

  return {
    ok: true as const,
    channel: "email" as const,
    expiresAt,
  };
}

/**
 * Verify client OTP against the encrypted codeHash stored in Otp collection or Client model.
 */
export async function verifyClientOtp(email: string, code: string) {
  await connectDb();
  const normalizedEmail = email.trim().toLowerCase();
  const client = await Client.findOne({ email: normalizedEmail });

  if (!client) {
    return { ok: false as const, status: 404, error: "Client not found" };
  }

  // 1. Check Otp collection
  const otpRecord = await Otp.findOne({
    target: normalizedEmail,
    purpose: "client_login",
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (otpRecord) {
    if (new Date() > new Date(otpRecord.expiresAt)) {
      return {
        ok: false as const,
        status: 400,
        error: "Verification code has expired (valid for 10 minutes). Please request a new code.",
      };
    }

    if (otpRecord.attempts >= 5) {
      return {
        ok: false as const,
        status: 400,
        error: "Too many failed attempts. Please request a new code.",
      };
    }

    const match = await bcrypt.compare(code.trim(), otpRecord.codeHash);
    if (!match) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      return {
        ok: false as const,
        status: 400,
        error: "Invalid verification code. Please check your email and try again.",
      };
    }

    // Consume OTP
    otpRecord.consumedAt = new Date();
    await otpRecord.save();

    // Clear client.otp if present
    if (client.otp) {
      client.otp = undefined;
      await client.save().catch(() => {});
    }

    // Ensure all past bookings for this email link to this clientId
    await Booking.updateMany(
      { "guest.email": normalizedEmail, $or: [{ clientId: null }, { clientId: { $exists: false } }] },
      { $set: { clientId: client._id } }
    );

    return { ok: true as const, client };
  }

  // 2. Fallback to client.otp if present
  if (client.otp && client.otp.codeHash && client.otp.expiresAt) {
    if (new Date() > new Date(client.otp.expiresAt)) {
      client.otp = undefined;
      await client.save().catch(() => {});
      return {
        ok: false as const,
        status: 400,
        error: "Verification code has expired (valid for 10 minutes). Please request a new code.",
      };
    }

    if (client.otp.attempts >= 5) {
      return {
        ok: false as const,
        status: 400,
        error: "Too many failed attempts. Please request a new code.",
      };
    }

    const match = await bcrypt.compare(code.trim(), client.otp.codeHash);
    if (!match) {
      client.otp.attempts = (client.otp.attempts || 0) + 1;
      await client.save().catch(() => {});
      return {
        ok: false as const,
        status: 400,
        error: "Invalid verification code. Please check your email and try again.",
      };
    }

    // Consume OTP
    client.otp = undefined;
    await client.save().catch(() => {});

    // Ensure all past bookings for this email link to this clientId
    await Booking.updateMany(
      { "guest.email": normalizedEmail, $or: [{ clientId: null }, { clientId: { $exists: false } }] },
      { $set: { clientId: client._id } }
    );

    return { ok: true as const, client };
  }

  return {
    ok: false as const,
    status: 400,
    error: "No verification code requested or it has already been used. Please request a new code.",
  };
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
