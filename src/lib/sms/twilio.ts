import { config } from "@/lib/config";

/**
 * Format countryCode (e.g. "+1") and national phone number into E.164 standard.
 */
export function formatPhoneNumber(countryCode = "+1", phone = ""): string {
  const code = countryCode.trim().startsWith("+") ? countryCode.trim() : `+${countryCode.trim()}`;
  const digits = phone.replace(/\D/g, "");
  return `${code}${digits}`;
}

export function isTwilioConfigured(): boolean {
  return Boolean(config.twilioAccountSid && config.twilioAuthToken);
}

export interface SendSmsParams {
  countryCode?: string;
  phone: string;
  body: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an SMS message using Twilio's REST API.
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  if (!isTwilioConfigured()) {
    console.warn("[Twilio SMS]: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing. Skipping SMS dispatch.");
    return { success: false, error: "Twilio credentials not configured" };
  }

  const destinationNumber = formatPhoneNumber(params.countryCode || "+1", params.phone);
  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const bodyData = new URLSearchParams();
  bodyData.append("To", destinationNumber);
  bodyData.append("Body", params.body);

  if (config.twilioMessagingServiceSid) {
    bodyData.append("MessagingServiceSid", config.twilioMessagingServiceSid);
  } else if (config.twilioFromNumber) {
    bodyData.append("From", config.twilioFromNumber);
  } else {
    return { success: false, error: "Neither MessagingServiceSid nor From Number is configured" };
  }

  const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyData.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Twilio SMS API Error]:", data);
      return {
        success: false,
        error: data.message || `Twilio error code: ${data.code}`,
      };
    }

    return {
      success: true,
      messageId: data.sid,
    };
  } catch (err: any) {
    console.error("[Twilio SMS Exception]:", err.message);
    return {
      success: false,
      error: err.message || "Failed to send SMS via Twilio",
    };
  }
}
