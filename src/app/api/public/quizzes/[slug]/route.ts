import { handleGetPublicQuiz } from "@/app/api/admin/quizzes/controllers/quiz.controller";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  return handleGetPublicQuiz(req, slug);
}
