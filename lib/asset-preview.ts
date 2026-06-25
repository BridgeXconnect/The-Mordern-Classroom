/**
 * Pure mappers that turn each raw generation payload (exactly what the Copilot's
 * generate calls return) into a small, render-ready preview model. The in-place
 * Preview modal in the Copilot renders this generic shape, so the "view the asset"
 * behaviour (backlog #1) needs no extra fetch — the data is already in hand.
 *
 * Everything here is deterministic and side-effect free so it can be unit-tested
 * against representative payloads without a DB or the LLM.
 */

import type { LessonPlanBody } from "@/types/lesson";

export type AssetKind = "plan" | "slides" | "worksheet" | "quiz" | "media";

export interface PreviewSection {
  heading: string;
  /** Plain lines rendered in order under the heading. */
  lines: string[];
}

export interface AssetPreview {
  title: string;
  subtitle?: string;
  sections: PreviewSection[];
}

const asArray = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const clean = (lines: (string | undefined | null)[]): string[] =>
  lines.filter((l): l is string => typeof l === "string" && l.trim() !== "");

const EMPTY: AssetPreview = {
  title: "Nothing to preview",
  sections: [{ heading: "This asset isn’t ready yet.", lines: [] }],
};

function planPreview(raw: unknown): AssetPreview {
  const plan = (raw ?? {}) as Partial<LessonPlanBody>;
  const activities = asArray<LessonPlanBody["activities"][number]>(plan.activities);
  const sections: PreviewSection[] = [];

  const t = plan.targets;
  const targetLines = clean([
    t?.vocabulary?.length ? `Vocabulary: ${t.vocabulary.join(", ")}` : null,
    t?.grammar?.length ? `Grammar: ${t.grammar.join(", ")}` : null,
    t?.skills?.length ? `Skills: ${t.skills.join("; ")}` : null,
  ]);
  if (targetLines.length) sections.push({ heading: "Targets", lines: targetLines });

  if (plan.materials?.length) {
    sections.push({ heading: "Materials", lines: clean(plan.materials) });
  }

  for (const a of activities) {
    sections.push({
      heading: `${a.section} · ${a.title} (${a.durationMin} min)`,
      lines: clean([
        a.contextSetup ? `Set-up: ${a.contextSetup}` : null,
        ...a.steps.map((s, i) => `${i + 1}. ${s}`),
      ]),
    });
  }

  return {
    title: "Lesson plan",
    subtitle: typeof plan.summary === "string" && plan.summary.trim() ? plan.summary : undefined,
    sections: sections.length ? sections : EMPTY.sections,
  };
}

interface RawSlide {
  order?: number;
  type?: string;
  content?: {
    title?: string;
    subtitle?: string;
    bullets?: string[];
    body?: string;
    vocabularyItems?: { word?: string; definition?: string }[];
    activityItems?: string[];
  };
}

function slidesPreview(raw: unknown): AssetPreview {
  const slides = asArray<RawSlide>(raw);
  const sections: PreviewSection[] = slides.map((s, i) => {
    const c = s.content ?? {};
    const lines = clean([
      c.subtitle,
      ...(c.bullets ?? []),
      c.body,
      ...(c.vocabularyItems ?? []).map((v) => clean([v.word, v.definition]).join(" — ")),
      ...(c.activityItems ?? []),
    ]);
    return { heading: `${(s.order ?? i) + 1}. ${s.type ?? "SLIDE"} — ${c.title ?? "Untitled"}`, lines };
  });
  return {
    title: "Slides",
    subtitle: `${slides.length} slide${slides.length === 1 ? "" : "s"}`,
    sections: sections.length ? sections : EMPTY.sections,
  };
}

interface RawWorksheet {
  title?: string;
  sections?: { type?: string; title?: string; instructions?: string }[];
}

function worksheetPreview(raw: unknown): AssetPreview {
  const ws = (raw ?? {}) as RawWorksheet;
  const items = asArray<NonNullable<RawWorksheet["sections"]>[number]>(ws.sections);
  const sections: PreviewSection[] = items.map((s) => ({
    heading: `${s.type ?? "section"} — ${s.title ?? "Untitled"}`,
    lines: clean([s.instructions]),
  }));
  return {
    title: ws.title?.trim() ? ws.title : "Worksheet",
    subtitle: `${items.length} section${items.length === 1 ? "" : "s"}`,
    sections: sections.length ? sections : EMPTY.sections,
  };
}

interface RawQuestion {
  type?: string;
  prompt?: string;
  text?: string;
  options?: string[];
  correctIndex?: number;
  answer?: string;
}

function quizPreview(raw: unknown): AssetPreview {
  const questions = asArray<RawQuestion>((raw as { questions?: unknown })?.questions ?? raw);
  const sections: PreviewSection[] = questions.map((q, i) => {
    const lines: string[] = [];
    if (q.text) lines.push(q.text);
    if (q.options?.length) {
      q.options.forEach((opt, oi) => lines.push(`${oi === q.correctIndex ? "✓" : "•"} ${opt}`));
    }
    if (q.answer) lines.push(`Answer: ${q.answer}`);
    return { heading: `Q${i + 1} (${q.type ?? "question"}) — ${q.prompt ?? ""}`.trim(), lines: clean(lines) };
  });
  return {
    title: "Quiz",
    subtitle: `${questions.length} question${questions.length === 1 ? "" : "s"}`,
    sections: sections.length ? sections : EMPTY.sections,
  };
}

interface RawMedia {
  title?: string | null;
  type?: string;
  url?: string;
}

function mediaPreview(raw: unknown): AssetPreview {
  const assets = asArray<RawMedia>(Array.isArray(raw) ? raw : (raw as { assets?: unknown })?.assets);
  if (!assets.length) {
    return {
      title: "Media",
      sections: [{ heading: "No media yet", lines: ["Image generation needs an R2 bucket configured."] }],
    };
  }
  return {
    title: "Media",
    subtitle: `${assets.length} asset${assets.length === 1 ? "" : "s"}`,
    sections: assets.map((a) => ({
      heading: a.title?.trim() ? a.title : (a.type ?? "Asset"),
      lines: clean([a.url]),
    })),
  };
}

/** Map a raw generation payload to the generic preview model the modal renders. */
export function buildAssetPreview(kind: AssetKind, raw: unknown): AssetPreview {
  switch (kind) {
    case "plan":
      return planPreview(raw);
    case "slides":
      return slidesPreview(raw);
    case "worksheet":
      return worksheetPreview(raw);
    case "quiz":
      return quizPreview(raw);
    case "media":
      return mediaPreview(raw);
    default:
      return EMPTY;
  }
}
