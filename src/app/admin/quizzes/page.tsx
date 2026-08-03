import type { Metadata } from "next";
import { requireManager } from "@/lib/auth/jwt";
import { fetchAdminQuizzes } from "@/app/api/admin/quizzes/modules/quiz.module";
import { getActiveServices } from "@/app/api/services/modules/service.module";
import { QuizzesManager } from "@/components/admin/QuizzesManager";

export const metadata: Metadata = {
  title: "Diagnostic Quizzes | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminQuizzesPage() {
  await requireManager();

  const rawQuizzes = await fetchAdminQuizzes();
  const rawServices = await getActiveServices();

  const formattedServices = rawServices.map((s: any) => ({
    _id: String(s._id),
    name: s.name,
  }));

  const formattedQuizzes = rawQuizzes.map((q: any) => ({
    _id: String(q._id),
    title: q.title,
    slug: q.slug,
    description: q.description,
    active: Boolean(q.active),
    questions: (q.questions || []).map((question: any) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      subtitle: question.subtitle,
      order: question.order,
      options: (question.options || []).map((opt: any) => ({
        optionId: opt.optionId,
        optionText: opt.optionText,
        icon: opt.icon,
        recommendedServiceId: opt.recommendedServiceId?._id
          ? String(opt.recommendedServiceId._id)
          : opt.recommendedServiceId
            ? String(opt.recommendedServiceId)
            : null,
        scoreWeight: opt.scoreWeight,
      })),
    })),
  }));

  return <QuizzesManager initialQuizzes={formattedQuizzes} services={formattedServices} />;
}
