import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, toggleVisibilitySchema } from "@/app/api/admin/reviews/middlewares/validation.middleware";
import { handleToggleVisibility } from "@/app/api/admin/reviews/controllers/review.controller";

export const PATCH = withManagerAuth(
	async (req: Request, context: { params: Promise<{ id: string }> }) => {
		const { id } = await context.params;
		const validator = withValidation(toggleVisibilitySchema, (request, validatedData) =>
			handleToggleVisibility(request, id, validatedData),
		);
		return validator(req);
	},
);
