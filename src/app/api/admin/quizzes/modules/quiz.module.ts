import { QuizRepository } from "../repositories/quiz.repository";
import { Service } from "@/lib/db/models/Service";

export async function createAdminQuiz(data: any, managerSub?: string) {
  return await QuizRepository.createQuiz(data, managerSub);
}

export async function updateAdminQuiz(id: string, data: any) {
  return await QuizRepository.updateQuiz(id, data);
}

export async function deleteAdminQuiz(id: string) {
  return await QuizRepository.deleteQuiz(id);
}

export async function fetchAdminQuizzes() {
  return await QuizRepository.getAllQuizzes();
}

export async function fetchPublicQuizBySlug(slug: string) {
  let quiz = await QuizRepository.getQuizBySlug(slug);
  if (!quiz && slug === "skin-treatment-finder") {
    // Seed default skin treatment finder quiz if none exists!
    const defaultServices = await Service.find().limit(3).lean();
    const defaultServiceId = defaultServices[0]?._id;

    quiz = await QuizRepository.createQuiz({
      title: "Find Your Ideal Treatment",
      slug: "skin-treatment-finder",
      description: "Answer 3 quick questions to discover your tailored esthetics treatment.",
      active: true,
      questions: [
        {
          questionId: "q1",
          questionText: "What is your primary skincare goal?",
          subtitle: "Select the result you want to achieve today.",
          order: 1,
          options: [
            { optionId: "o1", optionText: "Deep Hydration & Radiant Glow", icon: "✨", recommendedServiceId: defaultServices[0]?._id || defaultServiceId },
            { optionId: "o2", optionText: "Lifting & Lash Definition", icon: "👁️", recommendedServiceId: defaultServices[1]?._id || defaultServiceId },
            { optionId: "o3", optionText: "Clean & Sculpted Brows", icon: "✍️", recommendedServiceId: defaultServices[2]?._id || defaultServiceId },
          ],
        },
        {
          questionId: "q2",
          questionText: "How would you describe your skin type?",
          subtitle: "This helps us tailor treatment products.",
          order: 2,
          options: [
            { optionId: "o4", optionText: "Dry or Sensitive", icon: "🌸" },
            { optionId: "o5", optionText: "Combination or Normal", icon: "🍃" },
            { optionId: "o6", optionText: "Oily or Acne-Prone", icon: "💧" },
          ],
        },
        {
          questionId: "q3",
          questionText: "What is your preferred appointment duration?",
          subtitle: "Choose how much time you'd like to dedicate to your self-care session.",
          order: 3,
          options: [
            { optionId: "o7", optionText: "Quick & Effective (30-45 Mins)", icon: "⚡" },
            { optionId: "o8", optionText: "Full Deluxe Experience (60+ Mins)", icon: "💆" },
          ],
        },
      ],
    });
  }
  return quiz;
}

export async function submitPublicQuiz(data: {
  quizId: string;
  clientId?: string;
  guest?: { name?: string; email?: string; phone?: string };
  answers: { questionId: string; optionId: string; selectedText?: string }[];
  recommendedServiceId: string;
}) {
  return await QuizRepository.saveSubmission(data);
}

export async function fetchClientQuizSubmissions(clientId: string) {
  return await QuizRepository.getSubmissionsByClient(clientId);
}
