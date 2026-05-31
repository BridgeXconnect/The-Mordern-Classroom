import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { renderHtmlToPng } from "@/lib/puppeteer";
import { deleteFromR2 } from "@/lib/r2";

// maxDuration: 60 — set in vercel.json

// ── Note on full video rendering ─────────────────────────────────────────────
// Full MP4 rendering via @remotion/renderer requires a bundled composition and
// a headless Chromium session that can take 30–120 seconds. On Vercel Hobby
// this exceeds function limits; use Remotion Lambda for production.
// This endpoint renders a static preview frame (PNG) of the selected template
// that can be used as a thumbnail while the full render is pending.

const Schema = z.object({
  templateType: z.enum(["vocabulary-explainer", "grammar-rule", "reading-strategy"]),
  lessonId:     z.string().cuid().optional(),
  data: z.discriminatedUnion("templateType", [
    z.object({
      templateType: z.literal("vocabulary-explainer"),
      title:        z.string().min(1),
      cefrLevel:    z.string().default("B1"),
      words:        z.array(z.object({ word: z.string(), definition: z.string(), example: z.string().optional() })).min(1),
    }),
    z.object({
      templateType: z.literal("grammar-rule"),
      title:        z.string().min(1),
      cefrLevel:    z.string().default("B1"),
      rule:         z.string().min(1),
      explanation:  z.string().default(""),
      examples:     z.array(z.string()).default([]),
    }),
    z.object({
      templateType: z.literal("reading-strategy"),
      title:        z.string().min(1),
      cefrLevel:    z.string().default("B1"),
      strategy:     z.string().min(1),
      steps:        z.array(z.string()).min(1),
    }),
  ]),
});

// ── HTML escape helper ────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ── Preview-frame HTML builders ───────────────────────────────────────────────

function vocabPreviewHtml(title: string, cefrLevel: string, words: { word: string; definition: string; example?: string }[]): string {
  const cards = words.slice(0, 6).map((w) => `
    <div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:12px;padding:20px;">
      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">${esc(w.word)}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.8);">${esc(w.definition)}</div>
      ${w.example ? `<div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px;font-style:italic;">&ldquo;${esc(w.example)}&rdquo;</div>` : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{width:1280px;height:720px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;
         background:linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#3730a3 100%);
         padding:56px;display:flex;flex-direction:column;}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.15);
           border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:4px 14px;
           font-size:13px;color:rgba(255,255,255,0.9);font-weight:600;letter-spacing:.5px;
           width:fit-content;margin-bottom:16px;}
    h1{font-size:36px;font-weight:800;color:#fff;margin-bottom:32px;line-height:1.2;}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;flex:1;}
  </style></head><body>
    <div class="badge">📹 Vocabulary Explainer &nbsp;·&nbsp; ${esc(cefrLevel)}</div>
    <h1>${esc(title)}</h1>
    <div class="grid">${cards}</div>
  </body></html>`;
}

function grammarPreviewHtml(title: string, cefrLevel: string, rule: string, explanation: string, examples: string[]): string {
  const exItems = examples.slice(0, 3).map((e) =>
    `<div style="padding:10px 16px;background:rgba(255,255,255,0.1);border-left:3px solid #34d399;border-radius:0 8px 8px 0;font-size:15px;color:rgba(255,255,255,0.9);">${esc(e)}</div>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{width:1280px;height:720px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;
         background:linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%);padding:56px;
         display:flex;flex-direction:column;gap:24px;}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.15);
           border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:4px 14px;
           font-size:13px;color:rgba(255,255,255,0.9);font-weight:600;width:fit-content;}
  </style></head><body>
    <div class="badge">📹 Grammar Rule &nbsp;·&nbsp; ${esc(cefrLevel)}</div>
    <h1 style="font-size:36px;font-weight:800;color:#fff;">${esc(title)}</h1>
    <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:20px 24px;">
      <div style="font-size:12px;color:#34d399;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Rule</div>
      <div style="font-size:20px;font-weight:600;color:#fff;">${esc(rule)}</div>
    </div>
    ${explanation ? `<div style="font-size:15px;color:rgba(255,255,255,0.8);line-height:1.6;">${esc(explanation)}</div>` : ""}
    ${exItems ? `<div style="display:flex;flex-direction:column;gap:10px;">${exItems}</div>` : ""}
  </body></html>`;
}

function readingPreviewHtml(title: string, cefrLevel: string, strategy: string, steps: string[]): string {
  const stepItems = steps.slice(0, 5).map((s, i) => `
    <div style="display:flex;gap:16px;align-items:flex-start;">
      <div style="width:32px;height:32px;border-radius:50%;background:#f97316;
                  display:flex;align-items:center;justify-content:center;
                  font-size:15px;font-weight:700;color:#fff;flex-shrink:0;">${i + 1}</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.9);line-height:1.5;padding-top:5px;">${esc(s)}</div>
    </div>
  `).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{width:1280px;height:720px;overflow:hidden;font-family:'Segoe UI',Arial,sans-serif;
         background:linear-gradient(135deg,#7c2d12 0%,#92400e 50%,#b45309 100%);padding:56px;
         display:flex;flex-direction:column;gap:24px;}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.15);
           border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:4px 14px;
           font-size:13px;color:rgba(255,255,255,0.9);font-weight:600;width:fit-content;}
  </style></head><body>
    <div class="badge">📹 Reading Strategy &nbsp;·&nbsp; ${esc(cefrLevel)}</div>
    <h1 style="font-size:36px;font-weight:800;color:#fff;">${esc(title)}</h1>
    <div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:16px 24px;">
      <div style="font-size:18px;font-weight:700;color:#fbbf24;">${esc(strategy)}</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;">${stepItems}</div>
  </body></html>`;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { templateType, lessonId } = parsed.data;
  // Use the discriminated union directly — each case narrows `parsed.data.data`
  const rawData = parsed.data.data;

  let html: string;
  let prompt: string;

  switch (rawData.templateType) {
    case "vocabulary-explainer":
      html   = vocabPreviewHtml(rawData.title, rawData.cefrLevel, rawData.words);
      prompt = `vocabulary-explainer: ${rawData.title}`;
      break;
    case "grammar-rule":
      html   = grammarPreviewHtml(rawData.title, rawData.cefrLevel, rawData.rule, rawData.explanation, rawData.examples);
      prompt = `grammar-rule: ${rawData.title}`;
      break;
    case "reading-strategy":
      html   = readingPreviewHtml(rawData.title, rawData.cefrLevel, rawData.strategy, rawData.steps);
      prompt = `reading-strategy: ${rawData.title}`;
      break;
  }
  void templateType; // templateType is the outer field, rawData.templateType is in data

  const url = await renderHtmlToPng(html!, { width: 1280, height: 720, deviceScaleFactor: 2 });

  try {
    const asset = await db.mediaAsset.create({
      data: {
        type:     "VIDEO_GENERATED",
        url,
        prompt,
        filename: url.split("/").pop() ?? "video-preview.png",
        mimeType: "image/png",
        ...(lessonId ? { lessonId } : {}),
      },
    });
    return NextResponse.json({ ...asset, previewOnly: true }, { status: 201 });
  } catch (err) {
    console.error("DB insert failed after R2 upload; cleaning up:", err);
    await deleteFromR2(url).catch((e) => console.error("R2 cleanup failed:", e));
    return NextResponse.json({ error: "Failed to save video preview" }, { status: 500 });
  }
}
