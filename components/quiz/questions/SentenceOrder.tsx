"use client";
// TODO Phase 6: Sentence ordering — @dnd-kit drag and drop word tiles
import type { SentenceOrderQuestion } from "@/types/quiz";
interface Props { question: SentenceOrderQuestion; onAnswer: (order: number[]) => void; }
export function SentenceOrderQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 6</p></div>;
}
