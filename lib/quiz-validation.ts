import { z } from "zod";

/**
 * Zod schemas for quiz questions. Used to:
 *  - validate LLM-generated question JSON before persisting
 *  - validate teacher-edited quiz payloads on save/update
 *
 * These mirror the discriminated union in types/quiz.ts. IDs are assigned
 * server-side at save time, so `id` is optional here (present on persisted
 * questions, absent on freshly generated ones).
 *
 * NOTE: discriminatedUnion members must be plain ZodObjects, so cross-field
 * checks (e.g. correctIndex in range) are applied via superRefine on the
 * wrapping array schema rather than per-member .refine().
 */

const CefrEnum = z.enum(["L1", "A1", "A2", "B1", "B2"]);

const baseFields = {
  id: z.string().optional(),
  prompt: z.string().min(1),
  points: z.number().int().min(1).max(10).default(1),
  cefrLevel: CefrEnum,
  explanation: z.string().optional(),
};

export const MultipleChoiceSchema = z.object({
  ...baseFields,
  type: z.literal("multiple-choice"),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
});

export const FillInBlankSchema = z.object({
  ...baseFields,
  type: z.literal("fill-in-blank"),
  text: z.string().min(1),
  answer: z.string().min(1),
  acceptableAnswers: z.array(z.string()).optional(),
});

export const MatchingSchema = z.object({
  ...baseFields,
  type: z.literal("matching"),
  leftItems: z.array(z.string().min(1)).min(2),
  rightItems: z.array(z.string().min(1)).min(2),
  correctPairs: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
});

export const SentenceOrderSchema = z.object({
  ...baseFields,
  type: z.literal("sentence-order"),
  words: z.array(z.string().min(1)).min(2),
  correctOrder: z.array(z.number().int()).min(2),
});

export const ImageBasedSchema = z.object({
  ...baseFields,
  type: z.literal("image-based"),
  imageUrl: z.string().url().optional(),
  imagePrompt: z.string().optional(),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
});

// A listening sub-question is a plain multiple choice.
const SubMcqSchema = z.object({
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  type: z.literal("multiple-choice").optional(),
  points: z.number().optional(),
  cefrLevel: CefrEnum.optional(),
  explanation: z.string().optional(),
});

export const ListeningSchema = z.object({
  ...baseFields,
  type: z.literal("listening"),
  audioUrl: z.string().url().optional(),
  audioText: z.string().min(1),
  subQuestions: z.array(SubMcqSchema).min(1),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceSchema,
  FillInBlankSchema,
  MatchingSchema,
  SentenceOrderSchema,
  ImageBasedSchema,
  ListeningSchema,
]);

export type ValidatedQuestion = z.infer<typeof QuestionSchema>;

/** Cross-field integrity checks that a flat object schema can't express. */
function refineQuestion(q: ValidatedQuestion, ctx: z.RefinementCtx, index: number) {
  const at = (path: string) => ({ path: [index, path] as (string | number)[] });
  if (q.type === "multiple-choice" || q.type === "image-based") {
    if (q.correctIndex >= q.options.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctIndex out of range", ...at("correctIndex") });
    }
  }
  if (q.type === "sentence-order") {
    if (q.correctOrder.length !== q.words.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctOrder length must match words", ...at("correctOrder") });
    }
  }
  if (q.type === "matching") {
    for (const [l, r] of q.correctPairs) {
      if (l < 0 || l >= q.leftItems.length || r < 0 || r >= q.rightItems.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctPairs index out of range", ...at("correctPairs") });
        break;
      }
    }
  }
  if (q.type === "listening") {
    q.subQuestions.forEach((sub, si) => {
      if (sub.correctIndex >= sub.options.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `subQuestion ${si} correctIndex out of range`, ...at("subQuestions") });
      }
    });
  }
}

/** Array of questions with integrity checks. */
export const QuestionsArraySchema = z
  .array(QuestionSchema)
  .min(1)
  .max(30)
  .superRefine((questions, ctx) => {
    questions.forEach((q, i) => refineQuestion(q, ctx, i));
  });

/** LLM output wrapper. */
export const GeneratedQuizSchema = z.object({
  questions: QuestionsArraySchema,
});
