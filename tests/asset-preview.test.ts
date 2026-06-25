import { describe, it, expect } from "vitest";
import { buildAssetPreview } from "@/lib/asset-preview";

describe("buildAssetPreview", () => {
  it("plan: summary → subtitle, targets/materials/activities → sections with numbered steps", () => {
    const plan = {
      summary: "A reading lesson on climate change.",
      targets: { vocabulary: ["emissions", "drought"], grammar: ["present perfect"], skills: ["read for gist"] },
      materials: ["Handout A", "Projector"],
      activities: [
        {
          section: "Warm-Up",
          title: "Memory Game",
          durationMin: 10,
          objectives: ["Activate prior knowledge"],
          materials: [],
          contextSetup: "Show the images.",
          steps: ["Say hi", "Elicit responses"],
          teachingTips: [],
          extension: "",
        },
      ],
    };
    const p = buildAssetPreview("plan", plan);
    expect(p.title).toBe("Lesson plan");
    expect(p.subtitle).toBe("A reading lesson on climate change.");
    const headings = p.sections.map((s) => s.heading);
    expect(headings).toContain("Targets");
    expect(headings).toContain("Materials");
    expect(headings).toContain("Warm-Up · Memory Game (10 min)");
    const activity = p.sections.find((s) => s.heading.startsWith("Warm-Up"))!;
    expect(activity.lines).toEqual(["Set-up: Show the images.", "1. Say hi", "2. Elicit responses"]);
  });

  it("slides: row payload → one section per slide using bullets/body/vocab", () => {
    const slides = [
      { order: 0, type: "TITLE", content: { title: "Climate Change", subtitle: "B1 reading" } },
      { order: 1, type: "CONTENT", content: { title: "Causes", bullets: ["Emissions", "Deforestation"] } },
      {
        order: 2,
        type: "VOCABULARY",
        content: { title: "Key words", vocabularyItems: [{ word: "drought", definition: "long dry period" }] },
      },
    ];
    const p = buildAssetPreview("slides", slides);
    expect(p.subtitle).toBe("3 slides");
    expect(p.sections[0].heading).toBe("1. TITLE — Climate Change");
    expect(p.sections[0].lines).toEqual(["B1 reading"]);
    expect(p.sections[1].lines).toEqual(["Emissions", "Deforestation"]);
    expect(p.sections[2].lines).toEqual(["drought — long dry period"]);
  });

  it("worksheet: object payload → title + one section per worksheet section", () => {
    const ws = {
      title: "Climate Worksheet",
      sections: [
        { type: "gap-fill", title: "Fill the gaps", instructions: "Complete the sentences." },
        { type: "writing-prompt", title: "Your view", instructions: "Write 80 words." },
      ],
    };
    const p = buildAssetPreview("worksheet", ws);
    expect(p.title).toBe("Climate Worksheet");
    expect(p.subtitle).toBe("2 sections");
    expect(p.sections[0]).toEqual({ heading: "gap-fill — Fill the gaps", lines: ["Complete the sentences."] });
  });

  it("quiz: { questions } payload → marks correct option and shows fill-in answers", () => {
    const quiz = {
      questions: [
        { type: "multiple-choice", prompt: "Capital of France?", options: ["Paris", "Rome"], correctIndex: 0 },
        { type: "fill-in-blank", prompt: "Complete", text: "The sky is ___.", answer: "blue" },
      ],
    };
    const p = buildAssetPreview("quiz", quiz);
    expect(p.subtitle).toBe("2 questions");
    expect(p.sections[0].lines).toEqual(["✓ Paris", "• Rome"]);
    expect(p.sections[1].lines).toEqual(["The sky is ___.", "Answer: blue"]);
  });

  it("media: empty payload → friendly R2 placeholder", () => {
    const p = buildAssetPreview("media", []);
    expect(p.sections[0].heading).toBe("No media yet");
    expect(p.sections[0].lines[0]).toMatch(/R2/);
  });

  it("is defensive: undefined/garbage payloads never throw and yield a fallback", () => {
    for (const kind of ["plan", "slides", "worksheet", "quiz"] as const) {
      const p = buildAssetPreview(kind, undefined);
      expect(p.sections.length).toBeGreaterThan(0);
    }
  });
});
