import { withManagerAuth } from "@/lib/auth/jwt";
import { handleSendBlogNewsletter } from "../../controllers/blog.controller";
import { withValidation, sendNewsletterSchema } from "../../middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const POST = withManagerAuth(async (req: Request, _manager, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return withValidation(sendNewsletterSchema, (r, data) => handleSendBlogNewsletter(r, data, id))(req);
});
