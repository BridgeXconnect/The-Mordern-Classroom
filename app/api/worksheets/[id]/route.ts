import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedWorksheet } from "@/lib/ownership";

const UpdateSchema = z.object({
  title: z.string().min(1).optional(),
  sections: z.array(z.any()).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await ownedWorksheet(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const worksheet = await db.worksheet.update({ where: { id }, data: parsed.data as any });
  return NextResponse.json(worksheet);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!await ownedWorksheet(id, userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.worksheet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
