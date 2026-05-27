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

export interface GeneratedLessonPlan {
  title: string;
  objectives: LessonObjective[];
  stages: LessonStage[];
  ibAlignment: IbAlignment;
  vocabulary: string[];
  assessmentIdeas: string[];
  differentiationSuggestions: {
    support: string[];
    extension: string[];
  };
}
