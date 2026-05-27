import TextToSpeech from "@google-cloud/text-to-speech";
import type { CefrLevel } from "@prisma/client";
import { uploadToR2 } from "./r2";

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
const SPEAKING_RATES: Record<CefrLevel, number> = {
  L1: 0.65,
  A1: 0.70,
  A2: 0.80,
  B1: 0.90,
  B2: 1.00,
};

export interface TTSOptions {
  cefrLevel?: CefrLevel;
  languageCode?: string;
  voiceName?: string; // e.g. "en-US-Neural2-F"
  speakingRate?: number;
}

/**
 * Generate speech audio from text using Google Cloud TTS.
 * Stores the resulting MP3 in R2 and returns the public URL.
 *
 * @param text - The text to synthesise (counts toward 1M free char/month quota)
 * @param options - TTS configuration options
 * @returns Public R2 URL of the generated MP3
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<string> {
  const {
    cefrLevel = "B1",
    languageCode = "en-US",
    voiceName = "en-US-Neural2-F",
    speakingRate,
  } = options;

  const rate = speakingRate ?? SPEAKING_RATES[cefrLevel];

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: { languageCode, name: voiceName },
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

  const buffer = Buffer.from(response.audioContent as Uint8Array);
  const url = await uploadToR2(buffer, "audio", "audio/mpeg");

  return url;
}

/**
 * Estimate character count for quota tracking.
 * Google TTS counts SSML tags and whitespace.
 */
export function estimateCharCount(text: string): number {
  return text.length;
}
