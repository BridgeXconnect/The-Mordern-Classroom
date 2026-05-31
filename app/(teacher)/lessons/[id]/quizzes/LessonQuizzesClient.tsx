"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, Brain, Sparkles, Loader2, Check, Copy, Trash2,
  BarChart3, ExternalLink, Eye, EyeOff,
} from "lucide-react";
import type { CefrLevel, QuizType } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { QuestionType, QuizQuestion } from "@/types/quiz";

interface LessonInfo {
  id: string;
  title: string;
  cefrLevel: CefrLevel;
  unitTitle: string;
  className: string;
  classId: string;
  objectives: string[];
}

interface QuizRow {
  id: string;
  type: QuizType;
  cefrLevel: CefrLevel;
  shareToken: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
}

interface Props {
  lesson: LessonInfo;
  initialQuizzes: QuizRow[];
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple-choice", label: "Multiple choice" },
  { value: "fill-in-blank", label: "Fill in the blank" },
  { value: "matching", label: "Matching pairs" },
  { value: "sentence-order", label: "Sentence order" },
  { value: "image-based", label: "Image based" },
  { value: "listening", label: "Listening" },
];

const TYPE_LABEL: Record<QuestionType, string> = {
  "multiple-choice": "Multiple choice",
  "fill-in-blank": "Fill in the blank",
  "matching": "Matching",
  "sentence-order": "Sentence order",
  "image-based": "Image based",
  "listening": "Listening",
};

export function LessonQuizzesClient({ lesson, initialQuizzes }: Props) {
  const [quizzes, setQuizzes] = useState<QuizRow[]>(initialQuizzes);

  // Generation form state
  const [quizType, setQuizType] = useState<QuizType>("PRE");
  const [count, setCount] = useState(6);
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(
    new Set(["multiple-choice", "fill-in-blank", "matching"])
  );
  const [vocab, setVocab] = useState("");

  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Omit<QuizQuestion, "id">[] | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function toggleType(t: QuestionType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function generate() {
    if (selectedTypes.size === 0) {
      setGenError("Pick at least one question type.");
      return;
    }
    setGenerating(true);
    setGenError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/generate/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          type: quizType,
          questionTypes: Array.from(selectedTypes),
          questionCount: count,
          vocabulary: vocab.trim()
            ? vocab.split(",").map((v) => v.trim()).filter(Boolean)
            : undefined,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(typeof b.error === "string" ? b.error : "Generation failed. Try again.");
      }
      const data = await res.json();
      setPreview(data.questions as Omit<QuizQuestion, "id">[]);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!preview) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          type: quizType,
          cefrLevel: lesson.cefrLevel,
          questions: preview,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(typeof b.error === "string" ? b.error : "Could not save quiz.");
      }
      const created = await res.json();
      setQuizzes((prev) => [
        {
          id: created.id,
          type: created.type,
          cefrLevel: created.cefrLevel,
          shareToken: created.shareToken,
          isActive: created.isActive,
          expiresAt: created.expiresAt ?? null,
          createdAt: created.createdAt,
          questionCount: preview.length,
          attemptCount: 0,
        },
        ...prev,
      ]);
      setPreview(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save quiz.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(quiz: QuizRow) {
    const next = !quiz.isActive;
    setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, isActive: next } : q)));
    const res = await fetch(`/api/quizzes/${quiz.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    if (!res.ok) {
      // Revert on failure.
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, isActive: !next } : q)));
    }
  }

  async function remove(quizId: string) {
    if (!confirm("Delete this quiz and all its attempts? This cannot be undone.")) return;
    const prev = quizzes;
    setQuizzes((p) => p.filter((q) => q.id !== quizId));
    const res = await fetch(`/api/quizzes/${quizId}`, { method: "DELETE" });
    if (!res.ok) setQuizzes(prev); // revert
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/lessons/${lesson.id}`}
          className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {lesson.title}
        </Link>
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold">Quizzes</h1>
          <Badge variant="outline">{lesson.cefrLevel}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {lesson.className} · {lesson.unitTitle}
        </p>
      </div>

      {/* Generator */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Generate a new quiz</h2>
          </div>

          {/* PRE / POST */}
          <div className="space-y-1.5">
            <Label>Quiz type</Label>
            <div className="flex gap-2">
              {(["PRE", "POST"] as QuizType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setQuizType(t)}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all",
                    quizType === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  {t === "PRE" ? "Pre-lesson" : "Post-lesson"}
                </button>
              ))}
            </div>
          </div>

          {/* Question types */}
          <div className="space-y-1.5">
            <Label>Question types</Label>
            <div className="flex flex-wrap gap-2">
              {QUESTION_TYPES.map(({ value, label }) => {
                const on = selectedTypes.has(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleType(value)}
                    className={cn(
                      "rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-all",
                      on ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count + vocab */}
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="count">Questions</Label>
              <Input
                id="count"
                type="number"
                min={3}
                max={20}
                value={count}
                onChange={(e) => setCount(Math.min(20, Math.max(3, Number(e.target.value) || 6)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vocab">Target vocabulary <span className="font-normal text-muted-foreground">(optional, comma-separated)</span></Label>
              <Input
                id="vocab"
                value={vocab}
                onChange={(e) => setVocab(e.target.value)}
                placeholder="e.g. habitat, predator, migration"
              />
            </div>
          </div>

          {genError && <p className="text-sm text-destructive">{genError}</p>}

          <Button type="button" onClick={generate} disabled={generating} className="gap-1.5">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Generate</>}
          </Button>
        </CardContent>
      </Card>

      {/* Preview of generated quiz */}
      {preview && (
        <Card className="border-primary/40">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Review · {preview.length} questions</h2>
              <Badge variant="secondary">{quizType === "PRE" ? "Pre-lesson" : "Post-lesson"}</Badge>
            </div>

            <ol className="space-y-2.5">
              {preview.map((q, i) => (
                <li key={i} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{q.prompt}</p>
                      <Badge variant="outline" className="mt-1.5 text-xs">{TYPE_LABEL[q.type]}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {saveError && <p className="text-sm text-destructive">{saveError}</p>}

            <div className="flex gap-2">
              <Button type="button" onClick={save} disabled={saving} className="gap-1.5">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Publish quiz</>}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPreview(null)} disabled={saving}>
                Discard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing quizzes */}
      <div className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Brain className="h-4 w-4" /> Saved quizzes ({quizzes.length})
        </h2>
        {quizzes.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No quizzes yet. Generate one above to get a shareable link.
          </p>
        ) : (
          quizzes.map((q) => <QuizCard key={q.id} quiz={q} onToggle={toggleActive} onDelete={remove} />)
        )}
      </div>
    </div>
  );
}

function QuizCard({
  quiz,
  onToggle,
  onDelete,
}: {
  quiz: QuizRow;
  onToggle: (q: QuizRow) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/quiz/${quiz.shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{quiz.type === "PRE" ? "Pre-lesson" : "Post-lesson"} quiz</span>
            <Badge variant="outline" className="text-xs">{quiz.cefrLevel}</Badge>
            <Badge variant={quiz.isActive ? "default" : "secondary"} className="text-xs">
              {quiz.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {quiz.questionCount} questions · {quiz.attemptCount} attempt{quiz.attemptCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
            {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Share link</>}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onToggle(quiz)} className="gap-1.5">
            {quiz.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Close</> : <><Eye className="h-3.5 w-3.5" /> Open</>}
          </Button>
          <Link href={`/quizzes/${quiz.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            <BarChart3 className="h-3.5 w-3.5" /> Results
          </Link>
          <a
            href={`/quiz/${quiz.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(quiz.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
