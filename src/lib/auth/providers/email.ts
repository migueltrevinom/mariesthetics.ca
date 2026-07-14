import { Resend } from "resend";
import { config } from "@/lib/config";
import type { OtpDeliveryProvider, SendOtpInput } from "./types";

export const emailOtpProvider: OtpDeliveryProvider = {
  channel: "email",
  isConfigured() {
    return Boolean(config.resendApiKey);
  },
  async send({ target, code, purpose }: SendOtpInput) {
    const subject =
      purpose === "manager_login"
        ? "Mari Esthetics management code"
        : "Your Mari Esthetics login code";

    const html = `
      <div style="font-family:Georgia,serif;color:#1c2a24">
        <h1 style="font-weight:400">Mari Esthetics</h1>
        <p>Your one-time code is:</p>
        <p style="font-size:28px;letter-spacing:4px"><strong>${code}</strong></p>
        <p>This code expires in ${config.otpExpiryMinutes} minutes.</p>
      </div>
    `;

    if (!config.resendApiKey) {
      console.info(`[OTP:email] ${target} → ${code} (${purpose})`);
      return;
    }

    const resend = new Resend(config.resendApiKey);
    const { error } = await resend.emails.send({
      from: config.resendFrom,
      to: target,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  },
};
