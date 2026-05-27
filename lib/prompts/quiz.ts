import type { CefrLevel, QuizType } from "@prisma/client";
import { buildIbContextBlock } from "./ibContext";
import type { GenerateQuizInput, QuestionType } from "@/types/quiz";

const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  "multiple-choice": "4 options (A-D), one correct. Test comprehension or vocabulary.",
  "fill-in-blank": "Sentence with ___ gap. One correct answer with optional alternatives.",
  "matching": "Match left column to right (vocabulary, definitions, sentence halves).",
  "listening": "Audio text + 2-3 comprehension sub-questions. Audio will be TTS-generated.",
  "sentence-order": "Jumbled words to arrange into a correct sentence.",
  "image-based": "Image stimulus + multiple choice or label question.",
};

export function buildQuizSystemPrompt(
  cefrLevel: CefrLevel,
  quizType: QuizType
): string {
  const typeContext =
    quizType === "PRE"
      ? "This is a PRE-lesson quiz: activate prior knowledge, introduce key vocabulary, assess baseline. Keep it accessible and low-stakes."
      : "This is a POST-lesson quiz: assess learning outcomes, check comprehension, reinforce vocabulary. Should reflect lesson content directly.";

  return `You are an expert ESL assessment designer for university IB Language B students.
You create Duolingo-style interactive quiz questions calibrated to CEFR level ${cefrLevel}.
${typeContext}
You produce structured JSON only.

${buildIbContextBlock(cefrLevel, [], undefined)}

## Question Design Rules
- All distractors must be plausible (not obviously wrong)
- fill-in-blank sentences must have clear, unambiguous single answers
- listening audioText must be 20-60 words — natural spoken English for the CEFR level
- image-based questions include a detailed imagePrompt for AI generation
- Each question must have a brief explanation for the correct answer`;
}

export function buildQuizUserPrompt(input: GenerateQuizInput): string {
  const typeDescriptions = input.questionTypes
    .map((t) => `- ${t}: ${QUESTION_TYPE_DESCRIPTIONS[t]}`)
    .join("\n");

  return `Generate ${input.questionCount} quiz questions for:

Lesson: ${input.lessonTitle}
Quiz Type: ${input.type} (${input.type === "PRE" ? "before lesson" : "after lesson"})
CEFR Level: ${input.cefrLevel}
Objectives: ${input.objectives.join("; ")}
${input.vocabulary?.length ? `Key vocabulary: ${input.vocabulary.join(", ")}` : ""}

Use these question types (distribute evenly):
${typeDescriptions}

Return JSON: { "questions": [ { "type": string, "prompt": string, "points": number, "cefrLevel": string, "explanation": string, ...type-specific fields } ] }

For multiple-choice: add "options": string[], "correctIndex": number
For fill-in-blank: add "text": string (with ___), "answer": string, "acceptableAnswers": string[]
For matching: add "leftItems": string[], "rightItems": string[], "correctPairs": [number,number][]
For listening: add "audioText": string, "subQuestions": MultipleChoiceQuestion[]
For sentence-order: add "words": string[], "correctOrder": number[]
For image-based: add "imagePrompt": string, "options": string[], "correctIndex": number`;
}
