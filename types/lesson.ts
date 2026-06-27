import type { AtlSkill, CefrLevel } from "@prisma/client";

export interface IbAlignment {
  phase: string;
  receptiveSkills: string[];
  productiveSkills: string[];
  atlSkills: AtlSkill[];
  globalContext: string;
  conceptualUnderstandings: string[];
}

export interface LessonObjective {
  skill: "reading" | "writing" | "listening" | "speaking" | "vocabulary" | "grammar";
  description: string;
  cefrDescriptor: string;
}

export interface LessonStage {
  name: "warm-up" | "presentation" | "practice" | "production" | "reflection";
  duration: number; // minutes
  teacherActivity: string;
  studentActivity: string;
  materials: string[];
  atlFocus?: AtlSkill;
}

export interface GenerateLessonPlanInput {
  title: string;
  unitId: string;
  cefrLevel: CefrLevel;
  duration: number; // minutes
  ibTheme: string;
  ibTextTypes: string[];
  atlSkills: AtlSkill[];
  additionalNotes?: string;
}

/** CEFR "can-do" targets, grouped (modelled on the WSE Encounter target sections). */
export interface LessonTargets {
  vocabulary: string[];
  grammar: string[];
  skills: string[]; // speaking / reading / listening / writing can-do statements
}

/**
 * A single teachable activity with the scripted depth a teacher uses live —
 * modelled on the WSE Encounter format (Objectives / Context Creation /
 * Instructions / Teaching Tips / Extension).
 */
export interface PlanActivity {
  section: string;        // grouping label, e.g. "Warm-Up", "Target Language", "Communication", "Wrap-Up"
  title: string;          // e.g. "Memory Game", "Food and Drink"
  durationMin: number;
  objectives: string[];   // can-do statements this activity targets
  materials: string[];
  contextSetup: string;   // scripted context creation / set-up (teacher script; "" if none)
  steps: string[];        // detailed, scripted teacher instructions (what to say/do), in order
  teachingTips: string[]; // contingencies (e.g. "If you have one Student…")
  extension: string;      // optional extra/challenge activity ("" if none)
}

export interface GeneratedLessonPlan {
  title: string;
  summary: string;                // short overview of the lesson arc
  objectives: LessonObjective[];  // retained for downstream slide/quiz generation
  targets: LessonTargets;
  materials: string[];            // overall materials needed for the lesson
  activities: PlanActivity[];     // ordered, scripted activities (grouped by `section`)
  ibAlignment: IbAlignment;
}

/** Persisted plan body — the rich fields stored on Lesson.plan (Json). */
export interface LessonPlanBody {
  summary: string;
  targets: LessonTargets;
  materials: string[];
  activities: PlanActivity[];
}
