import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { QuizQuestion } from "@/types/quiz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      lesson: { select: { id: true, title: true } },
      attempts: { orderBy: { completedAt: "desc" } },
    },
  });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const questions = quiz.questions as unknown as QuizQuestion[];
  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);

  const attempts = quiz.attempts.map((a) => ({
    id:           a.id,
    studentAlias: a.studentAlias,
    completedAt:  a.completedAt,
    score:        a.score,
    percentage:   totalPoints > 0 ? Math.round((a.score / totalPoints) * 1000) / 10 : 0,
    answers:      a.answers,
  }));

  const scores = attempts.map((a) => a.percentage);
  const stats = {
    attemptCount: attempts.length,
    averageScore: scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : 0,
    highScore:    scores.length ? Math.max(...scores) : 0,
    lowScore:     scores.length ? Math.min(...scores) : 0,
  };

  return NextResponse.json({
    quiz: {
      id:         quiz.id,
      type:       quiz.type,
      cefrLevel:  quiz.cefrLevel,
      shareToken: quiz.shareToken,
      isActive:   quiz.isActive,
      lesson:     quiz.lesson,
      questionCount: questions.length,
      totalPoints,
    },
    stats,
    attempts,
  });
}
