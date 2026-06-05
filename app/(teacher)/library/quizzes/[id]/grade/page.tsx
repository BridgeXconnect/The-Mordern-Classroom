import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GradingView } from "./GradingView";

export default async function GradingPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return null;

  const quiz = await db.quiz.findUnique({
    where: { id: params.id },
    include: {
      lesson: { include: { unit: { include: { class: true } } } },
      attempts: { orderBy: { completedAt: "asc" } },
    },
  });

  if (!quiz) notFound();
  return <GradingView quiz={quiz} />;
}
