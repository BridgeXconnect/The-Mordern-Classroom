import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { chatJSON, MODELS } from "@/lib/openrouter";
import { buildLessonPlanSystemPrompt, buildLessonPlanUserPrompt } from "@/lib/prompts/lessonPlan";
import type { GenerateLessonPlanInput, GeneratedLessonPlan } from "@/types/lesson";

const GenerateSchema = z.object({
  title: z.string().min(1).max(200),
  unitId: z.string().cuid(),
  cefrLevel: z.enum(["L1", "A1", "A2", "B1", "B2"]),
  duration: z.number().int().min(15).max(300),
  ibTheme: z.string().min(1).max(100),
  ibTextTypes: z.array(z.string()).min(1),
  atlSkills: z.array(z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"])).min(1),
  additionalNotes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data as GenerateLessonPlanInput;

  const plan = await chatJSON<GeneratedLessonPlan>(
    [
      { role: "system", content: buildLessonPlanSystemPrompt(input.cefrLevel, input.atlSkills, input.ibTheme) },
      { role: "user", content: buildLessonPlanUserPrompt(input) },
    ],
    { model: MODELS.CEFR, temperature: 0.6, maxTokens: 4096 }
  );

  return NextResponse.json(plan);
}
