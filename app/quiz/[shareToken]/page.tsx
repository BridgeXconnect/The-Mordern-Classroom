// PUBLIC PAGE — no auth required.
// Students open a quiz via its UUID share link: /quiz/[shareToken]

import { db } from "@/lib/db";
import { sanitizeQuestionsForStudent } from "@/lib/quiz-scoring";
import type { QuizQuestion } from "@/types/quiz";
import { StudentQuizClient } from "./StudentQuizClient";
import { QuizUnavailable } from "./QuizUnavailable";

export default async function StudentQuizPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const quiz = await db.quiz.findUnique({
    where: { shareToken },
    include: { lesson: { select: { title: true } } },
  });

  if (!quiz) {
    return <QuizUnavailable title="Quiz not found" message="This link doesn't point to a quiz. Double-check it with your teacher." />;
  }
  if (!quiz.isActive) {
    return <QuizUnavailable title="Quiz closed" message="Your teacher has closed this quiz." />;
  }
  if (quiz.expiresAt && quiz.expiresAt.getTime() < Date.now()) {
    return <QuizUnavailable title="Quiz expired" message="The deadline for this quiz has passed." />;
  }

  const questions = sanitizeQuestionsForStudent(
    quiz.questions as unknown as QuizQuestion[]
  ) as unknown as QuizQuestion[];

  return (
    <main className="min-h-screen bg-background">
      <StudentQuizClient
        shareToken={quiz.shareToken}
        type={quiz.type}
        cefrLevel={quiz.cefrLevel}
        lessonTitle={quiz.lesson.title}
        questions={questions}
      />
    </main>
  );
}
