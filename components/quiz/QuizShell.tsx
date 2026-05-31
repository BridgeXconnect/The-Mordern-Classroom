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
    <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col gap-6 p-4 sm:p-6">
      {/* Header + progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            {lessonTitle} · {type === "PRE" ? "Pre-quiz" : "Post-quiz"} · {cefrLevel}
          </span>
          <span className="tabular-nums text-muted-foreground">
            {index + 1} / {total}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current question */}
      <div className="flex-1">
        {current && <QuestionRouter question={current} answer={answers[current.id]} onAnswer={record} />}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0 || phase === "submitting"}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-1.5">
          {questions.map((q, i) => (
            <span
              key={q.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-5 bg-primary" : answers[q.id] !== undefined ? "w-1.5 bg-primary/50" : "w-1.5 bg-muted-foreground/25"
              )}
            />
          ))}
        </div>

        {isLast ? (
          <Button
            type="button"
            onClick={submit}
            disabled={phase === "submitting" || answeredCount === 0}
            className="gap-1.5"
          >
            {phase === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Finish
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            disabled={!currentAnswered}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
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
