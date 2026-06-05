import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClassDetail } from "./ClassDetail";

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return null;

  const cls = await db.class.findUnique({
    where: { id: params.id },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              slides: { take: 1 },
              quizzes: {
                take: 1,
                include: { attempts: { select: { score: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!cls) notFound();
  return <ClassDetail cls={cls} />;
}
