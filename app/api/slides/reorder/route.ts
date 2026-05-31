import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const ReorderSchema = z.object({
  slides: z.array(z.object({ id: z.string().cuid(), order: z.number().int().min(0) })),
});

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.$transaction(
    parsed.data.slides.map(({ id, order }) =>
      db.slide.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ ok: true });
}
