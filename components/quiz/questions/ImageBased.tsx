"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import type { ImageBasedQuestion } from "@/types/quiz";

interface Props {
  question: ImageBasedQuestion;
  value?: number;
  onAnswer: (index: number) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ImageBasedQ({ question, value, onAnswer }: Props) {
  const [selected, setSelected] = useState<number | undefined>(value);

  function choose(i: number) {
    setSelected(i);
    onAnswer(i);
  }

  return (
    <div className="space-y-4">
      <p className="font-serif text-[20px] leading-snug" style={{ color: "var(--fg)", fontWeight: 420 }}>
        {question.prompt}
      </p>

      {/* Image */}
      <div
        className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-[12px]"
        style={{ border: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        {question.imageUrl ? (
          <Image src={question.imageUrl} alt="Question image" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: "var(--fg-faint)" }}>
            <ImageOff className="h-8 w-8" />
            <span className="font-mono text-[11px]">Image unavailable</span>
          </div>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {question.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => choose(i)}
              className="flex items-center gap-3 rounded-[12px] px-4 py-3 text-left transition-all"
              style={{
                border: active ? "1.5px solid var(--accent-color)" : "1.5px solid var(--border)",
                background: active ? "var(--accent-soft)" : "var(--surface)",
                boxShadow: active ? "var(--shadow-sm)" : "none",
              }}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] font-mono text-[12px] font-bold"
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
