import { handleVerifyOtp } from "../controllers/managerAuth.controller";
import { withValidation, verifyOtpSchema } from "../middlewares/validation.middleware";

export const POST = withValidation(verifyOtpSchema, handleVerifyOtp);
