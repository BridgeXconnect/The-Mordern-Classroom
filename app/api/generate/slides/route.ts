import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { NoObjectGeneratedError } from "ai";
import { generateStructured, cefrLabel, MODELS } from "@/lib/openrouter";
import { GeneratedSlidesSchema } from "@/lib/slide-validation";
import type { LessonObjective } from "@/types/lesson";

const GenerateSlidesSchema = z.object({
  lessonId: z.string().cuid(),
  slideCount: z.number().int().min(4).max(20).default(8),
  includeVocabulary: z.boolean().default(true),
  includeGrammar: z.boolean().default(false),
  includeActivity: z.boolean().default(true),
  additionalNotes: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = GenerateSlidesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lessonId, slideCount, includeVocabulary, includeGrammar, includeActivity, additionalNotes } = parsed.data;

  // Fetch lesson context
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, unit: { class: { clerkUserId: userId } } },
    include: { unit: { include: { class: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const objectives = lesson.objectives as unknown as LessonObjective[];
  const cefrLevel = lesson.unit.class.cefrLevel;
  const level = cefrLabel(cefrLevel);

  const optionalTypes: string[] = [];
  if (includeVocabulary) optionalTypes.push("VOCABULARY (1–2 slides with word, definition, example, partOfSpeech)");
  if (includeGrammar) optionalTypes.push("GRAMMAR (1 slide with rule, explanation, examples, commonErrors)");
  if (includeActivity) optionalTypes.push("ACTIVITY (1–2 slides with activityInstructions and activityItems list)");

  const systemPrompt = `You are an expert ESL curriculum designer creating IB Language B slide decks.
Language level: ${level}
All content MUST be appropriate for this CEFR level — vocabulary, sentence complexity, and concept depth.
Return ONLY valid JSON matching the schema exactly.`;

  const userPrompt = `Create a ${slideCount}-slide presentation for:
Lesson: "${lesson.title}"
Unit: "${lesson.unit.title}"
Duration: ${lesson.duration} minutes${additionalNotes ? `\n\nSpecific guidance: ${additionalNotes}` : ""}

Learning objectives:
${objectives.map((o) => `- ${o.skill}: ${o.description}`).join("\n")}

Slide types to include (in this order):
1. TITLE slide (always first)
2. CONTENT slides (main lesson content, bullet points)
${optionalTypes.map((t, i) => `${i + 3}. ${t}`).join("\n")}
Last. CONTENT slide (wrap-up / reflection questions)

For each slide return this JSON structure:
{
  "order": number (0-indexed),
  "type": "TITLE" | "CONTENT" | "VOCABULARY" | "GRAMMAR" | "ACTIVITY",
  "content": {
    "title": string,
    "subtitle": string (optional, for TITLE slides),
    "bullets": string[] (optional, for CONTENT slides — max 5 bullets, CEFR-appropriate),
    "body": string (optional, short paragraph),
    "vocabularyItems": [{ "word": string, "definition": string, "example": string, "partOfSpeech": string }] (for VOCABULARY),
    "grammarRule": { "rule": string, "explanation": string, "examples": string[], "commonErrors": string[] } (for GRAMMAR),
    "activityInstructions": string (for ACTIVITY),
    "activityItems": string[] (for ACTIVITY — tasks or questions)
  },
  "speakerNotes": string (teacher guidance, 1–3 sentences)
}

Return: { "slides": [ ...slide objects ] }`;

  let generated;
  try {
    generated = await generateStructured(
      GeneratedSlidesSchema,
      systemPrompt,
      userPrompt,
      { model: MODELS.STRUCTURED, temperature: 0.7 }
    );
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("Generated slides failed validation:", err);
      return NextResponse.json(
        { error: "Generated slides did not match the expected format. Try again." },
        { status: 422 }
      );
    }
    console.error("Slide generation LLM call failed:", err);
    return NextResponse.json({ error: "Slide generation failed" }, { status: 502 });
  }

  // Delete existing slides for this lesson
  await db.slide.deleteMany({ where: { lessonId } });

  // Save new slides
  const saved = await db.$transaction(
    generated.slides.map((slide, i) =>
      db.slide.create({
        data: {
          lessonId,
          order: i,
          type: slide.type,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: slide.content as any,
          speakerNotes: slide.speakerNotes ?? null,
        },
      })
    )
  );

  revalidatePath("/library");
  return NextResponse.json(saved, { status: 201 });
}
