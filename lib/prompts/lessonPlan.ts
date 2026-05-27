import type { AtlSkill, CefrLevel } from "@prisma/client";
import { buildIbContextBlock } from "./ibContext";
import type { GenerateLessonPlanInput } from "@/types/lesson";

export function buildLessonPlanSystemPrompt(
  cefrLevel: CefrLevel,
  atlSkills: AtlSkill[],
  ibTheme: string
): string {
  return `You are an expert IB Language B ESL curriculum designer for university students.
Your role is to create detailed, pedagogically sound lesson plans aligned to the IB Language B framework.
You produce structured JSON only — no markdown, no explanation outside the JSON object.

${buildIbContextBlock(cefrLevel, atlSkills, ibTheme)}

## Output Requirements
- Produce valid JSON matching the GeneratedLessonPlan type exactly
- Objectives must include CEFR can-do descriptors
- Each stage must have realistic timing that sums to the total duration
- Vocabulary should be appropriate and useful for the CEFR level
- Differentiation suggestions must be genuinely different, not just "easier/harder"`;
}

export function buildLessonPlanUserPrompt(input: GenerateLessonPlanInput): string {
  return `Create a lesson plan with the following parameters:

Title: ${input.title}
Duration: ${input.duration} minutes
CEFR Level: ${input.cefrLevel}
IB Global Context: ${input.ibTheme}
IB Text Types: ${input.ibTextTypes.join(", ")}
ATL Skills: ${input.atlSkills.join(", ")}
${input.additionalNotes ? `Additional Notes: ${input.additionalNotes}` : ""}

Return a JSON object with this exact structure:
{
  "title": string,
  "objectives": [{ "skill": string, "description": string, "cefrDescriptor": string }],
  "stages": [{ "name": string, "duration": number, "teacherActivity": string, "studentActivity": string, "materials": string[], "atlFocus": string | null }],
  "ibAlignment": { "phase": string, "receptiveSkills": string[], "productiveSkills": string[], "atlSkills": string[], "globalContext": string, "conceptualUnderstandings": string[] },
  "vocabulary": string[],
  "assessmentIdeas": string[],
  "differentiationSuggestions": { "support": string[], "extension": string[] }
}`;
}
