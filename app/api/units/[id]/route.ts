import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const UpdateUnitSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  ibTheme: z.string().min(1).max(100).optional(),
  ibTextTypes: z.array(z.string()).optional(),
  atlSkills: z.array(z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"])).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await db.unit.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.unit.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
