import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { scoreSubmission } from "@/lib/quiz-scoring";
import type { QuizQuestion } from "@/types/quiz";
import type { Prisma } from "@prisma/client";

// PUBLIC ROUTE — no auth. Students submit raw answers; the server re-scores
// against the stored quiz definition (never trusts client-side correctness).

const SubmitSchema = z.object({
  studentAlias: z.string().trim().max(60).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.unknown(),
      })
    )
    .min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const quiz = await db.quiz.findUnique({ where: { shareToken } });
  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (!quiz.isActive) {
    return NextResponse.json({ error: "This quiz is no longer active." }, { status: 403 });
  }
  if (quiz.expiresAt && quiz.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This quiz has expired." }, { status: 403 });
  }

  const questions = quiz.questions as unknown as QuizQuestion[];
  const result = scoreSubmission(questions, parsed.data.answers);

  const alias = parsed.data.studentAlias?.trim();

  await db.quizAttempt.create({
    data: {
      quizId:       quiz.id,
      studentAlias: alias && alias.length > 0 ? alias : null,
      score:        result.score,
      answers:      result.answers as unknown as Prisma.InputJsonValue,
    },
  });

  // Return the scored result (including correctness + explanations) so the
  // student sees their breakdown immediately.
  return NextResponse.json({ result, questions }, { status: 201 });
}
