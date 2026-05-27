import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const UpdateClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  cefrLevel: z.enum(["L1", "A1", "A2", "B1", "B2"]).optional(),
  academicYear: z.string().min(1).max(20).optional(),
  description: z.string().max(500).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cls = await db.class.findUnique({
    where: { id },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cls);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.class.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.class.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
