import { handleToggleShowcase } from "../controllers/reel.controller";
import { toggleShowcaseSchema, withValidation } from "../middlewares/validation.middleware";
import { withManagerAuth } from "@/lib/auth/jwt";

export const POST = withManagerAuth(
  withValidation(toggleShowcaseSchema, async (req: Request, data: any) => {
    return handleToggleShowcase(req, data);
  })
);
