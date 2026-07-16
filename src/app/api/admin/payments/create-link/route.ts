import { handleCreatePaymentLink } from "../controllers/stripePaymentLink.controller";
import { withValidation, createPaymentLinkSchema } from "../middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const POST = withManagerAuth(withValidation(createPaymentLinkSchema, handleCreatePaymentLink));
