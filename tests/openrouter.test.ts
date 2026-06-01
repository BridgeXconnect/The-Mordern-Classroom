import { describe, it, expect } from "vitest";
import { cefrLabel, MODELS } from "@/lib/openrouter";
import type { CefrLevel } from "@prisma/client";

describe("cefrLabel", () => {
  const levels: CefrLevel[] = ["L1", "A1", "A2", "B1", "B2"];

  it("returns a distinct, non-empty label for every CEFR level", () => {
    const labels = levels.map(cefrLabel);
    for (const label of labels) expect(label.length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(levels.length);
  });

  it("includes the level code in its label", () => {
    expect(cefrLabel("A1")).toContain("A1");
    expect(cefrLabel("B2")).toContain("B2");
  });
});

describe("MODELS presets", () => {
  it("exposes the three expected model slots as non-empty strings", () => {
    expect(MODELS.DEFAULT).toBeTruthy();
    expect(MODELS.CEFR).toBeTruthy();
    expect(MODELS.STRUCTURED).toBeTruthy();
  });

  it("uses provider/model identifier format", () => {
    for (const id of Object.values(MODELS)) {
      expect(id).toMatch(/^[\w.-]+\/[\w.-]+$/);
    }
  });
});
