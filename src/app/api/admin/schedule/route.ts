import { withManagerAuth } from "@/lib/auth/jwt";
import {
  withValidation,
  updateWeeklyScheduleSchema,
  dateOverrideSchema,
} from "./middlewares/validation.middleware";
import {
  handleGetSchedule,
  handleUpdateWeeklySchedule,
  handleSaveDateOverride,
  handleDeleteDateOverride,
} from "./controllers/schedule.controller";

export const GET = withManagerAuth(handleGetSchedule);
export const PUT = withManagerAuth(withValidation(updateWeeklyScheduleSchema, handleUpdateWeeklySchedule));
export const POST = withManagerAuth(withValidation(dateOverrideSchema, handleSaveDateOverride));
export const DELETE = withManagerAuth(handleDeleteDateOverride);
