import { describe, it, expect } from "vitest";
import { GeneratedSlidesSchema } from "@/lib/slide-validation";
import { GeneratedWorksheetSchema } from "@/lib/worksheet-validation";
import { GeneratedLessonPlanSchema } from "@/lib/lesson-validation";

describe("GeneratedSlidesSchema", () => {
  it("accepts a valid TITLE + CONTENT + VOCABULARY deck", () => {
    const ok = GeneratedSlidesSchema.safeParse({
      slides: [
        { order: 0, type: "TITLE", content: { title: "Climate Change" } },
        { order: 1, type: "CONTENT", content: { title: "Causes", bullets: ["CO2", "Deforestation"] } },
        {
          order: 2,
          type: "VOCABULARY",
          content: {
            title: "Key words",
            vocabularyItems: [{ word: "emission", definition: "a release", example: "Cars cause emissions.", partOfSpeech: "noun" }],
          },
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a VOCABULARY slide with no vocabularyItems", () => {
    const bad = GeneratedSlidesSchema.safeParse({
      slides: [{ order: 0, type: "VOCABULARY", content: { title: "Key words" } }],
    });
    expect(bad.success).toBe(false);
  });
});

describe("GeneratedWorksheetSchema", () => {
  it("accepts a valid gap-fill worksheet", () => {
    const ok = GeneratedWorksheetSchema.safeParse({
      title: "Travel idioms",
      sections: [
        {
          type: "gap-fill",
          title: "Fill the gaps",
          content: { text: "I am ___ to travel ___.", answers: ["keen", "abroad"], wordBank: ["keen", "abroad", "tired"] },
        },
      ],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects a multiple-choice section with correctIndex out of range", () => {
    const bad = GeneratedWorksheetSchema.safeParse({
      title: "Quiz section",
      sections: [
        {
          type: "multiple-choice",
          title: "Pick one",
          content: { questions: [{ question: "2+2?", options: ["3", "4"], correctIndex: 5 }] },
        },
      ],
    });
    expect(bad.success).toBe(false);
  });
});

describe("GeneratedLessonPlanSchema", () => {
  it("accepts a minimal valid plan", () => {
    const ok = GeneratedLessonPlanSchema.safeParse({
      title: "Identity & Culture",
      objectives: [{ skill: "reading", description: "Read for gist", cefrDescriptor: "B1 reading" }],
      stages: [
        { name: "warm-up", duration: 10, teacherActivity: "Elicit", studentActivity: "Discuss", materials: [] },
      ],
      ibAlignment: {
        phase: "Phase 3",
        receptiveSkills: ["reading"],
        productiveSkills: ["speaking"],
        atlSkills: ["COMMUNICATION"],
        globalContext: "Identities and relationships",
        conceptualUnderstandings: ["Audience shapes meaning"],
      },
      vocabulary: ["identity"],
      assessmentIdeas: ["Exit ticket"],
      differentiationSuggestions: { support: ["sentence starters"], extension: ["extra reading"] },
    });
    expect(ok.success).toBe(true);
  });
});
