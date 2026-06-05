"use client";

import { useState } from "react";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { CefrLevel, QuizType } from "@prisma/client";
import type { QuizQuestion } from "@/types/quiz";
import { QuizShell } from "@/components/quiz/QuizShell";

interface Props {
  shareToken: string;
  type: QuizType;
  cefrLevel: CefrLevel;
  lessonTitle: string;
  questions: QuizQuestion[];
}

export function StudentQuizClient({ shareToken, type, cefrLevel, lessonTitle, questions }: Props) {
  const [started, setStarted] = useState(false);
  const [alias, setAlias] = useState("");

  if (started) {
    return (
      <QuizShell
        shareToken={shareToken}
        type={type}
        cefrLevel={cefrLevel}
        lessonTitle={lessonTitle}
        questions={questions}
        studentAlias={alias.trim()}
      />
    );
  }

  /* ── Intro screen ── */
  const questionCount = questions.length;
  const estimatedMins = Math.ceil(questionCount * 1.5);

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-[380px] rounded-[18px] p-8 text-center animate-pop-in"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Icon tile */}
        <div
          className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-[12px]"
          style={{ background: "var(--accent-color)" }}
        >
          <GraduationCap className="h-5 w-5" style={{ color: "var(--accent-fg)" }} />
        </div>

        {/* Eyebrow */}
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--fg-subtle)" }}>
          {cefrLevel} · {type === "PRE" ? "Pre-lesson" : "Post-lesson"}
        </p>

        {/* Title */}
        <h1
          className="font-serif text-[22px] mb-1 leading-snug"
          style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.01em" }}
        >
          {lessonTitle}
        </h1>

        <p className="text-[13px] mb-6" style={{ color: "var(--fg-muted)" }}>
          No account needed · {questionCount} questions · ~{estimatedMins} min
        </p>

        {/* Name input */}
        <form
          onSubmit={(e) => { e.preventDefault(); setStarted(true); }}
          className="space-y-4 text-left"
        >
          <div>
            <label
              htmlFor="alias"
              className="block font-mono text-[10.5px] uppercase tracking-[0.1em] mb-1.5"
              style={{ color: "var(--fg-subtle)" }}
            >
              Your name <span style={{ color: "var(--fg-faint)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
            </label>
            <input
              id="alias"
              type="text"
              className="field"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. Maria"
              maxLength={60}
              autoComplete="off"
            />
            <p className="text-[11.5px] mt-1" style={{ color: "var(--fg-faint)" }}>
              Your teacher will see this next to your score.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full justify-center gap-1.5"
            style={{ width: "100%", justifyContent: "center" }}
          >
            Start quiz <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
