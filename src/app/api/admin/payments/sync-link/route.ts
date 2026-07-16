import { handleSyncPaymentLink } from "../controllers/stripePaymentLink.controller";
import { withValidation, syncPaymentLinkSchema } from "../middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const POST = withManagerAuth(withValidation(syncPaymentLinkSchema, handleSyncPaymentLink));
