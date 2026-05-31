import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SlidesClient } from "./SlidesClient";
import type { LessonObjective } from "@/types/lesson";

export default async function SlidesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;

  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      slides: { orderBy: { order: "asc" } },
      unit: { include: { class: true } },
    },
  });

  if (!lesson) notFound();

  const objectives = lesson.objectives as unknown as LessonObjective[];

  return (
    <SlidesClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
        duration: lesson.duration,
        cefrLevel: lesson.unit.class.cefrLevel,
        unitTitle: lesson.unit.title,
        className: lesson.unit.class.name,
        objectives: objectives.map((o) => `${o.skill}: ${o.description}`),
      }}
      initialSlides={lesson.slides.map((s) => ({
        id: s.id,
        order: s.order,
        type: s.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: s.content as any,
        speakerNotes: s.speakerNotes ?? undefined,
      }))}
      classId={lesson.unit.classId}
    />
  );
}
