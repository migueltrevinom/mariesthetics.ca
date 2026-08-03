import { NextResponse } from "next/server";
import {
  fetchAdminQuizzes,
  createAdminQuiz,
  updateAdminQuiz,
  deleteAdminQuiz,
  fetchPublicQuizBySlug,
  submitPublicQuiz,
} from "../modules/quiz.module";
import type { SessionPayload } from "@/lib/auth/jwt";

export async function handleGetAdminQuizzes(): Promise<NextResponse> {
  try {
    const quizzes = await fetchAdminQuizzes();
    return NextResponse.json({ success: true, quizzes });
  } catch (err: any) {
    console.error("[Quiz Controller Get Admin Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}

export async function handleCreateQuiz(
  req: Request,
  validatedData: any,
  manager: SessionPayload,
): Promise<NextResponse> {
  try {
    const quiz = await createAdminQuiz(validatedData, manager.sub);
    return NextResponse.json({ success: true, quiz }, { status: 201 });
  } catch (err: any) {
    console.error("[Quiz Controller Create Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create quiz" }, { status: 500 });
  }
}

export async function handleUpdateQuiz(
  req: Request,
  id: string,
  validatedData: any,
): Promise<NextResponse> {
  try {
    const quiz = await updateAdminQuiz(id, validatedData);
    return NextResponse.json({ success: true, quiz });
  } catch (err: any) {
    console.error("[Quiz Controller Update Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to update quiz" }, { status: 500 });
  }
}

export async function handleDeleteQuiz(req: Request, id: string): Promise<NextResponse> {
  try {
    const quiz = await deleteAdminQuiz(id);
    return NextResponse.json({ success: true, message: "Quiz deleted successfully", quiz });
  } catch (err: any) {
    console.error("[Quiz Controller Delete Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to delete quiz" }, { status: 500 });
  }
}

export async function handleGetPublicQuiz(req: Request, slug: string): Promise<NextResponse> {
  try {
    const quiz = await fetchPublicQuizBySlug(slug);
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, quiz });
  } catch (err: any) {
    console.error("[Quiz Controller Get Public Error]:", err.message);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

export async function handleSubmitQuizResponse(
  req: Request,
  validatedData: {
    quizId: string;
    clientId?: string;
    guest?: { name?: string; email?: string; phone?: string };
    answers: { questionId: string; optionId: string; selectedText?: string }[];
    recommendedServiceId: string;
  },
): Promise<NextResponse> {
  try {
    const submission = await submitPublicQuiz(validatedData);
    return NextResponse.json({
      success: true,
      message: "Quiz submission recorded!",
      submission,
    });
  } catch (err: any) {
    console.error("[Quiz Controller Submit Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to submit quiz response" }, { status: 500 });
  }
}
