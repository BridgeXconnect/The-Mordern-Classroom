import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const AssetTypeSchema = z.enum([
  "IMAGE",
  "AUDIO",
  "VIDEO_EMBED",
  "VIDEO_GENERATED",
  "INFOGRAPHIC",
]);

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId") ?? undefined;
  const rawType  = searchParams.get("type");

  // Validate the optional type filter before hitting the DB
  let type: z.infer<typeof AssetTypeSchema> | undefined;
  if (rawType !== null) {
    const parsed = AssetTypeSchema.safeParse(rawType);
    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${AssetTypeSchema.options.join(", ")}` },
        { status: 400 }
      );
    }
    type = parsed.data;
  }

  const assets = await db.mediaAsset.findMany({
    where: {
      ...(lessonId ? { lessonId } : {}),
      ...(type     ? { type }     : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(assets);
}
