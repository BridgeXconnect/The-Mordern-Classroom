import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedLesson } from "@/lib/ownership";
import type { LessonPlanBody } from "@/types/lesson";

const PatchPlanSchema = z.object({
  summary:    z.string().min(1).optional(),
  materials:  z.array(z.string()).optional(),
  targets: z.object({
    vocabulary: z.array(z.string()).optional(),
    grammar:    z.array(z.string()).optional(),
    skills:     z.array(z.string()).optional(),
  }).optional(),
  activities: z.array(z.any()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await ownedLesson(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PatchPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({ where: { id }, select: { plan: true } });
  if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existingPlan = (lesson.plan ?? {}) as unknown as LessonPlanBody;
  const patch = parsed.data;

  const updatedPlan: LessonPlanBody = {
    ...existingPlan,
    ...(patch.summary    !== undefined ? { summary: patch.summary }       : {}),
    ...(patch.materials  !== undefined ? { materials: patch.materials }   : {}),
    ...(patch.activities !== undefined ? { activities: patch.activities } : {}),
    ...(patch.targets !== undefined ? {
      targets: { ...existingPlan.targets, ...patch.targets },
    } : {}),
  };

  const updated = await db.lesson.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { plan: updatedPlan as any },
  });

  revalidatePath(`/library/lessons/${id}`);
  return NextResponse.json(updated);
}
