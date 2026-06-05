import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { LibraryGrid } from "./LibraryGrid";

export default async function LibraryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const lessons = await db.lesson.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      unit: { include: { class: true } },
      slides: { take: 1 },
      quizzes: { take: 1 },
      mediaAssets: { take: 1 },
    },
  });

  return <LibraryGrid lessons={lessons} />;
}
