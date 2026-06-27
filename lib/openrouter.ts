import OpenAI from "openai";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { zodToJsonSchema } from "zod-to-json-schema";
import { jsonrepair } from "jsonrepair";
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
// NOTE: all three currently point at gpt-5.4-mini. It is the only model (of the ones
// we tested via OpenRouter) that reliably returns clean, valid JSON for generation —
// gemini and claude intermittently emit unescaped control characters (invalid JSON) or
// upstream `finish_reason: error`. Kept as separate slots so we can re-diversify later
// (e.g. bring claude back for CEFR phrasing) if/when their JSON output is reliable.
export const MODELS = {
  DEFAULT: "openai/gpt-5.4-mini",
  CEFR: "openai/gpt-5.4-mini",
  STRUCTURED: "openai/gpt-5.4-mini",
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
 * Generate a schema-validated object from the model.
 *
 * Provider-agnostic by design: we request plain JSON and validate it with Zod
 * client-side, rather than sending a JSON-Schema to the provider. OpenRouter routes
 * to many providers (OpenAI/Anthropic/Google/…) whose strict structured-output
 * dialects each reject a *different* subset of JSON-Schema (tuples, optional
 * properties, integer `minimum`, …). Validating with Zod here sidesteps all of that
 * while still guaranteeing the shape — a malformed response throws a ZodError, which
 * the /api/generate/* routes surface as a generation failure.
 */
export async function generateStructured<T>(
  schema: z.ZodSchema<T>,
  systemPrompt: string,
  userPrompt: string,
  options: StructuredOptions = {}
): Promise<T> {
  // Default a generous token budget so larger objects (lesson/slides/worksheet) don't get
  // cut off mid-JSON; callers that need more (quiz) still override.
  const { model = MODELS.STRUCTURED, temperature = 0.6, maxOutputTokens = 8000 } = options;

  // Communicate the exact shape to the model via the prompt (not the provider's
  // structured-output API — see note above). zodToJsonSchema keeps this in lock-step
  // with the Zod schema, so the model uses the right property names/enums/structure.
  const jsonSchema = JSON.stringify(zodToJsonSchema(schema));

  const { text } = await generateText({
    model: getOpenRouter()(model),
    system: `${systemPrompt}\n\nReturn ONLY a single valid JSON object that strictly conforms to this JSON Schema — use these exact property names, enums and structure. No prose, no markdown, no code fences:\n${jsonSchema}`,
    prompt: userPrompt,
    temperature,
    ...(maxOutputTokens ? { maxOutputTokens } : {}),
  });

  return schema.parse(pruneEmptyStrings(extractJson(text)));
}

/**
 * Drop empty/whitespace-only strings from arrays (LLM output occasionally includes a blank
 * array entry, e.g. a trailing ""), recursing through objects/arrays. Leaves scalars and
 * non-string array elements untouched — so a validly-empty scalar (`contextSetup: ""`) stays,
 * and if pruning takes an array below its `.min(n)` the schema still fails as intended.
 */
function pruneEmptyStrings(v: unknown): unknown {
  if (Array.isArray(v)) {
    return v.map(pruneEmptyStrings).filter((x) => !(typeof x === "string" && x.trim() === ""));
  }
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v).map(([k, val]) => [k, pruneEmptyStrings(val)]));
  }
  return v;
}

/** Pull a JSON value out of an LLM response, tolerating code fences or stray prose. */
function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  if (!t.startsWith("{") && !t.startsWith("[")) {
    const candidates = [t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0);
    const first = candidates.length ? Math.min(...candidates) : -1;
    const last = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
    if (first >= 0 && last > first) t = t.slice(first, last + 1);
  }
  try {
    return JSON.parse(t);
  } catch {
    // Tolerate minor model imperfections (unescaped control chars, trailing commas).
    return JSON.parse(jsonrepair(t));
  }
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
