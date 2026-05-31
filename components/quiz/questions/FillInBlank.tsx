"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { FillInBlankQuestion } from "@/types/quiz";

interface Props {
  question: FillInBlankQuestion;
  value?: string;
  onAnswer: (answer: string) => void;
}

export function FillInBlankQ({ question, value, onAnswer }: Props) {
  const [text, setText] = useState(value ?? "");

  // Render the sentence, replacing the ___ gap with the live input value.
  const parts = (question.text ?? "").split(/_{2,}/);

  function update(v: string) {
    setText(v);
    onAnswer(v);
  }

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>

      <div className="rounded-xl border bg-muted/30 p-5 text-base leading-relaxed">
        {parts.length > 1 ? (
          <span className="inline">
            {parts[0]}
            <input
              value={text}
              onChange={(e) => update(e.target.value)}
              className="mx-1 inline-block w-40 border-b-2 border-primary bg-transparent px-1 py-0.5 text-center font-semibold text-primary focus:outline-none"
              placeholder="…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {parts.slice(1).join(" ")}
          </span>
        ) : (
          <Input
            value={text}
            onChange={(e) => update(e.target.value)}
            placeholder="Type your answer…"
            autoComplete="off"
          />
        )}
      </div>
    </div>
  );
}
