import { connectDb } from "@/lib/db/connect";
import { Quiz, QuizSubmission, Service, Client } from "@/lib/db/models";

export class QuizRepository {
  /**
   * Create a new quiz in database.
   */
  static async createQuiz(data: any, managerSub?: string): Promise<any> {
    await connectDb();
    const quiz = await Quiz.create({
      ...data,
      createdById: managerSub || null,
    });
    return quiz;
  }

  /**
   * Update quiz configuration.
   */
  static async updateQuiz(id: string, data: any): Promise<any> {
    await connectDb();
    const quiz = await Quiz.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }

  /**
   * Delete quiz by ID.
   */
  static async deleteQuiz(id: string): Promise<any> {
    await connectDb();
    const quiz = await Quiz.findByIdAndDelete(id);
    if (!quiz) throw new Error("Quiz not found");
    return quiz;
  }

  /**
   * Fetch all quizzes for manager portal.
   */
  static async getAllQuizzes(): Promise<any[]> {
    await connectDb();
    const quizzes = await Quiz.find()
      .sort({ createdAt: -1 })
      .populate("questions.options.recommendedServiceId")
      .lean();
    return quizzes;
  }

  /**
   * Get active quiz by unique slug for public landing page.
   */
  static async getQuizBySlug(slug: string): Promise<any> {
    await connectDb();
    const quiz = await Quiz.findOne({ slug, active: true })
      .populate("questions.options.recommendedServiceId")
      .lean();
    return quiz;
  }

  /**
   * Save client/guest quiz response submission.
   */
  static async saveSubmission(data: {
    quizId: string;
    clientId?: string;
    guest?: { name?: string; email?: string; phone?: string };
    answers: { questionId: string; optionId: string; selectedText?: string }[];
    recommendedServiceId: string;
  }): Promise<any> {
    await connectDb();

    // Auto-resolve client ID if guest email matches existing client
    let clientId = data.clientId || null;
    if (!clientId && data.guest?.email) {
      const client = await Client.findOne({ email: data.guest.email.toLowerCase().trim() });
      if (client) clientId = client._id;
    }

    const submission = await QuizSubmission.create({
      quizId: data.quizId,
      clientId,
      guest: data.guest || {},
      answers: data.answers,
      recommendedServiceId: data.recommendedServiceId,
      submittedAt: new Date(),
    });

    return submission;
  }

  /**
   * Get all quiz submissions for a specific client.
   */
  static async getSubmissionsByClient(clientId: string): Promise<any[]> {
    await connectDb();
    const submissions = await QuizSubmission.find({ clientId })
      .sort({ createdAt: -1 })
      .populate("quizId")
      .populate("recommendedServiceId")
      .lean();
    return submissions;
  }

  /**
   * Get quiz analytics (total completions, conversions).
   */
  static async getQuizAnalytics(quizId: string): Promise<any> {
    await connectDb();
    const totalSubmissions = await QuizSubmission.countDocuments({ quizId });
    const convertedSubmissions = await QuizSubmission.countDocuments({ quizId, convertedToBooking: true });
    
    return {
      quizId,
      totalSubmissions,
      convertedSubmissions,
      conversionRate: totalSubmissions > 0 ? ((convertedSubmissions / totalSubmissions) * 100).toFixed(1) : "0.0",
    };
  }
}
