import { withValidation, submitReviewSchema } from "@/app/api/admin/reviews/middlewares/validation.middleware";
import { handleSubmitReview } from "@/app/api/admin/reviews/controllers/review.controller";

export const POST = withValidation(submitReviewSchema, (req, validatedData) => handleSubmitReview(req, validatedData));
