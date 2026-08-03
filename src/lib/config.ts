import "@/lib/timezone";

export const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  timeZone: "America/Edmonton",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "50762639742",
  studioAddress:
    process.env.NEXT_PUBLIC_STUDIO_ADDRESS ??
    "1211 Gillespie Crescent NW, Edmonton AB T5T 6M5",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES ?? 10),
  holdExpiryHours: Number(process.env.HOLD_EXPIRY_HOURS ?? 2),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom:
    process.env.RESEND_FROM_EMAIL ??
    "Mari Esthetics <bookings@mariesthetics.ca>",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioMessagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID ?? "",
  twilioFromNumber: process.env.TWILIO_TESTING_NUMBER ?? process.env.TWILIO_FROM_NUMBER ?? "",
  cronSecret: process.env.CRON_SECRET ?? "mari_cron_secret_2026",
  mailgunApiKey: process.env.MAILGUN_API_KEY ?? "",
  mailgunDomain: process.env.MAILGUN_DOMAIN ?? "mg.mariesthetics.ca",
  mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL ?? "Mari Esthetics <bookings@mariesthetics.ca>",
  otpDefaultChannel: (process.env.OTP_DEFAULT_CHANNEL ?? "email") as
    | "email"
    | "sms",
  seedManagerEmails: (process.env.SEED_MANAGER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
};

export function whatsappUrl(message?: string) {
  const base = `https://wa.me/${config.whatsapp.replace(/\D/g, "")}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
