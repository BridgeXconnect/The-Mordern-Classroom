"use client";
// TODO Phase 6: MCQ question component
import type { MultipleChoiceQuestion } from "@/types/quiz";
interface Props { question: MultipleChoiceQuestion; onAnswer: (index: number) => void; }
export function MultipleChoiceQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 6</p></div>;
}
