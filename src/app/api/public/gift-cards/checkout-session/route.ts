import { withValidation, issueGiftCardSchema } from "@/app/api/admin/promotions/middlewares/validation.middleware";
import { handlePublicGiftCardCheckoutSession } from "@/app/api/admin/promotions/controllers/promotion.controller";

export const POST = withValidation(issueGiftCardSchema, (req, validatedData) =>
  handlePublicGiftCardCheckoutSession(req, validatedData)
);
