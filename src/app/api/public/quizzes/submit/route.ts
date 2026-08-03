import { withValidation, submitQuizSchema } from "@/app/api/admin/quizzes/middlewares/validation.middleware";
import { handleSubmitQuizResponse } from "@/app/api/admin/quizzes/controllers/quiz.controller";

export const POST = withValidation(submitQuizSchema, (req, validatedData) =>
  handleSubmitQuizResponse(req, validatedData)
);
