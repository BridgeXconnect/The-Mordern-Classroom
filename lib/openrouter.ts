import OpenAI from "openai";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { z } from "zod";
import type { CefrLevel } from "@prisma/client";

// Lazy client — avoids module-level instantiation failing at build time
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY ?? "missing",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Modern Classroom",
      },
    });
  }
  return _client;
}

// Lazy OpenRouter provider for the Vercel AI SDK (generateObject path).
let _openrouter: ReturnType<typeof createOpenRouter> | null = null;
function getOpenRouter() {
  if (!_openrouter) {
    _openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY ?? "missing",
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "Modern Classroom",
      },
    });
  }
  return _openrouter;
}

// Model presets — all LLM model decisions are made here.
// These stay plain OpenRouter model-id strings: `chat`/`chatJSON` pass them to the
// OpenAI-compatible client, and `generateStructured` resolves them via the AI SDK
// provider at call time (`getOpenRouter()(model)`).
export const MODELS = {
  // Fast, cheap, long context — default for most generation
  DEFAULT: "google/gemini-2.0-flash-001",
  // Best instruction-following for CEFR-controlled output
  CEFR: "anthropic/claude-3-5-haiku",
  // Reliable structured output for quiz/slides/worksheet generation
  STRUCTURED: "openai/gpt-4o-mini",
} as const;

export type ModelKey = keyof typeof MODELS;

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Core chat completion — all LLM calls in this app go through here.
 */
export async function chat(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const {
    model = MODELS.DEFAULT,
    temperature = 0.7,
    maxTokens = 4096,
    jsonMode = false,
  } = options;

  const response = await getClient().chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("LLM returned empty response");
  return content;
}

/**
 * Convenience: generate structured JSON output.
 * Always uses STRUCTURED model (gpt-4o-mini) for reliable JSON mode.
 */
export async function chatJSON<T>(
  messages: LLMMessage[],
  options: Omit<LLMOptions, "jsonMode"> = {}
): Promise<T> {
  const raw = await chat(messages, {
    ...options,
    model: options.model ?? MODELS.STRUCTURED,
    jsonMode: true,
  });
  return JSON.parse(raw) as T;
}

export interface StructuredOptions {
  /** OpenRouter model id (default: MODELS.STRUCTURED). */
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Generate a schema-validated object via the Vercel AI SDK's `generateObject`.
 *
 * Unlike `chatJSON` (which JSON.parses without validation), this enforces `schema`
 * at the SDK level — malformed model output throws `NoObjectGeneratedError` instead
 * of silently persisting. Used by the /api/generate/* routes.
 */
export async function generateStructured<T>(
  schema: z.ZodSchema<T>,
  systemPrompt: string,
  userPrompt: string,
  options: StructuredOptions = {}
): Promise<T> {
  const { model = MODELS.STRUCTURED, temperature = 0.6, maxOutputTokens } = options;

  const { object } = await generateObject({
    model: getOpenRouter()(model),
    schema,
    system: systemPrompt,
    prompt: userPrompt,
    temperature,
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
  });

  return object;
}

/**
 * Get a human-readable CEFR level label for use in prompts.
 */
export function cefrLabel(level: CefrLevel): string {
  const labels: Record<CefrLevel, string> = {
    L1: "Pre-A1 / Literacy Level 1 (complete beginner, limited or no prior English)",
    A1: "A1 Beginner (very basic phrases and expressions)",
    A2: "A2 Elementary (simple, direct exchanges on familiar topics)",
    B1: "B1 Intermediate (can handle most situations while travelling, describe experiences)",
    B2: "B2 Upper-Intermediate (can understand complex text, interact with fluency)",
  };
  return labels[level];
}
