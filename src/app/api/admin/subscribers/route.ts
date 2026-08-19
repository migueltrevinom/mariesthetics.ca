import { withManagerAuth } from "@/lib/auth/jwt";
import { handleGetSubscribers, handleCreateSubscriber } from "../blogs/controllers/subscriber.controller";
import { withValidation, createSubscriberSchema } from "../blogs/middlewares/validation.middleware";

export const dynamic = "force-dynamic";

export const GET = withManagerAuth(handleGetSubscribers);

export const POST = withManagerAuth(
  withValidation(createSubscriberSchema, handleCreateSubscriber)
);
