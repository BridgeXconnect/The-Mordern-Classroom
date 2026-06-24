"use client";

import { useState } from "react";
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
    <div className="space-y-4">
      <p
        className="font-serif text-[20px] leading-snug"
        style={{ color: "var(--fg)", fontWeight: 420 }}
      >
        {question.prompt}
      </p>

      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className="flex items-center gap-3 rounded-[12px] px-4 py-3.5 text-left transition-all"
              style={{
                border: active
                  ? "1.5px solid var(--accent-color)"
                  : "1.5px solid var(--border)",
                background: active ? "var(--accent-soft)" : "var(--surface)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] font-mono text-[12px] font-bold transition-all"
                style={{
                  background: active ? "var(--accent-color)" : "var(--surface-2)",
                  color: active ? "var(--accent-fg)" : "var(--fg-subtle)",
                }}
              >
                {LETTERS[i] ?? i + 1}
              </span>
              <span className="text-[14px]" style={{ color: "var(--fg)" }}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
