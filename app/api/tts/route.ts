import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateSpeech } from "@/lib/tts";
import { TTS_VOICE_IDS } from "@/lib/tts-voices";

// maxDuration: 30 — set in vercel.json (synthesis + R2 upload).

const CefrEnum = z.enum(["L1", "A1", "A2", "B1", "B2"]);
const VoiceEnum = z.enum(TTS_VOICE_IDS as [string, ...string[]]);

const ItemSchema = z.object({
  text:         z.string().min(1).max(5000),
  cefrLevel:    CefrEnum.optional(),
  voiceName:    VoiceEnum.optional(),
  speakingRate: z.number().min(0.25).max(4).optional(),
  lessonId:     z.string().cuid().optional(),
});

// Accepts either a single item ({ text, ... }) or a batch ({ items: [...] }).
const BodySchema = z.union([
  ItemSchema,
  z.object({ items: z.array(ItemSchema).min(1).max(20) }),
]);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    // ── Batch ──────────────────────────────────────────────────────────────
    if ("items" in parsed.data) {
      const results = await Promise.all(
        parsed.data.items.map((it) =>
          getOrCreateSpeech(
            it.text,
            { cefrLevel: it.cefrLevel, voiceName: it.voiceName, speakingRate: it.speakingRate },
            it.lessonId
          )
        )
      );
      return NextResponse.json({ results }, { status: 201 });
    }

    // ── Single ─────────────────────────────────────────────────────────────
    const it = parsed.data;
    const result = await getOrCreateSpeech(
      it.text,
      { cefrLevel: it.cefrLevel, voiceName: it.voiceName, speakingRate: it.speakingRate },
      it.lessonId
    );
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("TTS generation failed:", err);
    return NextResponse.json({ error: "Audio generation failed" }, { status: 502 });
  }
}
