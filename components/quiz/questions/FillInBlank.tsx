"use client";
// TODO Phase 6: Fill-in-the-blank question component
import type { FillInBlankQuestion } from "@/types/quiz";
interface Props { question: FillInBlankQuestion; onAnswer: (answer: string) => void; }
export function FillInBlankQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 6</p></div>;
}
