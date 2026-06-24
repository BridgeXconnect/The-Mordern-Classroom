"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import type { CefrLevel, QuizType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion, QuizResult } from "@/types/quiz";

import { MultipleChoiceQ } from "./questions/MultipleChoice";
import { FillInBlankQ } from "./questions/FillInBlank";
import { MatchingPairsQ } from "./questions/MatchingPairs";
import { SentenceOrderQ } from "./questions/SentenceOrder";
import { ImageBasedQ } from "./questions/ImageBased";
import { ListeningQ } from "./questions/ListeningQ";
import { ResultsScreen } from "./ResultsScreen";

interface QuizShellProps {
  shareToken: string;
  type: QuizType;
  cefrLevel: CefrLevel;
  lessonTitle: string;
  /** Sanitized questions (no correct-answer signals) for display. */
  questions: QuizQuestion[];
  studentAlias?: string;
}

interface SubmitResponse {
  result: QuizResult;
  questions: QuizQuestion[];
}

type Phase = "quiz" | "submitting" | "done";

export function QuizShell({
  shareToken,
  type,
  cefrLevel,
  lessonTitle,
  questions,
  studentAlias,
}: QuizShellProps) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [error, setError] = useState<string | null>(null);
  const [graded, setGraded] = useState<SubmitResponse | null>(null);

  const total = questions.length;
  const current = questions[index];
  const isLast = index === total - 1;
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id] !== undefined).length,
    [questions, answers]
  );
  const currentAnswered = current ? answers[current.id] !== undefined : false;
  const progress = total > 0 ? (answeredCount / total) * 100 : 0;

  function record(questionId: string, answer: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  async function submit() {
    setPhase("submitting");
    setError(null);
    try {
      const res = await fetch(`/api/quiz/${shareToken}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentAlias: studentAlias || undefined,
          answers: questions.map((q) => ({
            questionId: q.id,
            answer: answers[q.id] ?? null,
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not submit your answers.");
      }
      const data = (await res.json()) as SubmitResponse;
      setGraded(data);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("quiz");
    }
  }

  function retry() {
    setAnswers({});
    setIndex(0);
    setGraded(null);
    setError(null);
    setPhase("quiz");
  }

  if (phase === "done" && graded) {
    return (
      <ResultsScreen
        result={graded.result}
        questions={graded.questions}
        quizType={type}
        onRetry={retry}
      />
    );
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-5 p-4 sm:p-6"
      style={{ background: "var(--bg)" }}
    >
      {/* Top bar: close + segmented progress + count */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          className="btn-icon shrink-0"
          style={{ color: "var(--fg-subtle)" }}
          onClick={() => window.history.back()}
          aria-label="Close quiz"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Segmented progress */}
        <div className="flex flex-1 items-center gap-1">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                height: 4,
                background: i < index
                  ? "var(--green)"
                  : i === index
                  ? "var(--accent-color)"
                  : "var(--border)",
              }}
            />
          ))}
        </div>

        <span
          className="font-mono text-[11.5px] shrink-0"
          style={{ color: "var(--fg-subtle)" }}
        >
          {index + 1}/{total}
        </span>
      </div>

      {/* Current question */}
      <div className="flex-1">
        {current && <QuestionRouter question={current} answer={answers[current.id]} onAnswer={record} />}
      </div>

      {error && (
        <div
          className="rounded-[10px] px-4 py-3 text-[13px]"
          style={{ background: "var(--red-bg)", color: "var(--red)" }}
        >
          {error}
        </div>
      )}

      {/* Navigation footer */}
      <div
        className="flex items-center justify-between gap-3 pb-6 pt-3"
        style={{ borderTop: "1px solid var(--border-soft)" }}
      >
        <button
          type="button"
          className="btn btn-ghost flex items-center gap-1"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || phase === "submitting"}
          style={{ opacity: index === 0 ? 0.35 : 1 }}
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        {isLast ? (
          <button
            type="button"
            className="btn btn-primary flex items-center gap-1.5"
            onClick={submit}
            disabled={phase === "submitting" || answeredCount === 0}
            style={{ opacity: answeredCount === 0 ? 0.5 : 1 }}
          >
            {phase === "submitting" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting</>
            ) : (
              <><Send className="h-4 w-4" /> Finish</>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary flex items-center gap-1"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={!currentAnswered}
            style={{ opacity: !currentAnswered ? 0.5 : 1 }}
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Dispatch a question to its specialized input component by type. */
function QuestionRouter({
  question,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: unknown;
  onAnswer: (questionId: string, answer: unknown) => void;
}) {
  switch (question.type) {
    case "multiple-choice":
      return (
        <MultipleChoiceQ
          question={question}
          value={answer as number | undefined}
          onAnswer={(i) => onAnswer(question.id, i)}
        />
      );
    case "image-based":
      return (
        <ImageBasedQ
          question={question}
          value={answer as number | undefined}
          onAnswer={(i) => onAnswer(question.id, i)}
        />
      );
    case "fill-in-blank":
      return (
        <FillInBlankQ
          question={question}
          value={answer as string | undefined}
          onAnswer={(v) => onAnswer(question.id, v)}
        />
      );
    case "matching":
      return (
        <MatchingPairsQ
          question={question}
          value={answer as [number, number][] | undefined}
          onAnswer={(pairs) => onAnswer(question.id, pairs)}
        />
      );
    case "sentence-order":
      return (
        <SentenceOrderQ
          question={question}
          value={answer as number[] | undefined}
          onAnswer={(order) => onAnswer(question.id, order)}
        />
      );
    case "listening":
      return (
        <ListeningQ
          question={question}
          value={answer as number[] | undefined}
          onAnswer={(a) => onAnswer(question.id, a)}
        />
      );
    default:
      return null;
  }
}
