import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { chatJSON, cefrLabel, MODELS } from "@/lib/openrouter";
import type { LessonObjective } from "@/types/lesson";
import type { GeneratedWorksheet, WorksheetSectionType } from "@/types/worksheet";
import { v4 as uuid } from "uuid";

const SECTION_TYPES: WorksheetSectionType[] = [
  "reading-passage",
  "gap-fill",
  "vocabulary",
  "multiple-choice",
  "matching",
  "writing-prompt",
  "ordering",
  "discussion",
];

const GenerateSchema = z.object({
  lessonId: z.string().cuid(),
  sectionTypes: z
    .array(z.enum(SECTION_TYPES as [WorksheetSectionType, ...WorksheetSectionType[]]))
    .min(1)
    .max(6)
    .default(["vocabulary", "gap-fill", "reading-passage", "writing-prompt"]),
  additionalNotes: z.string().optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { lessonId, sectionTypes, additionalNotes } = parsed.data;

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { unit: { include: { class: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const objectives = lesson.objectives as unknown as LessonObjective[];
  const cefrLevel = lesson.unit.class.cefrLevel;
  const level = cefrLabel(cefrLevel);

  const sectionInstructions = sectionTypes.map((t) => {
    const schemas: Record<WorksheetSectionType, string> = {
      "reading-passage": `{ type:"reading-passage", title:"...", instructions:"Read the passage and answer the questions.", content:{ passage:"<100–150 word passage>", comprehensionQuestions:[{question:"...",answer:"..."}] } }`,
      "gap-fill": `{ type:"gap-fill", title:"...", instructions:"Fill in the blanks with words from the word bank.", content:{ text:"Sentence with ___ blanks ___.", answers:["word1","word2"], wordBank:["word1","word2","distractor1","distractor2"] } }`,
      "vocabulary": `{ type:"vocabulary", title:"...", instructions:"Match each word to its definition.", content:{ words:[{word:"...",definition:"...",example:"..."}] } }`,
      "multiple-choice": `{ type:"multiple-choice", title:"...", instructions:"Circle the correct answer.", content:{ questions:[{question:"...",options:["a","b","c","d"],correctIndex:0}] } }`,
      "matching": `{ type:"matching", title:"...", instructions:"Match each item in column A with column B.", content:{ leftItems:["..."], rightItems:["..."], correctPairs:[[0,0],[1,1]] } }`,
      "writing-prompt": `{ type:"writing-prompt", title:"...", instructions:"Write your response.", content:{ prompt:"...", minWords:50, maxWords:100, guidancePoints:["Think about...","Include..."] } }`,
      "ordering": `{ type:"ordering", title:"...", instructions:"Put the sentences in the correct order (1–5).", content:{ items:["sentence B","sentence A","sentence C"], correctOrder:[1,0,2] } }`,
      "discussion": `{ type:"discussion", title:"...", instructions:"Discuss with your partner.", content:{ questions:["...","..."] } }`,
      "instructions": `{ type:"instructions", title:"...", content:{ text:"..." } }`,
      "image-description": `{ type:"image-description", title:"...", instructions:"Look at the image and answer.", content:{ imagePrompt:"...", questions:["..."] } }`,
    };
    return schemas[t] ?? `{ type:"${t}", title:"...", content:{} }`;
  });

  const systemPrompt = `You are an expert ESL worksheet designer for IB Language B.
Language level: ${level}
All content MUST be appropriate and achievable for this CEFR level.
Return ONLY valid JSON.`;

  const userPrompt = `Create a printable worksheet for:
Lesson: "${lesson.title}"
Unit: "${lesson.unit.title}"
${additionalNotes ? `Additional notes: ${additionalNotes}` : ""}

Learning objectives:
${objectives.map((o) => `- ${o.skill}: ${o.description}`).join("\n")}

Generate exactly these section types in this order:
${sectionTypes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Each section must follow this schema (use the correct one per type):
${sectionInstructions.join("\n")}

Every section also needs a unique "id" (any string) and optional "points" (number).
All content must be CEFR-appropriate for ${cefrLevel} learners.

Return: { "title": "Worksheet title", "sections": [ ...sections ] }`;

  const generated = await chatJSON<GeneratedWorksheet>(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { model: MODELS.STRUCTURED, temperature: 0.6 }
  );

  // Ensure every section has an id
  const sections = generated.sections.map((s) => ({ ...s, id: s.id ?? uuid() }));

  // Upsert — one worksheet per lesson (replace if exists)
  const existing = await db.worksheet.findFirst({ where: { lessonId } });

  const worksheet = existing
    ? await db.worksheet.update({
        where: { id: existing.id },
        data: { title: generated.title, sections: sections as object[] },
      })
    : await db.worksheet.create({
        data: {
          lessonId,
          title: generated.title,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sections: sections as any,
        },
      });

  return NextResponse.json(worksheet, { status: 201 });
}
