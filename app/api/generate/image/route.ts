import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

const Schema = z.object({
  prompt:   z.string().min(5).max(500),
  lessonId: z.string().cuid().optional(),
  source:   z.enum(["pollinations", "huggingface"]).default("pollinations"),
});

// ── Pollinations.ai (no API key required) ───────────────────────────────────

async function generateViaPollinations(prompt: string): Promise<Buffer> {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1280&height=720&nologo=true&enhance=false&model=flux`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) throw new Error(`Pollinations error ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── HuggingFace FLUX.1-schnell fallback ─────────────────────────────────────

async function generateViaHuggingFace(prompt: string): Promise<Buffer> {
  const { HfInference } = await import("@huggingface/inference");
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  const blob = await hf.textToImage({
    model:  "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { width: 1280, height: 720 },
  });
  return Buffer.from(await blob.arrayBuffer());
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { prompt, lessonId, source } = parsed.data;

  let buffer: Buffer;
  let usedSource = source;

  try {
    buffer = source === "huggingface"
      ? await generateViaHuggingFace(prompt)
      : await generateViaPollinations(prompt);
  } catch {
    // Auto-fallback
    usedSource = source === "huggingface" ? "pollinations" : "huggingface";
    buffer = usedSource === "pollinations"
      ? await generateViaPollinations(prompt)
      : await generateViaHuggingFace(prompt);
  }

  const url = await uploadToR2(buffer, "images", "image/jpeg");

  try {
    const asset = await db.mediaAsset.create({
      data: {
        type:      "IMAGE",
        url,
        prompt,
        filename:  url.split("/").pop() ?? "image.jpg",
        mimeType:  "image/jpeg",
        sizeBytes: buffer.byteLength,
        ...(lessonId ? { lessonId } : {}),
      },
    });
    return NextResponse.json({ ...asset, source: usedSource }, { status: 201 });
  } catch (err) {
    // DB insert failed — clean up the R2 object so we don't leak storage
    console.error("DB insert failed after R2 upload; cleaning up orphan:", err);
    await deleteFromR2(url).catch((r2Err) =>
      console.error("R2 cleanup also failed:", r2Err)
    );
    return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
  }
}
