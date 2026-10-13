import { Resend } from "resend";
import { config } from "@/lib/config";
import { sendEmail } from "@/lib/mailgun";
import type { OtpDeliveryProvider, SendOtpInput } from "./types";

export const emailOtpProvider: OtpDeliveryProvider = {
  channel: "email",
  isConfigured() {
    return Boolean(config.mailgunApiKey || config.resendApiKey);
  },
  async send({ target, code, purpose }: SendOtpInput) {
    const subject =
      purpose === "manager_login"
        ? "Mari Esthetics management code"
        : "Your Mari Esthetics login code";

    // 1. If Mailgun is configured, send via Mailgun (which respects MAILGUN_DEV_EMAIL redirect)
    if (config.mailgunApiKey) {
      const emailResult = await sendEmail({
        to: target,
        subject,
        templateName: "otp",
        data: {
          name: purpose === "manager_login" ? "Manager" : "Valued Client",
          code,
          purpose,
          expiryMinutes: config.otpExpiryMinutes || 10,
        },
      });

      if (!emailResult.success) {
        throw new Error(`Failed to send OTP email via Mailgun: ${emailResult.error}`);
      }
      return;
    }

    const html = `
      <div style="font-family:Georgia,serif;color:#1c2a24">
        <h1 style="font-weight:400">Mari Esthetics</h1>
        <p>Your one-time code is:</p>
        <p style="font-size:28px;letter-spacing:4px"><strong>${code}</strong></p>
        <p>This code expires in ${config.otpExpiryMinutes} minutes.</p>
      </div>
    `;

    // 2. Fallback to Resend if configured
    if (config.resendApiKey) {
      const isDev = process.env.ENV === "development" || process.env.NODE_ENV === "development" || config.env === "development";
      const devEmail = isDev && config.mailgunDevEmail ? config.mailgunDevEmail.trim() : null;
      const recipient = devEmail || target;
      const finalSubject = devEmail ? `[DEV: originally to ${target}] ${subject}` : subject;

      const resend = new Resend(config.resendApiKey);
      const { error } = await resend.emails.send({
        from: config.resendFrom,
        to: recipient,
        subject: finalSubject,
        html,
      });

      if (error) {
        throw new Error(`Failed to send OTP email: ${error.message}`);
      }
      return;
    }

    // 3. Fallback: log to console in development
    const isDev = process.env.ENV === "development" || process.env.NODE_ENV === "development" || config.env === "development";
    const devEmail = isDev && config.mailgunDevEmail ? config.mailgunDevEmail.trim() : null;
    console.info(`[OTP:email] Target: ${target} (Dev redirect: ${devEmail || "none"}) → code: ${code} (${purpose})`);
  },
};
