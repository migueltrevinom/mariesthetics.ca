import { SubscriberRepository } from "../repositories/subscriber.repository";
import { BlogRepository } from "../repositories/blog.repository";
import { sendEmail } from "@/lib/mailgun";
import { config } from "@/lib/config";

export function generateNewsletterHtml(blog: any, baseUrl: string): string {
  const postUrl = `${baseUrl}/blog/${blog.slug}`;
  const promo = blog.promoConfig;

  let promoSectionHtml = "";
  if (promo && promo.enabled) {
    const promoCodeBox = promo.promoCode
      ? `<div style="background: #f7f4ed; border: 2px dashed #c8a86b; padding: 16px 20px; border-radius: 12px; margin: 18px 0; text-align: center;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #887d70; font-weight: bold;">Special Studio Offer</p>
          <p style="margin: 6px 0 0 0; font-size: 22px; font-family: monospace; font-weight: bold; color: #24180a; letter-spacing: 2px;">${promo.promoCode}</p>
        </div>`
      : "";

    promoSectionHtml = `
      <div style="margin-top: 36px; padding: 24px; background: #ffffff; border-radius: 16px; border: 1px solid #e8e3d9; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <span style="font-size: 28px; display: block; margin-bottom: 6px;">✨</span>
        <h4 style="margin: 0 0 8px 0; color: #24180a; font-size: 18px; font-weight: 700;">Exclusive Client Promotion</h4>
        <p style="margin: 0; color: #5a5043; font-size: 13.5px; line-height: 1.5;">
          ${promo.customPromoText || "Treat yourself to radiant skin with our tailored treatments."}
        </p>
        ${promoCodeBox}
        <div style="margin-top: 18px;">
          <a href="${baseUrl}${promo.ctaUrl || "/book"}" style="background-color: #24180a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 700; font-size: 13px; display: inline-block; letter-spacing: 0.5px;">
            ${promo.ctaButtonText || "Book Your Treatment →"}
          </a>
        </div>
      </div>
    `;
  }

  const coverImageHtml = blog.coverImage
    ? `<div style="margin-bottom: 24px; border-radius: 14px; overflow: hidden; max-height: 280px;">
        <img src="${blog.coverImage}" alt="${blog.title}" style="width: 100%; height: auto; display: block; object-fit: cover;" />
      </div>`
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f6; padding: 32px 20px; color: #24180a;">
      
      <!-- Studio Header -->
      <div style="text-align: center; margin-bottom: 28px;">
        <h2 style="font-size: 20px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #24180a; margin: 0;">
          MARI ESTHETICS
        </h2>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #887d70; margin-top: 4px;">
          Private Home Studio · Edmonton, Alberta
        </p>
      </div>

      <!-- Main Blog Card -->
      <div style="background: #ffffff; padding: 28px; border-radius: 16px; border: 1px solid #eae5db;">
        ${coverImageHtml}
        
        <span style="display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #c8a86b; font-weight: 700; margin-bottom: 8px;">
          New Studio Article
        </span>
        
        <h1 style="margin: 0 0 14px 0; font-size: 22px; color: #24180a; line-height: 1.35; font-weight: 700;">
          ${blog.title}
        </h1>
        
        <p style="color: #665b4e; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
          ${blog.excerpt || "Read our latest skincare advice, transformation stories, and aftercare tips directly from Marinelle."}
        </p>

        <div style="text-align: left; margin-top: 24px;">
          <a href="${postUrl}" style="background-color: #24180a; color: #ffffff; text-decoration: none; padding: 12px 26px; border-radius: 10px; font-weight: 700; font-size: 13px; display: inline-block;">
            Read Full Article on Studio Blog →
          </a>
        </div>
      </div>

      <!-- Promotional Section (if configured) -->
      ${promoSectionHtml}

      <!-- Footer -->
      <div style="text-align: center; margin-top: 32px; font-size: 11.5px; color: #9e9386; line-height: 1.5;">
        <p style="margin: 0;">
          Mari Esthetics · West Edmonton, AB · By Appointment Only
        </p>
        <p style="margin: 6px 0 0 0;">
          You received this email because you subscribed to Mari Esthetics skincare updates.
        </p>
      </div>
    </div>
  `;
}

export async function dispatchBlogNewsletter(params: {
  blogId: string;
  subject: string;
  targetLanguage?: string;
  baseUrl?: string;
}): Promise<{
  success: boolean;
  recipientsCount: number;
  message?: string;
}> {
  const blog = await BlogRepository.findById(params.blogId);
  if (!blog) {
    throw new Error("Blog post not found");
  }

  const subscribers = await SubscriberRepository.findActiveSubscribers(params.targetLanguage);
  if (subscribers.length === 0) {
    return {
      success: true,
      recipientsCount: 0,
      message: "No active subscribers found for the selected language.",
    };
  }

  const baseUrl = params.baseUrl || config.appUrl || "https://mariesthetics.ca";
  const html = generateNewsletterHtml(blog, baseUrl);

  let successCount = 0;
  for (const subscriber of subscribers) {
    try {
      const res = await sendEmail({
        to: subscriber.email,
        subject: params.subject || `✨ New from Mari Esthetics: ${blog.title}`,
        html,
      });
      if (res.success) {
        successCount++;
      }
    } catch (err: any) {
      console.error(`[Newsletter Send Error] to ${subscriber.email}:`, err.message);
    }
  }

  await SubscriberRepository.logDispatch({
    blogId: blog._id.toString(),
    subject: params.subject,
    recipientsCount: successCount,
    language: params.targetLanguage || "all",
    status: successCount > 0 ? "sent" : "failed",
  });

  return {
    success: true,
    recipientsCount: successCount,
    message: `Newsletter successfully sent to ${successCount} subscriber(s).`,
  };
}
