import OpenAI from "openai";
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

// Model presets — all LLM model decisions are made here
export const MODELS = {
  // Fast, cheap, long context — default for most generation
  DEFAULT: "google/gemini-2.0-flash-001",
  // Best instruction-following for CEFR-controlled output
  CEFR: "anthropic/claude-3-5-haiku",
  // Reliable JSON mode for structured quiz generation
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
