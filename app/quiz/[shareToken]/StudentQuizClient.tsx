"use client";

import { useState } from "react";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { CefrLevel, QuizType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold">{lessonTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {type === "PRE" ? "Pre-lesson quiz" : "Post-lesson quiz"} · Level {cefrLevel} ·{" "}
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setStarted(true);
          }}
          className="space-y-4 text-left"
        >
          <div className="space-y-1.5">
            <Label htmlFor="alias">Your name <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input
              id="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="e.g. Maria"
              maxLength={60}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Your teacher will see this next to your score.
            </p>
          </div>
          <Button type="submit" className="w-full gap-1.5">
            Start quiz <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
