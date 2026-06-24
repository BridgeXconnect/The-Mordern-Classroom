import { z } from "zod";

/**
 * Zod schema for LLM-generated worksheets. Used by /api/generate/worksheet to enforce
 * the shape (via generateObject) before persisting, where previously there was none.
 *
 * Derived from types/worksheet.ts. The section content shapes carry no `type` field of
 * their own — the discriminator lives on the section — so this is a discriminatedUnion
 * on the section `type`, with per-section content schemas. Cross-field integrity checks
 * (index ranges, gap counts) go in superRefine on the sections array, since
 * discriminatedUnion members must be plain ZodObjects (same convention as quiz-validation).
 *
 * `id` is optional here: the route backfills a uuid for any section the model omits it on.
 */

const sectionBase = {
  id: z.string().optional(),
  title: z.string().min(1),
  instructions: z.string().optional(),
  points: z.number().optional(),
};

const GapFillSection = z.object({
  ...sectionBase,
  type: z.literal("gap-fill"),
  content: z.object({
    text: z.string().min(1),
    answers: z.array(z.string().min(1)).min(1),
    wordBank: z.array(z.string()).optional(),
  }),
});

const MatchingSection = z.object({
  ...sectionBase,
  type: z.literal("matching"),
  content: z.object({
    leftItems: z.array(z.string().min(1)).min(2),
    rightItems: z.array(z.string().min(1)).min(2),
    correctPairs: z.array(z.tuple([z.number().int(), z.number().int()])).min(1),
  }),
});

const ReadingPassageSection = z.object({
  ...sectionBase,
  type: z.literal("reading-passage"),
  content: z.object({
    passage: z.string().min(1),
    comprehensionQuestions: z
      .array(z.object({ question: z.string().min(1), answer: z.string().optional() }))
      .min(1),
  }),
});

const WritingPromptSection = z.object({
  ...sectionBase,
  type: z.literal("writing-prompt"),
  content: z.object({
    prompt: z.string().min(1),
    minWords: z.number().int().optional(),
    maxWords: z.number().int().optional(),
    guidancePoints: z.array(z.string()).optional(),
  }),
});

const VocabularySection = z.object({
  ...sectionBase,
  type: z.literal("vocabulary"),
  content: z.object({
    words: z
      .array(
        z.object({
          word: z.string().min(1),
          definition: z.string().optional(),
          example: z.string().optional(),
        })
      )
      .min(1),
  }),
});

const MultipleChoiceSection = z.object({
  ...sectionBase,
  type: z.literal("multiple-choice"),
  content: z.object({
    questions: z
      .array(
        z.object({
          question: z.string().min(1),
          options: z.array(z.string().min(1)).min(2).max(6),
          correctIndex: z.number().int().min(0),
        })
      )
      .min(1),
  }),
});

const OrderingSection = z.object({
  ...sectionBase,
  type: z.literal("ordering"),
  content: z.object({
    items: z.array(z.string().min(1)).min(2),
    correctOrder: z.array(z.number().int()).min(2),
  }),
});

const InstructionsSection = z.object({
  ...sectionBase,
  type: z.literal("instructions"),
  content: z.object({ text: z.string().min(1) }),
});

const ImageDescriptionSection = z.object({
  ...sectionBase,
  type: z.literal("image-description"),
  content: z.object({
    imageUrl: z.string().optional(),
    imagePrompt: z.string().optional(),
    questions: z.array(z.string()).optional(),
  }),
});

const DiscussionSection = z.object({
  ...sectionBase,
  type: z.literal("discussion"),
  content: z.object({ questions: z.array(z.string().min(1)).min(1) }),
});

export const WorksheetSectionSchema = z.discriminatedUnion("type", [
  GapFillSection,
  MatchingSection,
  ReadingPassageSection,
  WritingPromptSection,
  VocabularySection,
  MultipleChoiceSection,
  OrderingSection,
  InstructionsSection,
  ImageDescriptionSection,
  DiscussionSection,
]);

export type ValidatedSection = z.infer<typeof WorksheetSectionSchema>;

/** Cross-field integrity checks a flat object schema can't express. */
function refineSection(s: ValidatedSection, ctx: z.RefinementCtx, index: number) {
  const at = (path: string) => ({ path: [index, "content", path] as (string | number)[] });
  if (s.type === "matching") {
    for (const [l, r] of s.content.correctPairs) {
      if (l < 0 || l >= s.content.leftItems.length || r < 0 || r >= s.content.rightItems.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctPairs index out of range", ...at("correctPairs") });
        break;
      }
    }
  }
  if (s.type === "multiple-choice") {
    s.content.questions.forEach((q, qi) => {
      if (q.correctIndex >= q.options.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `question ${qi} correctIndex out of range`, ...at("questions") });
      }
    });
  }
  if (s.type === "ordering") {
    if (s.content.correctOrder.length !== s.content.items.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "correctOrder length must match items", ...at("correctOrder") });
    }
  }
  if (s.type === "gap-fill") {
    const gaps = (s.content.text.match(/___/g) ?? []).length;
    if (gaps > 0 && gaps !== s.content.answers.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "answers count must match the number of ___ gaps", ...at("answers") });
    }
  }
}

export const WorksheetSectionsArraySchema = z
  .array(WorksheetSectionSchema)
  .min(1)
  .max(12)
  .superRefine((sections, ctx) => {
    sections.forEach((s, i) => refineSection(s, ctx, i));
  });

/** LLM output wrapper — matches GeneratedWorksheet in types/worksheet.ts. */
export const GeneratedWorksheetSchema = z.object({
  title: z.string().min(1),
  sections: WorksheetSectionsArraySchema,
});

export type ValidatedWorksheet = z.infer<typeof GeneratedWorksheetSchema>;
