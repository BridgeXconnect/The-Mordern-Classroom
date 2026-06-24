import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { NoObjectGeneratedError } from "ai";
import { generateStructured, MODELS } from "@/lib/openrouter";
import { buildQuizSystemPrompt, buildQuizUserPrompt } from "@/lib/prompts/quiz";
import { GeneratedQuizSchema } from "@/lib/quiz-validation";
import type { GenerateQuizInput } from "@/types/quiz";
import type { LessonObjective } from "@/types/lesson";

// maxDuration: 60 — set in vercel.json (LLM generation can be slow)

const QUESTION_TYPES = [
  "multiple-choice",
  "fill-in-blank",
  "matching",
  "listening",
  "sentence-order",
  "image-based",
] as const;

const Schema = z.object({
  lessonId:      z.string().cuid(),
  type:          z.enum(["PRE", "POST"]),
  questionTypes: z.array(z.enum(QUESTION_TYPES)).min(1).max(6),
  questionCount: z.number().int().min(3).max(20).default(6),
  vocabulary:    z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { lessonId, type, questionTypes, questionCount, vocabulary } = parsed.data;

  // ── Fetch lesson context ──────────────────────────────────────────────────
  const lesson = await db.lesson.findFirst({
    where: { id: lessonId, unit: { class: { clerkUserId: userId } } },
    include: { unit: { include: { class: true } } },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const objectives = (lesson.objectives as unknown as LessonObjective[]) ?? [];
  const cefrLevel = lesson.unit.class.cefrLevel;

  const input: GenerateQuizInput = {
    lessonId,
    lessonTitle: lesson.title,
    objectives: objectives.map((o) => `${o.skill}: ${o.description}`),
    cefrLevel,
    type,
    questionTypes,
    questionCount,
    vocabulary,
  };

  // ── Generate via LLM with schema enforcement (generateObject) ─────────────
  let result;
  try {
    result = await generateStructured(
      GeneratedQuizSchema,
      buildQuizSystemPrompt(cefrLevel, type),
      buildQuizUserPrompt(input),
      { model: MODELS.STRUCTURED, temperature: 0.6, maxOutputTokens: 6000 }
    );
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("Generated quiz failed validation:", err);
      return NextResponse.json(
        { error: "Generated quiz did not match the expected format. Try again." },
        { status: 422 }
      );
    }
    console.error("Quiz generation LLM call failed:", err);
    return NextResponse.json({ error: "Quiz generation failed" }, { status: 502 });
  }

  // Not persisted yet — teacher reviews, then saves via POST /api/quizzes.
  return NextResponse.json(
    { lessonId, type, cefrLevel, questions: result.questions },
    { status: 200 }
  );
}
