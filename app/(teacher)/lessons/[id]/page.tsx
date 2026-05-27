import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Presentation, FileText, Brain, Image } from "lucide-react";
import type { IbAlignment, LessonObjective } from "@/types/lesson";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      unit: { include: { class: true } },
      _count: { select: { slides: true, worksheets: true, quizzes: true, mediaAssets: true } },
    },
  });

  if (!lesson) notFound();

  const objectives = lesson.objectives as unknown as LessonObjective[];
  const ibAlignment = lesson.ibAlignment as unknown as IbAlignment;

  const modules = [
    {
      href: `/lessons/${id}/slides`,
      icon: Presentation,
      label: "Slides",
      description: "Build a Reveal.js presentation",
      count: lesson._count.slides,
      countLabel: "slide",
    },
    {
      href: `/lessons/${id}/worksheet`,
      icon: FileText,
      label: "Worksheet",
      description: "Generate a printable worksheet",
      count: lesson._count.worksheets,
      countLabel: "worksheet",
    },
    {
      href: `/lessons/${id}/quizzes`,
      icon: Brain,
      label: "Quizzes",
      description: "Create pre/post quizzes with share links",
      count: lesson._count.quizzes,
      countLabel: "quiz",
    },
    {
      href: `/media`,
      icon: Image,
      label: "Media",
      description: "Images, infographics, videos",
      count: lesson._count.mediaAssets,
      countLabel: "asset",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb + title */}
      <div>
        <Link
          href={`/classes/${lesson.unit.classId}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {lesson.unit.class.name}
        </Link>
        <div className="flex items-start gap-3">
          <h1 className="text-2xl font-bold flex-1">{lesson.title}</h1>
          <Badge variant="outline">{lesson.unit.class.cefrLevel}</Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          {lesson.unit.title} · {lesson.duration} min
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-2 gap-3">
        {modules.map(({ href, icon: Icon, label, description, count, countLabel }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {count} {countLabel}{count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="font-medium mt-2">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Objectives */}
      {objectives.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Badge variant="outline" className="text-xs capitalize shrink-0">{obj.skill}</Badge>
                  <span>{obj.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* IB Alignment */}
      {ibAlignment && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              IB Alignment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3 text-sm">
            {ibAlignment.globalContext && (
              <div>
                <span className="font-medium">Global Context: </span>
                <span className="text-muted-foreground">{ibAlignment.globalContext}</span>
              </div>
            )}
            {ibAlignment.conceptualUnderstandings?.length > 0 && (
              <div>
                <span className="font-medium block mb-1">Conceptual Understandings</span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {ibAlignment.conceptualUnderstandings.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
            {ibAlignment.atlSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ibAlignment.atlSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
