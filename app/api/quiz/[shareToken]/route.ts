import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizeQuestionsForStudent } from "@/lib/quiz-scoring";
import type { QuizQuestion } from "@/types/quiz";

// PUBLIC ROUTE — no auth. Students open a quiz via its UUID share link.
// Answers are stripped before the questions leave the server.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const quiz = await db.quiz.findUnique({
    where: { shareToken },
    include: { lesson: { select: { title: true } } },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  }
  if (!quiz.isActive) {
    return NextResponse.json({ error: "This quiz is no longer active." }, { status: 403 });
  }
  if (quiz.expiresAt && quiz.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This quiz has expired." }, { status: 403 });
  }

  const questions = quiz.questions as unknown as QuizQuestion[];

  return NextResponse.json({
    id:          quiz.id,
    shareToken:  quiz.shareToken,
    type:        quiz.type,
    cefrLevel:   quiz.cefrLevel,
    lessonTitle: quiz.lesson.title,
    questions:   sanitizeQuestionsForStudent(questions),
  });
}
