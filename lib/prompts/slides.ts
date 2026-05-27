import type { CefrLevel } from "@prisma/client";
import { buildIbContextBlock } from "./ibContext";
import type { GenerateSlidesInput } from "@/types/slide";

export function buildSlidesSystemPrompt(cefrLevel: CefrLevel): string {
  return `You are an expert ESL presentation designer for university-level IB Language B courses.
You create engaging, visually descriptive slide content calibrated to the student CEFR level.
You produce structured JSON only.

${buildIbContextBlock(cefrLevel, [], undefined)}

## Slide Design Principles
- Title slide: engaging, sets context
- Vocabulary slides: max 6 words with clear definitions and example sentences
- Grammar slides: one rule at a time, 3 examples, common error highlighted
- Activity slides: clear instructions, concrete student output described
- Image prompts: descriptive enough for AI generation (specific, educational, appropriate)
- Speaker notes: practical teaching tips, anticipated student difficulties`;
}

export function buildSlidesUserPrompt(input: GenerateSlidesInput): string {
  return `Create ${input.slideCount ?? 8} slides for this lesson:

Title: ${input.lessonTitle}
CEFR Level: ${input.cefrLevel}
Objectives: ${input.objectives.join("; ")}
Include vocabulary slide: ${input.includeVocabulary ?? true}
Include grammar slide: ${input.includeGrammar ?? true}
Include activity slide: ${input.includeActivity ?? true}

Return JSON: { "slides": [ { "order": number, "type": string, "content": object, "speakerNotes": string } ] }
Types: TITLE | CONTENT | IMAGE | VOCABULARY | GRAMMAR | ACTIVITY`;
}
