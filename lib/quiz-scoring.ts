import type {
  QuizQuestion,
  QuizAttemptAnswer,
  QuizResult,
} from "@/types/quiz";

/**
 * Strip every correct-answer signal from a question before sending it to a
 * student's browser. Without this, students could read the answers straight
 * out of the network response. The server keeps the full definition and
 * scores submissions authoritatively via scoreSubmission().
 */
export function sanitizeQuestionForStudent(q: QuizQuestion): Record<string, unknown> {
  const base = {
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    points: q.points,
    cefrLevel: q.cefrLevel,
  };

  switch (q.type) {
    case "multiple-choice":
      return { ...base, options: q.options };
    case "image-based":
      return { ...base, options: q.options, imageUrl: q.imageUrl, imagePrompt: q.imagePrompt };
    case "fill-in-blank":
      return { ...base, text: q.text };
    case "matching":
      // Shuffle the right column so position doesn't leak the pairing.
      return { ...base, leftItems: q.leftItems, rightItems: q.rightItems };
    case "sentence-order":
      return { ...base, words: q.words };
    case "listening":
      return {
        ...base,
        audioUrl: q.audioUrl,
        audioText: q.audioText,
        subQuestions: (q.subQuestions ?? []).map((s) => ({
          prompt: s.prompt,
          options: s.options,
        })),
      };
    default:
      return base;
  }
}

export function sanitizeQuestionsForStudent(questions: QuizQuestion[]): Record<string, unknown>[] {
  return questions.map(sanitizeQuestionForStudent);
}

/**
 * Server-authoritative quiz scoring.
 *
 * The client only ever submits a student's *raw* answer per question
 * ({ questionId, answer }). Correctness and points are ALWAYS recomputed
 * here against the stored quiz definition — never trusted from the client.
 */

export interface RawAnswer {
  questionId: string;
  answer?: unknown;
}

function norm(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function numberArraysEqual(a: unknown, b: number[]): boolean {
  if (!Array.isArray(a) || a.length !== b.length) return false;
  return a.every((v, i) => Number(v) === b[i]);
}

/** Order-independent comparison of [left,right] matching pairs. */
function pairsMatch(a: unknown, correct: [number, number][]): boolean {
  if (!Array.isArray(a) || a.length !== correct.length) return false;
  const key = (p: [number, number]) => `${p[0]}:${p[1]}`;
  const want = new Set(correct.map(key));
  const got = new Set(
    a
      .filter((p): p is [number, number] => Array.isArray(p) && p.length === 2)
      .map((p) => key([Number(p[0]), Number(p[1])]))
  );
  if (got.size !== want.size) return false;
  for (const k of want) if (!got.has(k)) return false;
  return true;
}

/**
 * Score a single question against a raw student answer.
 * Returns whether it is fully correct and how many points were earned
 * (partial credit is awarded for listening sub-questions).
 */
export function scoreQuestion(
  question: QuizQuestion,
  rawAnswer: unknown
): { isCorrect: boolean; pointsEarned: number } {
  const points = question.points ?? 1;

  switch (question.type) {
    case "multiple-choice":
    case "image-based": {
      const isCorrect = Number(rawAnswer) === question.correctIndex;
      return { isCorrect, pointsEarned: isCorrect ? points : 0 };
    }

    case "fill-in-blank": {
      const candidates = [question.answer, ...(question.acceptableAnswers ?? [])].map(norm);
      const isCorrect = candidates.includes(norm(rawAnswer));
      return { isCorrect, pointsEarned: isCorrect ? points : 0 };
    }

    case "sentence-order": {
      const isCorrect = numberArraysEqual(rawAnswer, question.correctOrder);
      return { isCorrect, pointsEarned: isCorrect ? points : 0 };
    }

    case "matching": {
      const isCorrect = pairsMatch(rawAnswer, question.correctPairs);
      return { isCorrect, pointsEarned: isCorrect ? points : 0 };
    }

    case "listening": {
      const subs = question.subQuestions ?? [];
      if (subs.length === 0) return { isCorrect: false, pointsEarned: 0 };
      const answers = Array.isArray(rawAnswer) ? rawAnswer : [];
      const correctCount = subs.reduce(
        (acc, sub, i) => acc + (Number(answers[i]) === sub.correctIndex ? 1 : 0),
        0
      );
      const isCorrect = correctCount === subs.length;
      // Partial credit, proportional to sub-questions answered correctly.
      const pointsEarned = Math.round((correctCount / subs.length) * points * 100) / 100;
      return { isCorrect, pointsEarned };
    }

    default:
      return { isCorrect: false, pointsEarned: 0 };
  }
}

/**
 * Score a full submission. Iterates the stored quiz questions (the source of
 * truth) and matches each to the student's raw answer by questionId.
 */
export function scoreSubmission(
  questions: QuizQuestion[],
  rawAnswers: RawAnswer[]
): QuizResult {
  const answerMap = new Map(rawAnswers.map((a) => [a.questionId, a.answer]));

  const answers: QuizAttemptAnswer[] = questions.map((q) => {
    const raw = answerMap.get(q.id);
    const { isCorrect, pointsEarned } = scoreQuestion(q, raw);
    return { questionId: q.id, answer: raw ?? null, isCorrect, pointsEarned };
  });

  const totalPoints = questions.reduce((acc, q) => acc + (q.points ?? 1), 0);
  const score = answers.reduce((acc, a) => acc + a.pointsEarned, 0);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;

  return {
    score: Math.round(score * 100) / 100,
    totalPoints,
    percentage: Math.round(percentage * 10) / 10,
    correctCount,
    totalQuestions: questions.length,
    answers,
  };
}
