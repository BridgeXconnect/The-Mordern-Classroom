import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CopilotView } from "./CopilotView";

interface Props {
  searchParams: Promise<{ lessonId?: string }>;
}

export default async function CreatePage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) return null;

  const { lessonId } = await searchParams;

  const classes = await db.class.findMany({
    where: { clerkUserId: userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, cefrLevel: true },
  });

  return <CopilotView classes={classes} initialLessonId={lessonId} />;
}
