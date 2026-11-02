import fs from "fs";
import path from "path";
import ejs from "ejs";
import { config } from "@/lib/config";
import { resolveOutboundEmail } from "@/lib/email/devRedirect";

export interface AttachmentOption {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  templateName?: "otp" | "booking-confirmation" | "admin-booking-notification" | "payment-link";
  html?: string;
  data?: Record<string, any>;
  attachment?: AttachmentOption;
  /** Request Host / x-forwarded-host. The real site host never uses the dev redirect. */
  host?: string | null;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, subject, templateName, html: rawHtml, data = {}, attachment } = options;

    if (!config.mailgunApiKey) {
      console.warn("[Mailgun] MAILGUN_API_KEY is not set. Logging email content to console instead:");
      console.info(`[Mailgun:Email] To: ${to} | Subject: ${subject} | Data:`, data);
      return { success: true, messageId: "dev-stub-id" };
    }

    // Dev inbox redirect is refused when NODE_ENV, Vercel production, or the site host says this is production.
    const routed = await resolveOutboundEmail(to, subject, options.host);
    const recipient = routed.to;
    const finalSubject = routed.subject;

    let html = rawHtml || "";
    if (!html && templateName) {
      const templatePath = path.join(process.cwd(), "src/lib/mailgun/templates", `${templateName}.ejs`);
      if (fs.existsSync(templatePath)) {
        const templateContent = fs.readFileSync(templatePath, "utf-8");
        const defaultData: Record<string, any> = {
          name: "Valued Client",
          expiryMinutes: config.otpExpiryMinutes || 10,
          purpose: "client_login",
          ...data,
        };
        html = ejs.render(templateContent, defaultData);
      }
    }

    // 3. Prepare Mailgun API request
    const authHeader = "Basic " + Buffer.from(`api:${config.mailgunApiKey}`).toString("base64");
    
    // Use FormData for attachment support
    const formData = new FormData();
    formData.append("from", config.mailgunFromEmail);
    formData.append("to", recipient);
    formData.append("subject", finalSubject);
    formData.append("html", html);

    if (attachment) {
      const blob = new Blob([attachment.content], { type: attachment.contentType });
      formData.append("attachment", blob, attachment.filename);
    }

    const url = `https://api.mailgun.net/v3/${config.mailgunDomain}/messages`;

    // 4. Send email using native fetch
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
      body: formData,
    });

    const resultText = await response.text();

    if (!response.ok) {
      throw new Error(`Mailgun API error (Status ${response.status}): ${resultText}`);
    }

    const result = JSON.parse(resultText);
    console.info(`[Mailgun] Successfully sent email to "${recipient}" with subject "${finalSubject}" (Message ID: ${result.id})`);
    return {
      success: true,
      messageId: result.id,
    };
  } catch (err: any) {
    console.error("[Mailgun Error]:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
