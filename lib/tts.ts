import TextToSpeech from "@google-cloud/text-to-speech";
import type { CefrLevel } from "@prisma/client";
import { createHash } from "crypto";
import { db } from "./db";
import { uploadToR2 } from "./r2";
import { DEFAULT_VOICE, DEFAULT_LANGUAGE } from "./tts-voices";

// Parse credentials from env (supports both file path and inline JSON for Vercel)
function getGoogleCredentials() {
  if (process.env.GOOGLE_TTS_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_TTS_CREDENTIALS);
  }
  // Falls back to GOOGLE_APPLICATION_CREDENTIALS file path (local dev)
  return undefined;
}

const ttsClient = new TextToSpeech.TextToSpeechClient(
  process.env.GOOGLE_TTS_CREDENTIALS
    ? { credentials: getGoogleCredentials() }
    : {}
);

// Speaking rate by CEFR level — slower for lower levels
export const SPEAKING_RATES: Record<CefrLevel, number> = {
  L1: 0.65,
  A1: 0.70,
  A2: 0.80,
  B1: 0.90,
  B2: 1.00,
};

export interface TTSOptions {
  cefrLevel?: CefrLevel;
  voiceName?: string; // e.g. "en-US-Neural2-F"
  speakingRate?: number; // overrides the CEFR-derived rate
}

export interface SpeechResult {
  url: string;
  /** true when an existing R2 object was reused instead of calling Google. */
  cached: boolean;
  /** characters synthesised (counts toward the 1M/month free quota). */
  charCount: number;
}

/** Google requires the languageCode to match the voice's locale prefix. */
function languageFromVoice(voiceName: string): string {
  const parts = voiceName.split("-");
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : DEFAULT_LANGUAGE;
}

function resolveRate(options: TTSOptions): number {
  if (typeof options.speakingRate === "number") return options.speakingRate;
  return SPEAKING_RATES[options.cefrLevel ?? "B1"];
}

/**
 * Pure Google Cloud TTS call → MP3 buffer. No storage side effects.
 */
export async function synthesizeSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const voiceName = options.voiceName ?? DEFAULT_VOICE;
  const rate = resolveRate(options);

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode: languageFromVoice(voiceName), name: voiceName },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: rate,
      pitch: 0,
      effectsProfileId: ["headphone-class-device"],
    },
  });

  if (!response.audioContent) {
    throw new Error("Google TTS returned empty audio content");
  }

  return Buffer.from(response.audioContent as Uint8Array);
}

/**
 * Deterministic content key: identical (voice, rate, text) → identical hash.
 * Used both as the R2 object filename and the cache lookup key, so the same
 * script never gets synthesised — or stored — twice.
 */
export function ttsContentHash(
  text: string,
  voiceName: string,
  rate: number
): string {
  return createHash("sha256").update(`${voiceName}|${rate}|${text}`).digest("hex");
}

/**
 * Cache-aware speech generation.
 *
 * Looks up a previously generated AUDIO asset with the same content hash and
 * reuses its URL on a hit. On a miss it calls Google, uploads the MP3 to R2
 * under a deterministic key, and persists a MediaAsset row so the clip also
 * shows up in the teacher's media library.
 *
 * @param text     - text to synthesise
 * @param options  - voice / CEFR / rate configuration
 * @param lessonId - optional lesson to associate the asset with
 */
export async function getOrCreateSpeech(
  text: string,
  options: TTSOptions = {},
  lessonId?: string
): Promise<SpeechResult> {
  const voiceName = options.voiceName ?? DEFAULT_VOICE;
  const rate = resolveRate(options);
  const hash = ttsContentHash(text, voiceName, rate);
  const filename = `${hash}.mpeg`;
  const charCount = estimateCharCount(text);

  // Cache hit — reuse the existing R2 object (no Google call, no new upload).
  const existing = await db.mediaAsset.findFirst({
    where: { type: "AUDIO", filename },
    select: { url: true },
  });
  if (existing) return { url: existing.url, cached: true, charCount };

  const buffer = await synthesizeSpeech(text, { ...options, voiceName, speakingRate: rate });
  // Deterministic filename → identical scripts overwrite the same key safely.
  const url = await uploadToR2(buffer, "audio", "audio/mpeg", hash);

  const asset = await db.mediaAsset.create({
    data: {
      type: "AUDIO",
      url,
      prompt: text.slice(0, 500),
      filename,
      mimeType: "audio/mpeg",
      sizeBytes: buffer.byteLength,
      ...(lessonId ? { lessonId } : {}),
    },
  });

  return { url: asset.url, cached: false, charCount };
}

/**
 * Convenience wrapper: synthesise + upload, returning only the URL.
 * Skips caching and DB persistence — prefer {@link getOrCreateSpeech} unless
 * you explicitly want a throwaway clip.
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<string> {
  const buffer = await synthesizeSpeech(text, options);
  return uploadToR2(buffer, "audio", "audio/mpeg");
}

/**
 * Estimate character count for quota tracking.
 * Google TTS counts SSML tags and whitespace.
 */
export function estimateCharCount(text: string): number {
  return text.length;
}
