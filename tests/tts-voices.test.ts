import { describe, it, expect } from "vitest";
import {
  TTS_VOICES,
  TTS_VOICE_IDS,
  DEFAULT_VOICE,
  DEFAULT_LANGUAGE,
} from "@/lib/tts-voices";

describe("tts-voices catalogue", () => {
  it("derives TTS_VOICE_IDS from the voice list, in order", () => {
    expect(TTS_VOICE_IDS).toEqual(TTS_VOICES.map((v) => v.id));
  });

  it("has unique voice ids", () => {
    expect(new Set(TTS_VOICE_IDS).size).toBe(TTS_VOICE_IDS.length);
  });

  it("uses well-formed Google Neural2 voice ids (e.g. en-US-Neural2-F)", () => {
    for (const id of TTS_VOICE_IDS) {
      expect(id).toMatch(/^[a-z]{2}-[A-Z]{2}-Neural2-[A-Z]$/);
    }
  });

  it("gives every voice a human-readable label", () => {
    for (const v of TTS_VOICES) expect(v.label.trim().length).toBeGreaterThan(0);
  });

  it("uses a default voice that exists in the catalogue", () => {
    expect(TTS_VOICE_IDS).toContain(DEFAULT_VOICE);
  });

  it("uses a default language matching the default voice's locale prefix", () => {
    expect(DEFAULT_VOICE.startsWith(DEFAULT_LANGUAGE)).toBe(true);
  });
});
