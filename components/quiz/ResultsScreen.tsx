"use client";

import { useMemo } from "react";
import { Check, X, RotateCcw, Trophy, PartyPopper, ThumbsUp } from "lucide-react";
import type { QuizType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion, QuizResult, QuizAttemptAnswer } from "@/types/quiz";

interface Props {
  result: QuizResult;
  /** Full graded questions (with correct answers) returned by the server. */
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

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Score hero */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full",
            tone === "great" && "bg-emerald-100 text-emerald-600",
            tone === "good" && "bg-amber-100 text-amber-600",
            tone === "low" && "bg-rose-100 text-rose-600"
          )}
        >
          <Icon className="h-8 w-8" />
        </div>
        <p className="text-5xl font-bold tabular-nums">{pct}%</p>
        <p className="text-lg font-medium">{headline}</p>
        <p className="text-sm text-muted-foreground">
          {result.correctCount} of {result.totalQuestions} correct · {result.score} / {result.totalPoints} points
        </p>
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Review</h3>
        {questions.map((q, i) => (
          <Breakdown key={q.id} index={i} question={q} graded={answerById.get(q.id)} />
        ))}
      </div>

      {onRetry && (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={onRetry} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function verdict(pct: number) {
  if (pct >= 80) return { Icon: Trophy, headline: "Excellent work!", tone: "great" as const };
  if (pct >= 50) return { Icon: ThumbsUp, headline: "Good effort — keep going!", tone: "good" as const };
  return { Icon: PartyPopper, headline: "Nice try — practice makes perfect!", tone: "low" as const };
}

function Breakdown({
  index,
  question,
  graded,
}: {
  index: number;
  question: QuizQuestion;
  graded?: QuizAttemptAnswer;
}) {
  const correct = graded?.isCorrect ?? false;

  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4",
        correct ? "border-emerald-200 bg-emerald-50/40" : "border-rose-200 bg-rose-50/40"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
            correct ? "bg-emerald-500" : "bg-rose-500"
          )}
        >
          {correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium">
            {index + 1}. {question.prompt}
          </p>

          {!correct && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Your answer: </span>
              {formatStudentAnswer(question, graded?.answer)}
            </p>
          )}

          <p className="text-sm text-emerald-700">
            <span className="font-medium">Correct: </span>
            {formatCorrectAnswer(question)}
          </p>

          {question.explanation && (
            <p className="rounded-lg bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              {question.explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Human-readable rendering of the correct answer per question type. */
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
      return q.correctPairs
        .map(([l, r]) => `${q.leftItems[l]} → ${q.rightItems[r]}`)
        .join(", ");
    case "listening":
      return (q.subQuestions ?? [])
        .map((s, i) => `${i + 1}. ${optionLabel(s.options, s.correctIndex)}`)
        .join("  ·  ");
    default:
      return "—";
  }
}

/** Human-readable rendering of the student's submitted answer. */
function formatStudentAnswer(q: QuizQuestion, answer: unknown): string {
  if (answer === null || answer === undefined) return "No answer";

  switch (q.type) {
    case "multiple-choice":
    case "image-based":
      return optionLabel(q.options, Number(answer));
    case "fill-in-blank":
      return String(answer) || "No answer";
    case "sentence-order":
      return Array.isArray(answer)
        ? answer.map((wi) => q.words[Number(wi)]).join(" ")
        : "No answer";
    case "matching":
      return Array.isArray(answer) && answer.length > 0
        ? answer
            .map((p) => {
              const [l, r] = p as [number, number];
              return `${q.leftItems[l]} → ${q.rightItems[r]}`;
            })
            .join(", ")
        : "No answer";
    case "listening":
      return Array.isArray(answer)
        ? (q.subQuestions ?? [])
            .map((s, i) => `${i + 1}. ${optionLabel(s.options, Number(answer[i]))}`)
            .join("  ·  ")
        : "No answer";
    default:
      return "—";
  }
}

function optionLabel(options: string[], index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= options.length) return "No answer";
  const letter = LETTERS[index] ?? String(index + 1);
  return `${letter}. ${options[index]}`;
}
