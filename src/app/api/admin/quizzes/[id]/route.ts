import { withManagerAuth } from "@/lib/auth/jwt";
import { withValidation, createQuizSchema } from "../middlewares/validation.middleware";
import { handleUpdateQuiz, handleDeleteQuiz } from "../controllers/quiz.controller";

export const PUT = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const validator = withValidation(createQuizSchema.partial(), (request, validatedData) =>
      handleUpdateQuiz(request, id, validatedData)
    );
    return validator(req);
  }
);

export const DELETE = withManagerAuth(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    return handleDeleteQuiz(req, id);
  }
);
