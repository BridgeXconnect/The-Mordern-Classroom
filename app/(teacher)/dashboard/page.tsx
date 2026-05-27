import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, BookOpen, Brain, ChevronRight } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [classCount, lessonCount, quizCount, recentLessons] = await Promise.all([
    db.class.count(),
    db.lesson.count(),
    db.quiz.count(),
    db.lesson.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { unit: { include: { class: true } } },
    }),
  ]);

  const stats = [
    { label: "Classes", value: classCount, icon: GraduationCap, href: "/classes" },
    { label: "Lessons", value: lessonCount, icon: BookOpen, href: "/classes" },
    { label: "Quizzes", value: quizCount, icon: Brain, href: "/quizzes" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-base font-semibold mb-3">Recent Lessons</h2>
        {recentLessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              No lessons yet.{" "}
              <Link href="/classes" className="text-primary underline-offset-4 hover:underline">
                Create your first class →
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentLessons.map((lesson) => (
              <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.unit.class.name} · {lesson.unit.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {lesson.unit.class.cefrLevel}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
