import { config } from "@/lib/config";

/**
 * Format Canadian/North American phone numbers into E.164 standard (+1XXXXXXXXXX).
 */
export function formatCanadianPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  if (phone.startsWith("+")) {
    return phone;
  }
  return `+1${digits}`;
}

export function isTwilioConfigured(): boolean {
  return Boolean(config.twilioAccountSid && config.twilioAuthToken);
}

export interface SendSmsParams {
  to: string;
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

  const formattedTo = formatCanadianPhoneNumber(params.to);
  const accountSid = config.twilioAccountSid;
  const authToken = config.twilioAuthToken;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const bodyData = new URLSearchParams();
  bodyData.append("To", formattedTo);
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
