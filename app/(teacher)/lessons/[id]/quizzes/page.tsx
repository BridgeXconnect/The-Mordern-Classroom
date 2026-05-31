import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import type { LessonObjective } from "@/types/lesson";
import type { QuizQuestion } from "@/types/quiz";
import { LessonQuizzesClient } from "./LessonQuizzesClient";

export default async function LessonQuizzesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      unit: { include: { class: true } },
      quizzes: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { attempts: true } } },
      },
    },
  });

  if (!lesson) notFound();

  const objectives = lesson.objectives as unknown as LessonObjective[];

  return (
    <LessonQuizzesClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
        cefrLevel: lesson.unit.class.cefrLevel,
        unitTitle: lesson.unit.title,
        className: lesson.unit.class.name,
        classId: lesson.unit.classId,
        objectives: objectives.map((o) => `${o.skill}: ${o.description}`),
      }}
      initialQuizzes={lesson.quizzes.map((q) => ({
        id: q.id,
        type: q.type,
        cefrLevel: q.cefrLevel,
        shareToken: q.shareToken,
        isActive: q.isActive,
        expiresAt: q.expiresAt ? q.expiresAt.toISOString() : null,
        createdAt: q.createdAt.toISOString(),
        questionCount: (q.questions as unknown as QuizQuestion[]).length,
        attemptCount: q._count.attempts,
      }))}
    />
  );
}
