import { withManagerAuth } from "@/lib/auth/jwt";
import {
  withValidation,
  blackoutBlockSchema,
} from "../middlewares/validation.middleware";
import { handleCreateBlackoutBlock } from "../controllers/schedule.controller";

export const POST = withManagerAuth(withValidation(blackoutBlockSchema, handleCreateBlackoutBlock));
