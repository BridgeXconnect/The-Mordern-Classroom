import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LessonDetail } from "./LessonDetail";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id },
    include: {
      unit: { include: { class: true } },
      slides: { orderBy: { order: "asc" } },
      worksheets: true,
      quizzes: { include: { attempts: { take: 50 } } },
      mediaAssets: true,
    },
  });

  if (!lesson) notFound();
  return <LessonDetail lesson={lesson} />;
}
