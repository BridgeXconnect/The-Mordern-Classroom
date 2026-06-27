import type { AtlSkill, CefrLevel } from "@prisma/client";
import { buildIbContextBlock } from "./ibContext";
import type { GenerateLessonPlanInput } from "@/types/lesson";

export function buildLessonPlanSystemPrompt(
  cefrLevel: CefrLevel,
  atlSkills: AtlSkill[],
  ibTheme: string
): string {
  return `You are an expert ESL curriculum designer writing TEACHER-FACING lesson plans for
in-class delivery. Your plans read like a script a teacher follows live — detailed enough
that a substitute could pick it up and run the lesson.

${buildIbContextBlock(cefrLevel, atlSkills, ibTheme)}

## House style (very important — this is what makes the plan usable)
Write each activity with the depth of a professional communicative ESL lesson plan:
- **Scripted**: give the EXACT words the teacher says and the exact responses to elicit from
  students. e.g. "Hold up the picture and ask: 'What's this?' Elicit: 'It's a sandwich.'
  Insist on a full sentence, not a one-word answer."
- **Sequenced steps**: break each activity into ordered, concrete instructions (what the teacher
  does and says, what students do), not a one-line summary.
- **Realistic timing**: every activity has a duration in minutes; the activity durations sum to
  the total lesson duration.
- **Teaching tips**: include contingencies — what to do with a single student, a strong/weak
  class, common errors to watch for.
- **Extension**: where useful, add an optional extra/challenge activity.
- Group activities into clear sections: typically Warm-Up → Target Language → Target Structures
  → Communication/Practice → Wrap-Up.
- All language MUST be appropriate for the CEFR level. Targets use can-do phrasing.

## Output
Return ONLY a single valid JSON object matching the requested structure. No markdown, no prose
outside the JSON.`;
}

export function buildLessonPlanUserPrompt(input: GenerateLessonPlanInput): string {
  return `Create a complete, scripted lesson plan with these parameters:

Title: ${input.title}
Duration: ${input.duration} minutes (activity durations must sum to this)
CEFR Level: ${input.cefrLevel}
IB Global Context: ${input.ibTheme}
IB Text Types: ${input.ibTextTypes.join(", ")}
ATL Skills: ${input.atlSkills.join(", ")}
${input.additionalNotes ? `Additional Notes / chosen direction: ${input.additionalNotes}` : ""}

Return a JSON object with EXACTLY this structure:
{
  "title": string,
  "summary": string,                          // 2–3 sentences describing the lesson arc
  "objectives": [                             // concise lesson objectives
    { "skill": "reading"|"writing"|"listening"|"speaking"|"vocabulary"|"grammar", "description": string, "cefrDescriptor": string }
  ],
  "targets": {                                // CEFR can-do targets, grouped
    "vocabulary": string[],                   // e.g. "Can name common foods (sandwich, coffee…)"
    "grammar": string[],                      // e.g. "Can use some/any with countable nouns"
    "skills": string[]                        // speaking/listening/reading/writing can-do
  },
  "materials": string[],                      // everything the teacher needs for the whole lesson
  "activities": [                             // 4–7 ordered, scripted activities
    {
      "section": string,                      // "Warm-Up" | "Target Language" | "Target Structures" | "Communication" | "Wrap-Up"
      "title": string,                        // short activity name
      "durationMin": number,
      "objectives": string[],                 // can-do statements this activity targets
      "materials": string[],
      "contextSetup": string,                 // scripted set-up / context creation (teacher script). "" if none
      "steps": string[],                      // 3–8 detailed, scripted instructions in order — include exact teacher phrases and elicited responses
      "teachingTips": string[],               // contingencies; [] if none
      "extension": string                     // optional extra activity; "" if none
    }
  ],
  "ibAlignment": {
    "phase": string,
    "receptiveSkills": string[],
    "productiveSkills": string[],
    "atlSkills": string[],                     // from COMMUNICATION, THINKING, RESEARCH, SOCIAL, SELF_MANAGEMENT
    "globalContext": string,
    "conceptualUnderstandings": string[]
  }
}

Make the "steps" genuinely scripted and verbose — this is the part the teacher reads during the lesson.`;
}
