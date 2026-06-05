"use client";

import { useState } from "react";
import type { FillInBlankQuestion } from "@/types/quiz";

interface Props {
  question: FillInBlankQuestion;
  value?: string;
  onAnswer: (answer: string) => void;
}

export function FillInBlankQ({ question, value, onAnswer }: Props) {
  const [text, setText] = useState(value ?? "");

  const parts = (question.text ?? "").split(/_{2,}/);

  function update(v: string) {
    setText(v);
    onAnswer(v);
  }

  return (
    <div className="space-y-4">
      <p
        className="font-serif text-[20px] leading-snug"
        style={{ color: "var(--fg)", fontWeight: 420 }}
      >
        {question.prompt}
      </p>

      <div
        className="rounded-[12px] p-5 text-[15px] leading-relaxed"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {parts.length > 1 ? (
          <span className="inline" style={{ color: "var(--fg)" }}>
            {parts[0]}
            <input
              value={text}
              onChange={(e) => update(e.target.value)}
              className="mx-2 inline-block w-36 px-1 py-0.5 text-center font-semibold focus:outline-none"
              style={{
                borderBottom: "2px solid var(--accent-color)",
                background: "transparent",
                color: "var(--accent-color)",
              }}
              placeholder="…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {parts.slice(1).join(" ")}
          </span>
        ) : (
          <input
            type="text"
            className="field"
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
