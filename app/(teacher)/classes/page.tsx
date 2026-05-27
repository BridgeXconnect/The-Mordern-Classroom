import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { ClassesClient } from "./ClassesClient";

export default async function ClassesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const classes = await db.class.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      units: {
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  return <ClassesClient initialClasses={classes} />;
}
