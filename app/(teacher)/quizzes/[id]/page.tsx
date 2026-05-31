import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Users, TrendingUp, Trophy, TrendingDown } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuizQuestion } from "@/types/quiz";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;

  const quiz = await db.quiz.findUnique({
    where: { id },
    include: {
      lesson: { select: { id: true, title: true } },
      attempts: { orderBy: { completedAt: "desc" } },
    },
  });
  if (!quiz) notFound();

  const questions = quiz.questions as unknown as QuizQuestion[];
  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);

  const attempts = quiz.attempts.map((a) => ({
    id: a.id,
    studentAlias: a.studentAlias,
    completedAt: a.completedAt,
    score: a.score,
    percentage: totalPoints > 0 ? Math.round((a.score / totalPoints) * 1000) / 10 : 0,
  }));

  const scores = attempts.map((a) => a.percentage);
  const avg = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : 0;
  const high = scores.length ? Math.max(...scores) : 0;
  const low = scores.length ? Math.min(...scores) : 0;

  const stats = [
    { icon: Users, label: "Attempts", value: attempts.length },
    { icon: TrendingUp, label: "Average", value: `${avg}%` },
    { icon: Trophy, label: "Highest", value: `${high}%` },
    { icon: TrendingDown, label: "Lowest", value: `${low}%` },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/lessons/${quiz.lesson.id}/quizzes`}
          className="mb-1 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {quiz.lesson.title}
        </Link>
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-2xl font-bold">
            {quiz.type === "PRE" ? "Pre-lesson" : "Post-lesson"} quiz results
          </h1>
          <Badge variant="outline">{quiz.cefrLevel}</Badge>
          <Badge variant={quiz.isActive ? "default" : "secondary"}>
            {quiz.isActive ? "Active" : "Closed"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {questions.length} questions · {totalPoints} points
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Attempts table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Attempts</h2>
        {attempts.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No one has taken this quiz yet. Share the link to collect responses.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Student</th>
                    <th className="px-4 py-2.5 font-medium">Score</th>
                    <th className="px-4 py-2.5 text-right font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">
                        {a.studentAlias || <span className="text-muted-foreground">Anonymous</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={
                            a.percentage >= 80
                              ? "text-emerald-600"
                              : a.percentage >= 50
                              ? "text-amber-600"
                              : "text-rose-600"
                          }
                        >
                          {a.percentage}%
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({a.score}/{totalPoints})
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">
                        {new Date(a.completedAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
