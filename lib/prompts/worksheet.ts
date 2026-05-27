import type { CefrLevel } from "@prisma/client";
import { buildIbContextBlock } from "./ibContext";
import type { GenerateWorksheetInput, WorksheetSectionType } from "@/types/worksheet";

const SECTION_DESCRIPTIONS: Record<WorksheetSectionType, string> = {
  "instructions": "Clear task header with instructions",
  "gap-fill": "Sentence completion with word bank (use ___ for gaps)",
  "matching": "Two columns to match (definitions, translations, sentence halves)",
  "reading-passage": "Short reading text with comprehension questions",
  "writing-prompt": "Structured writing task with guidance points",
  "vocabulary": "Word list with definitions or translation column",
  "multiple-choice": "Questions with 4 options (A-D)",
  "ordering": "Jumbled words or sentences to reorder",
  "image-description": "Image stimulus with discussion/description questions",
  "discussion": "Discussion questions for pair/group work",
};

export function buildWorksheetSystemPrompt(cefrLevel: CefrLevel): string {
  return `You are an expert ESL materials designer for university IB Language B students.
You create print-ready worksheets calibrated precisely to the CEFR level provided.
All texts, vocabulary, and tasks must be appropriate for ${cefrLevel} students.
You produce structured JSON only — no markdown, no explanation outside JSON.

${buildIbContextBlock(cefrLevel, [], undefined)}`;
}

export function buildWorksheetUserPrompt(input: GenerateWorksheetInput): string {
  const sectionDescriptions = input.sectionTypes
    .map((t) => `- ${t}: ${SECTION_DESCRIPTIONS[t]}`)
    .join("\n");

  return `Create a worksheet for this lesson:

Title: ${input.lessonTitle}
CEFR Level: ${input.cefrLevel}
Objectives: ${input.objectives.join("; ")}
${input.additionalNotes ? `Notes: ${input.additionalNotes}` : ""}

Include these sections:
${sectionDescriptions}

Return JSON: { "title": string, "sections": [ { "id": string, "type": string, "title": string, "instructions": string, "content": object, "points": number } ] }
Use UUID-style strings for section ids.`;
}
