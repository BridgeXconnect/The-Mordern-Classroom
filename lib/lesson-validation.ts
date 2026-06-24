import { z } from "zod";

/**
 * Zod schema for LLM-generated lesson plans. Used by /api/generate/lesson to enforce
 * the shape (via generateObject) before returning the plan to the client.
 *
 * Derived from types/lesson.ts (GeneratedLessonPlan and its nested types). No
 * discriminated unions are needed here — the plan is a fixed-shape object.
 */

const AtlSkillEnum = z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"]);

const LessonObjectiveSchema = z.object({
  skill: z.enum(["reading", "writing", "listening", "speaking", "vocabulary", "grammar"]),
  description: z.string().min(1),
  cefrDescriptor: z.string().min(1),
});

const LessonStageSchema = z.object({
  name: z.enum(["warm-up", "presentation", "practice", "production", "reflection"]),
  duration: z.number().int().min(1),
  teacherActivity: z.string().min(1),
  studentActivity: z.string().min(1),
  materials: z.array(z.string()),
  atlFocus: AtlSkillEnum.optional(),
});

const IbAlignmentSchema = z.object({
  phase: z.string().min(1),
  receptiveSkills: z.array(z.string()),
  productiveSkills: z.array(z.string()),
  atlSkills: z.array(AtlSkillEnum),
  globalContext: z.string().min(1),
  conceptualUnderstandings: z.array(z.string()),
});

/** Matches GeneratedLessonPlan in types/lesson.ts. */
export const GeneratedLessonPlanSchema = z.object({
  title: z.string().min(1),
  objectives: z.array(LessonObjectiveSchema).min(1),
  stages: z.array(LessonStageSchema).min(1),
  ibAlignment: IbAlignmentSchema,
  vocabulary: z.array(z.string()),
  assessmentIdeas: z.array(z.string()),
  differentiationSuggestions: z.object({
    support: z.array(z.string()),
    extension: z.array(z.string()),
  }),
});

export type ValidatedLessonPlan = z.infer<typeof GeneratedLessonPlanSchema>;
