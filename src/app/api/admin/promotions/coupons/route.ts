import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, createCouponSchema } from "../middlewares/validation.middleware";
import { handleGetCoupons, handleCreateCoupon } from "../controllers/promotion.controller";

export const GET = withManagerAuth(handleGetCoupons);

export const POST = withManagerAuth((req: Request) => {
  const validator = withValidation(createCouponSchema, (request, validatedData) =>
    handleCreateCoupon(request, validatedData)
  );
  return validator(req);
});
