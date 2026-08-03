import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, issueGiftCardSchema } from "../middlewares/validation.middleware";
import { handleGetGiftCards, handleIssueGiftCard } from "../controllers/promotion.controller";

export const GET = withManagerAuth(handleGetGiftCards);

export const POST = withManagerAuth((req: Request) => {
  const validator = withValidation(issueGiftCardSchema, (request, validatedData) =>
    handleIssueGiftCard(request, validatedData)
  );
  return validator(req);
});
