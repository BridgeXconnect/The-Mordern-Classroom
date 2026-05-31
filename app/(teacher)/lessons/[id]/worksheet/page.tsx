import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { WorksheetClient } from "./WorksheetClient";
import type { LessonObjective } from "@/types/lesson";
import type { WorksheetSection } from "@/types/worksheet";

export default async function WorksheetPage({
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
      worksheets: { orderBy: { createdAt: "desc" }, take: 1 },
      unit: { include: { class: true } },
    },
  });

  if (!lesson) notFound();

  const objectives = lesson.objectives as unknown as LessonObjective[];
  const worksheet = lesson.worksheets[0] ?? null;

  return (
    <WorksheetClient
      lesson={{
        id: lesson.id,
        title: lesson.title,
        cefrLevel: lesson.unit.class.cefrLevel,
        unitTitle: lesson.unit.title,
        className: lesson.unit.class.name,
        objectives: objectives.map((o) => `${o.skill}: ${o.description}`),
      }}
      classId={lesson.unit.classId}
      initialWorksheet={
        worksheet
          ? {
              id: worksheet.id,
              title: worksheet.title,
              sections: worksheet.sections as unknown as WorksheetSection[],
            }
          : null
      }
    />
  );
}
