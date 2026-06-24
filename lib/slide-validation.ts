import { z } from "zod";

/**
 * Zod schema for LLM-generated slide decks. Used by /api/generate/slides to enforce
 * the shape (via generateObject) before persisting, where previously there was none.
 *
 * Derived from types/slide.ts. SlideContent is a single flat bag of optional fields
 * (not a discriminated union), so per-type requirements (a VOCABULARY slide must carry
 * vocabularyItems, etc.) are enforced via superRefine on the wrapping array rather than
 * per-member schemas — same convention as lib/quiz-validation.ts.
 */

const SlideTypeEnum = z.enum(["TITLE", "CONTENT", "VOCABULARY", "GRAMMAR", "ACTIVITY"]);

const VocabularyItemSchema = z.object({
  word: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1),
  partOfSpeech: z.string().min(1),
  imagePrompt: z.string().optional(),
});

const GrammarRuleSchema = z.object({
  rule: z.string().min(1),
  explanation: z.string().min(1),
  examples: z.array(z.string().min(1)),
  commonErrors: z.array(z.string()),
});

const SlideContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  bullets: z.array(z.string().min(1)).optional(),
  body: z.string().optional(),
  imagePrompt: z.string().optional(),
  imageUrl: z.string().optional(),
  vocabularyItems: z.array(VocabularyItemSchema).optional(),
  grammarRule: GrammarRuleSchema.optional(),
  activityInstructions: z.string().optional(),
  activityItems: z.array(z.string().min(1)).optional(),
  speakerNotes: z.string().optional(),
});

const SlideSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(0),
  type: SlideTypeEnum,
  content: SlideContentSchema,
  speakerNotes: z.string().optional(),
});

export type ValidatedSlide = z.infer<typeof SlideSchema>;

/** Per-type content checks the flat object schema can't express. */
function refineSlide(slide: ValidatedSlide, ctx: z.RefinementCtx, index: number) {
  const at = (path: string) => ({ path: [index, "content", path] as (string | number)[] });
  const c = slide.content;
  switch (slide.type) {
    case "VOCABULARY":
      if (!c.vocabularyItems || c.vocabularyItems.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "VOCABULARY slide requires vocabularyItems", ...at("vocabularyItems") });
      }
      break;
    case "GRAMMAR":
      if (!c.grammarRule) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "GRAMMAR slide requires grammarRule", ...at("grammarRule") });
      }
      break;
    case "ACTIVITY":
      if (!c.activityItems || c.activityItems.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ACTIVITY slide requires activityItems", ...at("activityItems") });
      }
      break;
    case "CONTENT":
      if ((!c.bullets || c.bullets.length === 0) && !c.body) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CONTENT slide requires bullets or body", ...at("bullets") });
      }
      break;
    // TITLE only needs a title, already required by SlideContentSchema.
  }
}

export const SlidesArraySchema = z
  .array(SlideSchema)
  .min(1)
  .max(20)
  .superRefine((slides, ctx) => {
    slides.forEach((s, i) => refineSlide(s, ctx, i));
  });

/** LLM output wrapper — matches GeneratedSlides in types/slide.ts. */
export const GeneratedSlidesSchema = z.object({
  slides: SlidesArraySchema,
});

export type ValidatedSlides = z.infer<typeof GeneratedSlidesSchema>;
