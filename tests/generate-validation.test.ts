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
  const validPlan = {
    title: "Identity & Culture",
    summary: "A B1 reading lesson exploring how culture shapes identity.",
    objectives: [{ skill: "reading", description: "Read for gist", cefrDescriptor: "B1 reading" }],
    targets: { vocabulary: ["identity", "heritage"], grammar: ["present perfect"], skills: ["read for gist"] },
    materials: ["Handout A", "Projector"],
    activities: [
      {
        section: "Warm-Up",
        title: "Memory Game",
        durationMin: 10,
        objectives: ["Activate prior knowledge"],
        materials: [],
        contextSetup: "Show the images and elicit vocabulary.",
        steps: ["Greet the class", "Show the first image", "Elicit what students see"],
        teachingTips: ["If a student is quiet, ask a yes/no question first"],
        extension: "",
      },
    ],
    ibAlignment: {
      phase: "Phase 3",
      receptiveSkills: ["reading"],
      productiveSkills: ["speaking"],
      atlSkills: ["COMMUNICATION"],
      globalContext: "Identities and relationships",
      conceptualUnderstandings: ["Audience shapes meaning"],
    },
  };

  it("accepts a valid WSE-style scripted plan", () => {
    const ok = GeneratedLessonPlanSchema.safeParse(validPlan);
    expect(ok.success).toBe(true);
  });

  it("rejects an activity with no steps", () => {
    const bad = GeneratedLessonPlanSchema.safeParse({
      ...validPlan,
      activities: [{ ...validPlan.activities[0], steps: [] }],
    });
    expect(bad.success).toBe(false);
  });
});
