import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { NoObjectGeneratedError } from "ai";
import { generateStructured, cefrLabel, MODELS } from "@/lib/openrouter";
import { ownedClass } from "@/lib/ownership";

// maxDuration: 60 — set in vercel.json (LLM generation can be slow)

const BodySchema = z.object({
  prompt: z.string().min(3).max(2000),
  classId: z.string().cuid(),
  duration: z.number().int().min(15).max(300).default(45),
});

const AngleSchema = z.object({
  title: z.string().min(1),
  blurb: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1).max(4),
  fit: z.string().min(1),
  // IB framing — drives Unit + lesson-plan creation when the teacher picks an angle.
  ibTheme: z.string().min(1),
  ibTextTypes: z.array(z.string().min(1)).min(1).max(5),
  atlSkills: z
    .array(z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"]))
    .min(1)
    .max(5),
});

const AnglesSchema = z.object({ angles: z.array(AngleSchema).length(3) });

/**
 * POST /api/generate/angles
 * Proposes three distinct teaching directions for a freeform Copilot prompt.
 * Nothing is persisted — the teacher hasn't committed to anything yet (same as quiz gen).
 * Each angle carries IB framing so picking one can scaffold a real Unit + Lesson.
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, classId, duration } = parsed.data;

  // Ownership: the target class must belong to the caller.
  const cls = await ownedClass(classId, userId);
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const level = cefrLabel(cls.cefrLevel);

  const system = `You are an expert IB Language B (ESL) curriculum designer.
Propose exactly three DISTINCT teaching directions ("angles") for the teacher's idea.
Target language level: ${level}. Every proposal must be achievable at this CEFR level.
For each angle also choose IB framing: an IB global-context theme (ibTheme), 1–3 IB text
types (ibTextTypes), and the most relevant ATL skills (atlSkills) drawn ONLY from
COMMUNICATION, THINKING, RESEARCH, SOCIAL, SELF_MANAGEMENT.`;

  const user = `Teacher's idea: "${prompt}"
Class: ${cls.name} (${cls.cefrLevel}). Lesson length: ${duration} minutes.

For each of the three angles provide: a short title, a one-sentence blurb describing the
approach, 2–3 human-readable skills, a one-line "fit" rationale, and the IB framing fields.`;

  try {
    const { angles } = await generateStructured(AnglesSchema, system, user, {
      model: MODELS.DEFAULT,
      temperature: 0.8,
    });
    return NextResponse.json({ angles });
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      console.error("Angle generation failed validation:", err);
      return NextResponse.json({ error: "Could not propose directions. Try rephrasing." }, { status: 422 });
    }
    console.error("Angle generation LLM call failed:", err);
    return NextResponse.json({ error: "Angle generation failed" }, { status: 502 });
  }
}
