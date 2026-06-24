import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedLesson } from "@/lib/ownership";

const UpdateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  objectives: z.array(z.any()).optional(),
  duration: z.number().int().min(15).max(300).optional(),
  ibAlignment: z.any().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const lesson = await db.lesson.findFirst({
    where: { id, unit: { class: { clerkUserId: userId } } },
    include: {
      unit: { include: { class: true } },
      _count: { select: { slides: true, worksheets: true, quizzes: true, mediaAssets: true } },
    },
  });

  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lesson);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await ownedLesson(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.lesson.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await ownedLesson(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.lesson.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
