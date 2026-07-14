import { config } from "@/lib/config";
import type { OtpDeliveryProvider, SendOtpInput } from "./types";

/**
 * Twilio SMS adapter — stubbed until TWILIO_* env vars are configured.
 * Canadian numbers are cheap; plug credentials later without changing auth flow.
 */
export const smsOtpProvider: OtpDeliveryProvider = {
  channel: "sms",
  isConfigured() {
    return Boolean(
      config.twilioAccountSid &&
        config.twilioAuthToken &&
        config.twilioFromNumber,
    );
  },
  async send({ target, code, purpose }: SendOtpInput) {
    if (!this.isConfigured()) {
      console.info(
        `[OTP:sms:stub] Would send to ${target}: ${code} (${purpose}). Configure Twilio to enable.`,
      );
      throw new Error(
        "SMS OTP is not configured yet. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
      );
    }

    // Future: use Twilio REST API
    // const twilio = require("twilio")(sid, token);
    // await twilio.messages.create({ to: target, from: from, body: `...` });
    void target;
    void code;
    void purpose;
    throw new Error("Twilio SMS send is stubbed — install and wire twilio SDK when ready.");
  },
};
