import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ClassDetailClient } from "./ClassDetailClient";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id } = await params;
  const cls = await db.class.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!cls) notFound();
  return <ClassDetailClient cls={cls} />;
}
