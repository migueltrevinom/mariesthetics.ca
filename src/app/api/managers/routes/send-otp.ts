import { handleSendOtp } from "../controllers/managerAuth.controller";
import { withValidation, sendOtpSchema } from "../middlewares/validation.middleware";

export const POST = withValidation(sendOtpSchema, handleSendOtp);
