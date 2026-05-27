import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const SaveLessonSchema = z.object({
  unitId: z.string().cuid(),
  title: z.string().min(1).max(200),
  objectives: z.array(z.any()),
  duration: z.number().int().min(15).max(300),
  ibAlignment: z.any(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unitId = searchParams.get("unitId");
  if (!unitId) return NextResponse.json({ error: "unitId required" }, { status: 400 });

  const lessons = await db.lesson.findMany({
    where: { unitId },
    orderBy: { order: "asc" },
    include: {
      _count: { select: { slides: true, worksheets: true, quizzes: true } },
    },
  });

  return NextResponse.json(lessons);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = SaveLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { unitId, title, objectives, duration, ibAlignment } = parsed.data;
  const count = await db.lesson.count({ where: { unitId } });
  const lesson = await db.lesson.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { unitId, title, objectives, duration, ibAlignment: ibAlignment as any, order: count },
  });

  return NextResponse.json(lesson, { status: 201 });
}
