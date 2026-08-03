import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, createQuizSchema } from "./middlewares/validation.middleware";
import { handleGetAdminQuizzes, handleCreateQuiz } from "./controllers/quiz.controller";

export const GET = withManagerAuth(handleGetAdminQuizzes);

export const POST = withManagerAuth(async (req: Request, manager) => {
  const validator = withValidation(createQuizSchema, (request, validatedData) =>
    handleCreateQuiz(request, validatedData, manager)
  );
  return validator(req);
});
