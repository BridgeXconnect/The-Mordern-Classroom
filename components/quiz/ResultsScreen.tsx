"use client";
// TODO Phase 6: Results screen — score, breakdown, celebration animation
import type { QuizResult } from "@/types/quiz";
interface Props { result: QuizResult; onRetry?: () => void; }
export function ResultsScreen({ result, onRetry: _onRetry }: Props) {
  return (
    <div className="text-center p-8">
      <p className="text-4xl font-bold">{Math.round(result.percentage)}%</p>
      <p className="text-muted-foreground mt-2">{result.correctCount} / {result.totalQuestions} correct</p>
      <p className="text-sm mt-4 text-muted-foreground">TODO: Phase 6 — full results UI</p>
    </div>
  );
}
