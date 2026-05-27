import type { CefrLevel, QuizType } from "@prisma/client";

export type QuestionType =
  | "multiple-choice"
  | "fill-in-blank"
  | "matching"
  | "listening"
  | "sentence-order"
  | "image-based";

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  cefrLevel: CefrLevel;
  explanation?: string; // shown after answer
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
  correctIndex: number;
}

export interface FillInBlankQuestion extends BaseQuestion {
  type: "fill-in-blank";
  text: string; // sentence with ___ for blank
  answer: string;
  acceptableAnswers?: string[]; // alternate correct answers
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  leftItems: string[];
  rightItems: string[];
  correctPairs: [number, number][];
}

export interface ListeningQuestion extends BaseQuestion {
  type: "listening";
  audioUrl?: string; // pre-generated via Google TTS, stored in R2
  audioText: string; // source text for TTS generation
  subQuestions: MultipleChoiceQuestion[];
}

export interface SentenceOrderQuestion extends BaseQuestion {
  type: "sentence-order";
  words: string[];
  correctOrder: number[];
}

export interface ImageBasedQuestion extends BaseQuestion {
  type: "image-based";
  imageUrl?: string;
  imagePrompt?: string; // for generation if imageUrl not set
  options: string[];
  correctIndex: number;
}

export type QuizQuestion =
  | MultipleChoiceQuestion
  | FillInBlankQuestion
  | MatchingQuestion
  | ListeningQuestion
  | SentenceOrderQuestion
  | ImageBasedQuestion;

export interface QuizData {
  id: string;
  lessonId: string;
  type: QuizType;
  shareToken: string;
  cefrLevel: CefrLevel;
  questions: QuizQuestion[];
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface QuizAttemptAnswer {
  questionId: string;
  answer: unknown;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface QuizSubmission {
  quizId: string;
  studentAlias?: string;
  answers: QuizAttemptAnswer[];
}

export interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  answers: QuizAttemptAnswer[];
}

export interface GenerateQuizInput {
  lessonId: string;
  lessonTitle: string;
  objectives: string[];
  cefrLevel: CefrLevel;
  type: QuizType;
  questionTypes: QuestionType[];
  questionCount: number;
  vocabulary?: string[];
}

export interface GeneratedQuiz {
  questions: Omit<QuizQuestion, "id">[];
}
