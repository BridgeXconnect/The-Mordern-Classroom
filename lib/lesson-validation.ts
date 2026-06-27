import { z } from "zod";

/**
 * Zod schema for LLM-generated lesson plans, validated client-side by
 * `generateStructured` (provider-agnostic — no JSON-Schema is sent to the model,
 * so optional/nested fields are fine). Derived from types/lesson.ts.
 *
 * The plan is modelled on the WSE "Encounter" format: scripted, teacher-facing
 * activities (Objectives / Context Creation / Instructions / Teaching Tips /
 * Extension) plus CEFR can-do targets and an IB alignment block.
 */

const AtlSkillEnum = z.enum(["COMMUNICATION", "THINKING", "RESEARCH", "SOCIAL", "SELF_MANAGEMENT"]);

const LessonObjectiveSchema = z.object({
  skill: z.enum(["reading", "writing", "listening", "speaking", "vocabulary", "grammar"]),
  description: z.string().min(1),
  cefrDescriptor: z.string().min(1),
});

const LessonTargetsSchema = z.object({
  vocabulary: z.array(z.string()),
  grammar: z.array(z.string()),
  skills: z.array(z.string()),
});

const PlanActivitySchema = z.object({
  section: z.string().min(1),
  title: z.string().min(1),
  durationMin: z.number().int().min(1),
  objectives: z.array(z.string()),
  materials: z.array(z.string()),
  contextSetup: z.string().default(""),
  steps: z.array(z.string().min(1)).min(1),
  teachingTips: z.array(z.string()).default([]),
  extension: z.string().default(""),
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
  summary: z.string().min(1),
  objectives: z.array(LessonObjectiveSchema).min(1),
  targets: LessonTargetsSchema,
  materials: z.array(z.string()),
  activities: z.array(PlanActivitySchema).min(1),
  ibAlignment: IbAlignmentSchema,
});

export type ValidatedLessonPlan = z.infer<typeof GeneratedLessonPlanSchema>;

/** The rich body persisted to Lesson.plan (Json). */
export const LessonPlanBodySchema = z.object({
  summary: z.string(),
  targets: LessonTargetsSchema,
  materials: z.array(z.string()),
  activities: z.array(PlanActivitySchema),
});
