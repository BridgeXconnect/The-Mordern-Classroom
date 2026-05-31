"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
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
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>

      <div className="relative mx-auto aspect-video w-full max-w-md overflow-hidden rounded-xl border bg-muted">
        {question.imageUrl ? (
          <Image
            src={question.imageUrl}
            alt="Question image"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="h-8 w-8" />
            <span className="text-xs">Image unavailable</span>
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
