import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const UpdateSlideSchema = z.object({
  type: z.enum(["TITLE", "CONTENT", "IMAGE", "VOCABULARY", "GRAMMAR", "ACTIVITY"]).optional(),
  content: z.record(z.any()).optional(),
  speakerNotes: z.string().nullable().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSlideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slide = await db.slide.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: parsed.data as any,
  });

  return NextResponse.json(slide);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.slide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
