"use client";
// TODO Phase 7: Listening comprehension — audio player + MCQ sub-questions
import type { ListeningQuestion } from "@/types/quiz";
interface Props { question: ListeningQuestion; onAnswer: (answers: number[]) => void; }
export function ListeningQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 7</p></div>;
}
