"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { MultipleChoiceQuestion } from "@/types/quiz";

interface Props {
  question: MultipleChoiceQuestion;
  value?: number;
  onAnswer: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function MultipleChoiceQ({ question, value, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | undefined>(value);

  function choose(i: number) {
    setSelected(i);
    onAnswer(i);
  }

  return (
    <div className="space-y-3">
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>
      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                active
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-accent"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span className="text-sm">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
