import { describe, it, expect } from "vitest";
import {
  QuestionSchema,
  QuestionsArraySchema,
  GeneratedQuizSchema,
} from "@/lib/quiz-validation";

const validMc = {
  type: "multiple-choice",
  prompt: "Pick one",
  cefrLevel: "A2",
  options: ["A", "B", "C"],
  correctIndex: 1,
};

describe("QuestionSchema (single question)", () => {
  it("accepts a valid multiple-choice question and defaults points to 1", () => {
    const parsed = QuestionSchema.parse(validMc);
    expect(parsed.points).toBe(1);
  });

  it("accepts a persisted question that carries an id", () => {
    expect(QuestionSchema.safeParse({ ...validMc, id: "abc" }).success).toBe(true);
  });

  it("rejects an empty prompt", () => {
    expect(QuestionSchema.safeParse({ ...validMc, prompt: "" }).success).toBe(false);
  });

  it("rejects fewer than 2 options", () => {
    expect(QuestionSchema.safeParse({ ...validMc, options: ["A"] }).success).toBe(false);
  });

  it("rejects more than 6 options", () => {
    expect(
      QuestionSchema.safeParse({ ...validMc, options: ["1", "2", "3", "4", "5", "6", "7"] }).success
    ).toBe(false);
  });

  it("rejects an unknown question type", () => {
    expect(QuestionSchema.safeParse({ ...validMc, type: "essay" }).success).toBe(false);
  });

  it("rejects an out-of-enum CEFR level", () => {
    expect(QuestionSchema.safeParse({ ...validMc, cefrLevel: "C1" }).success).toBe(false);
  });

  it("rejects points outside 1..10", () => {
    expect(QuestionSchema.safeParse({ ...validMc, points: 0 }).success).toBe(false);
    expect(QuestionSchema.safeParse({ ...validMc, points: 11 }).success).toBe(false);
  });

  it("validates a fill-in-blank question", () => {
    const ok = QuestionSchema.safeParse({
      type: "fill-in-blank",
      prompt: "Fill",
      cefrLevel: "A1",
      text: "The ___ ran.",
      answer: "dog",
    });
    expect(ok.success).toBe(true);
  });
});

describe("QuestionsArraySchema cross-field integrity (superRefine)", () => {
  it("rejects a multiple-choice correctIndex out of range", () => {
    const result = QuestionsArraySchema.safeParse([{ ...validMc, correctIndex: 5 }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/correctIndex out of range/);
    }
  });

  it("accepts a correctIndex at the last valid position", () => {
    expect(QuestionsArraySchema.safeParse([{ ...validMc, correctIndex: 2 }]).success).toBe(true);
  });

  it("rejects sentence-order when correctOrder length != words length", () => {
    const result = QuestionsArraySchema.safeParse([
      {
        type: "sentence-order",
        prompt: "Order",
        cefrLevel: "B1",
        words: ["I", "am", "happy"],
        correctOrder: [0, 1],
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects matching pairs that reference out-of-range indices", () => {
    const result = QuestionsArraySchema.safeParse([
      {
        type: "matching",
        prompt: "Match",
        cefrLevel: "B1",
        leftItems: ["a", "b"],
        rightItems: ["x", "y"],
        correctPairs: [
          [0, 0],
          [1, 5], // 5 is out of range for rightItems
        ],
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects a listening sub-question with correctIndex out of range", () => {
    const result = QuestionsArraySchema.safeParse([
      {
        type: "listening",
        prompt: "Listen",
        cefrLevel: "B2",
        audioText: "clip",
        subQuestions: [{ prompt: "s", options: ["x", "y"], correctIndex: 9 }],
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("enforces the array size bounds (1..30)", () => {
    expect(QuestionsArraySchema.safeParse([]).success).toBe(false);
    const thirtyOne = Array.from({ length: 31 }, () => ({ ...validMc }));
    expect(QuestionsArraySchema.safeParse(thirtyOne).success).toBe(false);
  });

  it("reports the offending question index in the issue path", () => {
    const result = QuestionsArraySchema.safeParse([
      { ...validMc }, // index 0 valid
      { ...validMc, correctIndex: 9 }, // index 1 invalid
    ]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path[0]).toBe(1);
    }
  });
});

describe("GeneratedQuizSchema (LLM output wrapper)", () => {
  it("accepts a well-formed { questions: [...] } payload", () => {
    expect(GeneratedQuizSchema.safeParse({ questions: [validMc] }).success).toBe(true);
  });

  it("rejects a payload missing the questions array", () => {
    expect(GeneratedQuizSchema.safeParse({}).success).toBe(false);
  });

  it("propagates cross-field integrity failures from the inner array", () => {
    expect(
      GeneratedQuizSchema.safeParse({ questions: [{ ...validMc, correctIndex: 9 }] }).success
    ).toBe(false);
  });
});
