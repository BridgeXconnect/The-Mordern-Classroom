import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const CreateClassSchema = z.object({
  name: z.string().min(1).max(100),
  cefrLevel: z.enum(["L1", "A1", "A2", "B1", "B2"]),
  academicYear: z.string().min(1).max(20),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await db.class.findMany({
    where: { clerkUserId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { units: true } },
      units: {
        include: { _count: { select: { lessons: true } } },
      },
    },
  });

  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const newClass = await db.class.create({
    data: { ...parsed.data, clerkUserId: userId },
  });
  return NextResponse.json(newClass, { status: 201 });
}
