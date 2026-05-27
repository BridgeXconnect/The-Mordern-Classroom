"use client";

// TODO Phase 6: Duolingo-style quiz shell
// Manages question flow, progress bar, score tracking, result screen
import type { QuizData, QuizSubmission } from "@/types/quiz";

interface QuizShellProps {
  quiz: QuizData;
  onComplete: (submission: QuizSubmission) => void;
}

export function QuizShell({ quiz, onComplete: _onComplete }: QuizShellProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
        <p className="font-medium">Quiz: {quiz.type} — {quiz.cefrLevel}</p>
        <p className="text-sm mt-1">{quiz.questions.length} questions</p>
        <p className="text-sm mt-1">TODO: Phase 6 — Duolingo-style quiz UI</p>
      </div>
    </div>
  );
}
