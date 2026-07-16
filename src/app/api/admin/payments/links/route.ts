import { handleGetPaymentLinks } from "../controllers/stripePaymentLink.controller";
import { withManagerAuth } from "@/lib/auth/jwt";

export const GET = withManagerAuth(handleGetPaymentLinks);
