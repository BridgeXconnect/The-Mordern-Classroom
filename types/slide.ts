import type { CefrLevel, SlideType } from "@prisma/client";

export interface SlideContent {
  title: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  imagePrompt?: string;
  imageUrl?: string;
  vocabularyItems?: VocabularyItem[];
  grammarRule?: GrammarRule;
  activityInstructions?: string;
  activityItems?: string[];
  speakerNotes?: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  imagePrompt?: string;
}

export interface GrammarRule {
  rule: string;
  explanation: string;
  examples: string[];
  commonErrors: string[];
}

export interface SlideData {
  id?: string;
  order: number;
  type: SlideType;
  content: SlideContent;
  speakerNotes?: string;
}

export interface GenerateSlidesInput {
  lessonId: string;
  lessonTitle: string;
  objectives: string[];
  cefrLevel: CefrLevel;
  slideCount?: number;
  includeVocabulary?: boolean;
  includeGrammar?: boolean;
  includeActivity?: boolean;
}

export interface GeneratedSlides {
  slides: SlideData[];
}
