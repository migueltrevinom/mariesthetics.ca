import fs from "fs";
import path from "path";
import ejs from "ejs";
import { config } from "@/lib/config";

export interface SendEmailOptions {
  to: string;
  subject: string;
  templateName: "otp";
  data: Record<string, any>;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const { to, subject, templateName, data } = options;

    if (!config.mailgunApiKey) {
      console.warn("[Mailgun] MAILGUN_API_KEY is not set. Logging email content to console instead:");
      console.info(`[Mailgun:Email] To: ${to} | Subject: ${subject} | Data:`, data);
      return { success: true, messageId: "dev-stub-id" };
    }

    // 1. Resolve template path and read file
    const templatePath = path.join(process.cwd(), "src/lib/mailgun/templates", `${templateName}.ejs`);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Email template not found: ${templatePath}`);
    }

    const templateContent = fs.readFileSync(templatePath, "utf-8");

    // 2. Render EJS template
    const html = ejs.render(templateContent, data);

    // 3. Prepare Mailgun API request
    const authHeader = "Basic " + Buffer.from(`api:${config.mailgunApiKey}`).toString("base64");
    const formData = new URLSearchParams();
    formData.append("from", config.mailgunFromEmail);
    formData.append("to", to);
    formData.append("subject", subject);
    formData.append("html", html);

    const url = `https://api.mailgun.net/v3/${config.mailgunDomain}/messages`;

    // 4. Send email using native fetch
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const resultText = await response.text();

    if (!response.ok) {
      throw new Error(`Mailgun API error (Status ${response.status}): ${resultText}`);
    }

    const result = JSON.parse(resultText);
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
