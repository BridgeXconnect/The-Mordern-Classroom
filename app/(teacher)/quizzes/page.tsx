import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { Brain, BarChart3 } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/types/quiz";

export default async function QuizzesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const quizzes = await db.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { select: { id: true, title: true } },
      _count: { select: { attempts: true } },
    },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Quizzes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every quiz across your lessons, with attempt counts and results.
        </p>
      </div>

      {quizzes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No quizzes yet. Open a lesson and generate a quiz to get started.
        </p>
      ) : (
        <div className="space-y-2.5">
          {quizzes.map((q) => {
            const questionCount = (q.questions as unknown as QuizQuestion[]).length;
            return (
              <Card key={q.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Brain className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/lessons/${q.lesson.id}/quizzes`} className="font-medium hover:underline">
                      {q.lesson.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {q.type === "PRE" ? "Pre-lesson" : "Post-lesson"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{q.cefrLevel}</Badge>
                      <Badge variant={q.isActive ? "default" : "secondary"} className="text-xs">
                        {q.isActive ? "Active" : "Closed"}
                      </Badge>
                      <span>· {questionCount} questions · {q._count.attempts} attempt{q._count.attempts !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <Link
                    href={`/quizzes/${q.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  >
                    <BarChart3 className="h-3.5 w-3.5" /> Results
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
