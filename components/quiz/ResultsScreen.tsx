"use client";

import { useMemo } from "react";
import { Check, X, RotateCcw, Trophy, ThumbsUp, PartyPopper } from "lucide-react";
import type { QuizType } from "@prisma/client";
import type { QuizQuestion, QuizResult, QuizAttemptAnswer } from "@/types/quiz";

interface Props {
  result: QuizResult;
  questions: QuizQuestion[];
  quizType?: QuizType;
  onRetry?: () => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ResultsScreen({ result, questions, onRetry }: Props) {
  const pct = Math.round(result.percentage);
  const { Icon, headline, tone } = useMemo(() => verdict(pct), [pct]);

  const answerById = useMemo(
    () => new Map(result.answers.map((a) => [a.questionId, a])),
    [result.answers]
  );

  const toneColors = {
    great: { bg: "var(--green-bg)",  fg: "var(--green)" },
    good:  { bg: "var(--amber-bg)", fg: "var(--amber)" },
    low:   { bg: "var(--red-bg)",   fg: "var(--red)" },
  };
  const { bg: iconBg, fg: iconFg } = toneColors[tone];

  return (
    <div className="mx-auto w-full max-w-xl space-y-4 p-4 sm:p-6">
      {/* Score hero */}
      <div
        className="flex flex-col items-center gap-3 rounded-[18px] p-8 text-center animate-pop-in"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
      >
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: iconBg }}
        >
          <Icon className="h-7 w-7" style={{ color: iconFg }} />
        </div>

        <p
          className="font-serif tabular-nums"
          style={{ fontSize: 52, color: iconFg, fontWeight: 400, lineHeight: 1 }}
        >
          {pct}%
        </p>

        <p className="text-[16px] font-medium" style={{ color: "var(--fg)" }}>{headline}</p>

        <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          {result.correctCount} of {result.totalQuestions} correct · {result.score} / {result.totalPoints} pts
        </p>

        <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
          Result sent to your teacher ✓
        </p>
      </div>

      {/* Per-question review */}
      <div className="space-y-2">
        <p className="section-label px-1">Review</p>
        {questions.map((q, i) => (
          <Breakdown key={q.id} index={i} question={q} graded={answerById.get(q.id)} />
        ))}
      </div>

      {onRetry && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-ghost flex items-center gap-1.5"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}

function verdict(pct: number) {
  if (pct >= 80) return { Icon: Trophy,      headline: "Excellent work!",                 tone: "great" as const };
  if (pct >= 50) return { Icon: ThumbsUp,    headline: "Good effort — keep going!",        tone: "good"  as const };
  return           { Icon: PartyPopper, headline: "Nice try — practice makes perfect!", tone: "low"   as const };
}

function Breakdown({
  index, question, graded,
}: {
  index: number;
  question: QuizQuestion;
  graded?: QuizAttemptAnswer;
}) {
  const correct = graded?.isCorrect ?? false;

  return (
    <div
      className="rounded-[12px] p-4 animate-fade-up"
      style={{
        background: correct ? "var(--green-bg)" : "var(--red-bg)",
        border: `1px solid ${correct ? "var(--green-bg)" : "var(--red-bg)"}`,
        animationDelay: `${index * 0.04}s`,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: correct ? "var(--green)" : "var(--red)" }}
        >
          {correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>
            {index + 1}. {question.prompt}
          </p>

          {!correct && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
              <span className="font-medium" style={{ color: "var(--fg)" }}>Your answer: </span>
              {formatStudentAnswer(question, graded?.answer)}
            </p>
          )}

          <p className="text-[12.5px]" style={{ color: "var(--green)" }}>
            <span className="font-medium">Correct: </span>
            {formatCorrectAnswer(question)}
          </p>

          {question.explanation && (
            <p
              className="rounded-[8px] px-3 py-2 text-[12px]"
              style={{ background: "var(--surface)", color: "var(--fg-muted)" }}
            >
              {question.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCorrectAnswer(q: QuizQuestion): string {
  switch (q.type) {
    case "multiple-choice":
    case "image-based":
      return optionLabel(q.options, q.correctIndex);
    case "fill-in-blank":
      return q.answer;
    case "sentence-order":
      return q.correctOrder.map((wi) => q.words[wi]).join(" ");
    case "matching":
      return q.correctPairs.map(([l, r]) => `${q.leftItems[l]} → ${q.rightItems[r]}`).join(", ");
    case "listening":
      return (q.subQuestions ?? [])
        .map((s, i) => `${i + 1}. ${optionLabel(s.options, s.correctIndex)}`)
        .join("  ·  ");
    default:
      return "—";
  }
}

function formatStudentAnswer(q: QuizQuestion, answer: unknown): string {
  if (answer === null || answer === undefined) return "No answer";
  switch (q.type) {
    case "multiple-choice":
    case "image-based":
      return optionLabel(q.options, Number(answer));
    case "fill-in-blank":
      return String(answer) || "No answer";
    case "sentence-order":
      return Array.isArray(answer) ? answer.map((wi) => q.words[Number(wi)]).join(" ") : "No answer";
    case "matching":
      return Array.isArray(answer) && answer.length > 0
        ? answer.map((p) => { const [l, r] = p as [number, number]; return `${q.leftItems[l]} → ${q.rightItems[r]}`; }).join(", ")
        : "No answer";
    case "listening":
      return Array.isArray(answer)
        ? (q.subQuestions ?? []).map((s, i) => `${i + 1}. ${optionLabel(s.options, Number(answer[i]))}`).join("  ·  ")
        : "No answer";
    default:
      return "—";
  }
}

function optionLabel(options: string[], index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= options.length) return "No answer";
  return `${LETTERS[index] ?? String(index + 1)}. ${options[index]}`;
}
