import { describe, it, expect } from "vitest";
import {
  scoreQuestion,
  scoreSubmission,
  sanitizeQuestionForStudent,
  sanitizeQuestionsForStudent,
} from "@/lib/quiz-scoring";
import type {
  MultipleChoiceQuestion,
  FillInBlankQuestion,
  MatchingQuestion,
  SentenceOrderQuestion,
  ImageBasedQuestion,
  ListeningQuestion,
  QuizQuestion,
} from "@/types/quiz";

// ── Fixtures ──────────────────────────────────────────────────────────────

const mc: MultipleChoiceQuestion = {
  id: "q-mc",
  type: "multiple-choice",
  prompt: "Pick B",
  points: 2,
  cefrLevel: "A2",
  options: ["A", "B", "C"],
  correctIndex: 1,
};

const fib: FillInBlankQuestion = {
  id: "q-fib",
  type: "fill-in-blank",
  prompt: "Fill it",
  points: 1,
  cefrLevel: "A1",
  text: "The cat ___ on the mat.",
  answer: "sat",
  acceptableAnswers: ["was sitting"],
};

const matching: MatchingQuestion = {
  id: "q-match",
  type: "matching",
  prompt: "Match",
  points: 3,
  cefrLevel: "B1",
  leftItems: ["dog", "cat"],
  rightItems: ["bark", "meow"],
  correctPairs: [
    [0, 0],
    [1, 1],
  ],
};

const ordering: SentenceOrderQuestion = {
  id: "q-order",
  type: "sentence-order",
  prompt: "Order",
  points: 2,
  cefrLevel: "B1",
  words: ["I", "am", "happy"],
  correctOrder: [0, 1, 2],
};

const imageBased: ImageBasedQuestion = {
  id: "q-img",
  type: "image-based",
  prompt: "What is it?",
  points: 1,
  cefrLevel: "A2",
  imageUrl: "https://example.com/cat.png",
  imagePrompt: "a cat",
  options: ["dog", "cat"],
  correctIndex: 1,
};

const listening: ListeningQuestion = {
  id: "q-listen",
  type: "listening",
  prompt: "Listen",
  points: 4,
  cefrLevel: "B2",
  audioUrl: "https://example.com/a.mp3",
  audioText: "A short clip.",
  subQuestions: [
    { id: "s1", type: "multiple-choice", prompt: "sub1", points: 1, cefrLevel: "B2", options: ["x", "y"], correctIndex: 0 },
    { id: "s2", type: "multiple-choice", prompt: "sub2", points: 1, cefrLevel: "B2", options: ["x", "y"], correctIndex: 1 },
  ],
};

// ── scoreQuestion ───────────────────────────────────────────────────────────

describe("scoreQuestion", () => {
  describe("multiple-choice / image-based", () => {
    it("awards full points for the correct index", () => {
      expect(scoreQuestion(mc, 1)).toEqual({ isCorrect: true, pointsEarned: 2 });
      expect(scoreQuestion(imageBased, 1)).toEqual({ isCorrect: true, pointsEarned: 1 });
    });

    it("awards zero for a wrong index", () => {
      expect(scoreQuestion(mc, 0)).toEqual({ isCorrect: false, pointsEarned: 0 });
    });

    it("coerces string answers (form values arrive as strings)", () => {
      expect(scoreQuestion(mc, "1")).toEqual({ isCorrect: true, pointsEarned: 2 });
    });

    it("treats undefined / null as incorrect", () => {
      expect(scoreQuestion(mc, undefined)).toEqual({ isCorrect: false, pointsEarned: 0 });
      expect(scoreQuestion(mc, null)).toEqual({ isCorrect: false, pointsEarned: 0 });
    });
  });

  describe("fill-in-blank", () => {
    it("accepts the primary answer regardless of case/whitespace", () => {
      expect(scoreQuestion(fib, "  SAT ").isCorrect).toBe(true);
      expect(scoreQuestion(fib, "sat").pointsEarned).toBe(1);
    });

    it("accepts an acceptableAnswers alternative, normalising internal spaces", () => {
      expect(scoreQuestion(fib, "was   sitting").isCorrect).toBe(true);
    });

    it("rejects a wrong answer", () => {
      expect(scoreQuestion(fib, "ran")).toEqual({ isCorrect: false, pointsEarned: 0 });
    });
  });

  describe("sentence-order", () => {
    it("requires the exact order", () => {
      expect(scoreQuestion(ordering, [0, 1, 2])).toEqual({ isCorrect: true, pointsEarned: 2 });
    });

    it("rejects a wrong order and a length mismatch", () => {
      expect(scoreQuestion(ordering, [2, 1, 0]).isCorrect).toBe(false);
      expect(scoreQuestion(ordering, [0, 1]).isCorrect).toBe(false);
      expect(scoreQuestion(ordering, "nope").isCorrect).toBe(false);
    });
  });

  describe("matching", () => {
    it("is order-independent", () => {
      expect(scoreQuestion(matching, [[1, 1], [0, 0]])).toEqual({ isCorrect: true, pointsEarned: 3 });
    });

    it("rejects wrong pairs, partial pairs, and non-arrays", () => {
      expect(scoreQuestion(matching, [[0, 1], [1, 0]]).isCorrect).toBe(false);
      expect(scoreQuestion(matching, [[0, 0]]).isCorrect).toBe(false);
      expect(scoreQuestion(matching, "x").isCorrect).toBe(false);
    });
  });

  describe("listening", () => {
    it("awards full points when all sub-questions are correct", () => {
      expect(scoreQuestion(listening, [0, 1])).toEqual({ isCorrect: true, pointsEarned: 4 });
    });

    it("awards proportional partial credit", () => {
      // 1 of 2 correct → 0.5 * 4 = 2
      expect(scoreQuestion(listening, [0, 0])).toEqual({ isCorrect: false, pointsEarned: 2 });
    });

    it("returns zero when there are no sub-questions", () => {
      const empty = { ...listening, subQuestions: [] };
      expect(scoreQuestion(empty, [])).toEqual({ isCorrect: false, pointsEarned: 0 });
    });

    it("treats a non-array answer as all-wrong", () => {
      expect(scoreQuestion(listening, "x")).toEqual({ isCorrect: false, pointsEarned: 0 });
    });
  });

  it("defaults missing points to 1", () => {
    const noPoints = { ...mc, points: undefined as unknown as number };
    expect(scoreQuestion(noPoints, 1).pointsEarned).toBe(1);
  });
});

// ── scoreSubmission ───────────────────────────────────────────────────────

describe("scoreSubmission", () => {
  const questions: QuizQuestion[] = [mc, fib, matching];

  it("aggregates score, percentage and counts across questions", () => {
    const result = scoreSubmission(questions, [
      { questionId: "q-mc", answer: 1 }, // 2/2
      { questionId: "q-fib", answer: "sat" }, // 1/1
      { questionId: "q-match", answer: [[0, 0]] }, // wrong → 0/3
    ]);

    expect(result.totalPoints).toBe(6);
    expect(result.score).toBe(3);
    expect(result.correctCount).toBe(2);
    expect(result.totalQuestions).toBe(3);
    expect(result.percentage).toBe(50);
  });

  it("scores missing answers as incorrect with a null answer recorded", () => {
    const result = scoreSubmission(questions, []);
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.answers).toHaveLength(3);
    expect(result.answers[0].answer).toBeNull();
    expect(result.answers.every((a) => !a.isCorrect)).toBe(true);
  });

  it("is driven by the stored questions, ignoring unknown submitted ids", () => {
    const result = scoreSubmission([mc], [
      { questionId: "does-not-exist", answer: 1 },
      { questionId: "q-mc", answer: 1 },
    ]);
    expect(result.totalQuestions).toBe(1);
    expect(result.score).toBe(2);
  });

  it("rounds the percentage to one decimal place", () => {
    // 1 of 3 questions, each 1 pt → 33.333% → 33.3
    const oneEach: QuizQuestion[] = [
      { ...mc, points: 1 },
      { ...mc, id: "q2", points: 1 },
      { ...mc, id: "q3", points: 1 },
    ];
    const result = scoreSubmission(oneEach, [{ questionId: "q-mc", answer: 1 }]);
    expect(result.percentage).toBe(33.3);
  });

  it("avoids divide-by-zero for an empty quiz", () => {
    const result = scoreSubmission([], []);
    expect(result).toMatchObject({ score: 0, totalPoints: 0, percentage: 0, totalQuestions: 0 });
  });
});

// ── sanitizeQuestionForStudent ──────────────────────────────────────────────

describe("sanitizeQuestionForStudent", () => {
  it("strips correctIndex from multiple-choice", () => {
    const safe = sanitizeQuestionForStudent(mc);
    expect(safe).not.toHaveProperty("correctIndex");
    expect(safe).toMatchObject({ id: "q-mc", options: ["A", "B", "C"] });
  });

  it("strips answer / acceptableAnswers from fill-in-blank but keeps the text", () => {
    const safe = sanitizeQuestionForStudent(fib);
    expect(safe).not.toHaveProperty("answer");
    expect(safe).not.toHaveProperty("acceptableAnswers");
    expect(safe).toHaveProperty("text", "The cat ___ on the mat.");
  });

  it("strips correctPairs from matching", () => {
    const safe = sanitizeQuestionForStudent(matching);
    expect(safe).not.toHaveProperty("correctPairs");
    expect(safe).toMatchObject({ leftItems: ["dog", "cat"], rightItems: ["bark", "meow"] });
  });

  it("strips correctOrder from sentence-order", () => {
    const safe = sanitizeQuestionForStudent(ordering);
    expect(safe).not.toHaveProperty("correctOrder");
    expect(safe).toHaveProperty("words");
  });

  it("strips per-sub correctIndex from listening sub-questions", () => {
    const safe = sanitizeQuestionForStudent(listening) as { subQuestions: Record<string, unknown>[] };
    expect(safe).toHaveProperty("audioUrl");
    expect(safe.subQuestions).toHaveLength(2);
    for (const sub of safe.subQuestions) {
      expect(sub).not.toHaveProperty("correctIndex");
      expect(sub).toHaveProperty("options");
    }
  });

  it("never leaks any answer key field across a mixed quiz", () => {
    const sanitized = sanitizeQuestionsForStudent([mc, fib, matching, ordering, imageBased, listening]);
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("correctIndex");
    expect(serialized).not.toContain("correctPairs");
    expect(serialized).not.toContain("correctOrder");
    expect(serialized).not.toContain("acceptableAnswers");
    // fill-in-blank "answer" key must be gone too
    expect(JSON.parse(serialized).some((q: Record<string, unknown>) => "answer" in q)).toBe(false);
  });
});
