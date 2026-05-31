import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { QuestionsArraySchema } from "@/lib/quiz-validation";
import type { Prisma } from "@prisma/client";

const UpdateSchema = z
  .object({
    isActive:  z.boolean().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    questions: QuestionsArraySchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await db.quiz.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const { isActive, expiresAt, questions } = parsed.data;

  const data: Prisma.QuizUpdateInput = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (questions !== undefined) {
    const withIds = questions.map((q) => ({ ...q, id: q.id ?? randomUUID() }));
    data.questions = withIds as unknown as Prisma.InputJsonValue;
  }

  const quiz = await db.quiz.update({ where: { id }, data });
  return NextResponse.json(quiz);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.quiz.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  // QuizAttempt rows cascade-delete via the schema relation.
  await db.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
