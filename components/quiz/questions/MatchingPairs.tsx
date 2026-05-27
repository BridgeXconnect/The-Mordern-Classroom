"use client";
// TODO Phase 6: Matching pairs question — drag or click-to-match
import type { MatchingQuestion } from "@/types/quiz";
interface Props { question: MatchingQuestion; onAnswer: (pairs: [number,number][]) => void; }
export function MatchingPairsQ({ question, onAnswer: _onAnswer }: Props) {
  return <div className="p-4 border rounded-lg"><p>{question.prompt}</p><p className="text-sm text-muted-foreground mt-2">TODO: Phase 6</p></div>;
}
