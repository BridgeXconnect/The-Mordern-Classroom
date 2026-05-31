import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { searchYouTube } from "@/lib/youtube";
import type { CefrLevel } from "@prisma/client";

const QuerySchema = z.object({
  q:         z.string().min(2).max(200),
  cefrLevel: z.enum(["L1", "A1", "A2", "B1", "B2"]).default("B1"),
  lessonId:  z.string().cuid().optional(),
});

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    q:         searchParams.get("q"),
    cefrLevel: searchParams.get("cefrLevel") ?? "B1",
    lessonId:  searchParams.get("lessonId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { q, cefrLevel, lessonId } = parsed.data;

  // ── Cache check ───────────────────────────────────────────────────────────
  // Prompt = "<q>|<cefrLevel>" — unique per (query, level) pair
  const cacheKey = `${q.toLowerCase().trim()}|${cefrLevel}`;

  const cached = await db.mediaAsset.findMany({
    where:   { type: "VIDEO_EMBED", prompt: cacheKey },
    orderBy: { createdAt: "asc" },
    take:    6,
  });

  if (cached.length > 0) {
    return NextResponse.json({ videos: cached, fromCache: true });
  }

  // ── Cache miss — call YouTube Data API v3 ─────────────────────────────────
  if (!process.env.YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured" },
      { status: 503 }
    );
  }

  let results;
  try {
    results = await searchYouTube(q, cefrLevel as CefrLevel, {
      maxResults:        6,
      safeSearch:        "strict",
      videoDuration:     "medium",
      relevanceLanguage: "en",
    });
  } catch (err) {
    console.error("YouTube search failed:", err);
    return NextResponse.json({ error: "YouTube search failed" }, { status: 502 });
  }

  if (results.length === 0) {
    return NextResponse.json({ videos: [], fromCache: false });
  }

  // ── Persist to DB (cache fill) ────────────────────────────────────────────
  const created = await db.$transaction(
    results.map((v) =>
      db.mediaAsset.create({
        data: {
          type:     "VIDEO_EMBED",
          url:      v.embedUrl,
          prompt:   cacheKey,
          filename: v.title,
          mimeType: "video/youtube",
          ...(lessonId ? { lessonId } : {}),
        },
      })
    )
  );

  // Return extra metadata (channel, publishedAt) only available on API call
  const meta = Object.fromEntries(
    results.map((v) => [
      v.id,
      { channelTitle: v.channelTitle, publishedAt: v.publishedAt },
    ])
  );

  return NextResponse.json({ videos: created, fromCache: false, meta });
}
