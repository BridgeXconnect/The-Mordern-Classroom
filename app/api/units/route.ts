import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CreateUnitSchema = z.object({
  classId: z.string().cuid(),
  title: z.string().min(1).max(150),
  ibTheme: z.string().min(1).max(100),
  ibTextTypes: z.array(z.string()).min(1),
  atlSkills: z.array(z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"])).min(1),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "classId required" }, { status: 400 });

  const units = await db.unit.findMany({
    where: { classId },
    orderBy: { order: "asc" },
    include: {
      lessons: { orderBy: { order: "asc" } },
      _count: { select: { lessons: true } },
    },
  });

  return NextResponse.json(units);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await db.unit.count({ where: { classId: parsed.data.classId } });
  const unit = await db.unit.create({
    data: { ...parsed.data, order: count },
  });

  return NextResponse.json(unit, { status: 201 });
}
