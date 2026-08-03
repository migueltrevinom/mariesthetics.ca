import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, requestReviewSchema } from "@/app/api/admin/reviews/middlewares/validation.middleware";
import { handleCreateReviewRequest } from "@/app/api/admin/reviews/controllers/review.controller";

export const POST = withManagerAuth(
	withValidation(requestReviewSchema, (req, validatedData) => handleCreateReviewRequest(req, validatedData)),
);
