import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CreateSlideSchema = z.object({
  lessonId: z.string().cuid(),
  type: z.enum(["TITLE", "CONTENT", "IMAGE", "VOCABULARY", "GRAMMAR", "ACTIVITY"]),
  content: z.record(z.any()),
  speakerNotes: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return NextResponse.json({ error: "lessonId required" }, { status: 400 });

  const slides = await db.slide.findMany({
    where: { lessonId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(slides);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSlideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lessonId, type, content, speakerNotes } = parsed.data;
  const count = await db.slide.count({ where: { lessonId } });
  const order = parsed.data.order ?? count;

  const slide = await db.slide.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { lessonId, type, content: content as any, speakerNotes, order },
  });

  return NextResponse.json(slide, { status: 201 });
}
