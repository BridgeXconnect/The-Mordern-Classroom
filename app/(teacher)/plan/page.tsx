import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { PlanDashboard } from "./PlanDashboard";

export default async function PlanPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [classes, recentLessons] = await Promise.all([
    db.class.findMany({
      orderBy: { name: "asc" },
      include: {
        units: {
          include: { lessons: { take: 1, orderBy: { createdAt: "desc" } } },
          orderBy: { order: "asc" },
        },
        _count: { select: { units: true } },
      },
    }),
    db.lesson.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { unit: { include: { class: true } } },
    }),
  ]);

  return <PlanDashboard classes={classes} recentLessons={recentLessons} />;
}
