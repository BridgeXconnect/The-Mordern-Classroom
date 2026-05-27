import type { CefrLevel } from "@prisma/client";

export type WorksheetSectionType =
  | "instructions"
  | "gap-fill"
  | "matching"
  | "reading-passage"
  | "writing-prompt"
  | "vocabulary"
  | "multiple-choice"
  | "ordering"
  | "image-description"
  | "discussion";

export interface WorksheetSection {
  id: string;
  type: WorksheetSectionType;
  title: string;
  instructions?: string;
  content: WorksheetSectionContent;
  points?: number;
}

export type WorksheetSectionContent =
  | GapFillContent
  | MatchingContent
  | ReadingPassageContent
  | WritingPromptContent
  | VocabularyContent
  | MultipleChoiceContent
  | OrderingContent
  | InstructionsContent
  | ImageDescriptionContent
  | DiscussionContent;

export interface GapFillContent {
  text: string; // Use ___ for gaps
  answers: string[];
  wordBank?: string[];
}

export interface MatchingContent {
  leftItems: string[];
  rightItems: string[];
  correctPairs: [number, number][]; // [leftIndex, rightIndex]
}

export interface ReadingPassageContent {
  passage: string;
  comprehensionQuestions: { question: string; answer?: string }[];
}

export interface WritingPromptContent {
  prompt: string;
  minWords?: number;
  maxWords?: number;
  guidancePoints?: string[];
}

export interface VocabularyContent {
  words: { word: string; definition?: string; example?: string }[];
}

export interface MultipleChoiceContent {
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
}

export interface OrderingContent {
  items: string[];
  correctOrder: number[];
}

export interface InstructionsContent {
  text: string;
}

export interface ImageDescriptionContent {
  imageUrl?: string;
  imagePrompt?: string;
  questions?: string[];
}

export interface DiscussionContent {
  questions: string[];
}

export interface GenerateWorksheetInput {
  lessonId: string;
  lessonTitle: string;
  objectives: string[];
  cefrLevel: CefrLevel;
  sectionTypes: WorksheetSectionType[];
  additionalNotes?: string;
}

export interface GeneratedWorksheet {
  title: string;
  sections: WorksheetSection[];
}
