import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { QuestionsArraySchema } from "@/lib/quiz-validation";
import type { Prisma } from "@prisma/client";

const CreateSchema = z.object({
  lessonId:  z.string().cuid(),
  type:      z.enum(["PRE", "POST"]),
  cefrLevel: z.enum(["L1", "A1", "A2", "B1", "B2"]),
  questions: QuestionsArraySchema,
  isActive:  z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // All quizzes overview with attempt counts + lesson context.
  const quizzes = await db.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { select: { id: true, title: true } },
      _count: { select: { attempts: true } },
    },
  });

  return NextResponse.json(quizzes);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lessonId, type, cefrLevel, questions, isActive, expiresAt } = parsed.data;

  // Verify the lesson exists before creating a quiz against it.
  const lesson = await db.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  // Assign a stable id to each question (used for answer matching at scoring time).
  const withIds = questions.map((q) => ({ ...q, id: q.id ?? randomUUID() }));

  const quiz = await db.quiz.create({
    data: {
      lessonId,
      type,
      cefrLevel,
      questions: withIds as unknown as Prisma.InputJsonValue,
      isActive,
      ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {}),
    },
  });

  return NextResponse.json(quiz, { status: 201 });
}
