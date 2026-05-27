"use client";
// TODO Phase 6: Image-based question — show image + MCQ
import type { ImageBasedQuestion } from "@/types/quiz";
interface Props { question: ImageBasedQuestion; onAnswer: (index: number) => void; }
export function ImageBasedQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 6</p></div>;
}
