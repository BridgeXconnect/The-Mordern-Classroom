// Client-safe TTS constants — NO server imports (Google SDK / Prisma) so this
// can be imported by client components (voice pickers) without bundling
// server-only dependencies.

export interface TtsVoice {
  id: string;
  label: string;
}

/** Curated Google Cloud Neural2 voices offered to teachers. */
export const TTS_VOICES: TtsVoice[] = [
  { id: "en-US-Neural2-F", label: "Emma — US English (female)" },
  { id: "en-US-Neural2-D", label: "Daniel — US English (male)" },
  { id: "en-US-Neural2-A", label: "Aria — US English (female)" },
  { id: "en-GB-Neural2-A", label: "Sophie — UK English (female)" },
  { id: "en-GB-Neural2-B", label: "Oliver — UK English (male)" },
  { id: "en-AU-Neural2-A", label: "Charlotte — Australian English (female)" },
];

export const TTS_VOICE_IDS = TTS_VOICES.map((v) => v.id);

export const DEFAULT_VOICE = "en-US-Neural2-F";
export const DEFAULT_LANGUAGE = "en-US";
