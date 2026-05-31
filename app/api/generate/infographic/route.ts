import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { renderHtmlToPng } from "@/lib/puppeteer";
import { deleteFromR2 } from "@/lib/r2";
import type { InfographicTemplate } from "@/types/media";

// maxDuration: 60 — set in vercel.json

// Re-export for consumers that previously imported from this route
export type { InfographicTemplate };

const Schema = z.object({
  templateType: z.enum(["vocabulary-grid", "grammar-card", "timeline"]),
  lessonId:     z.string().cuid().optional(),
  data: z.object({
    title:    z.string(),
    subtitle: z.string().optional(),
    // vocabulary-grid
    words: z.array(z.object({ word: z.string(), definition: z.string(), example: z.string().optional() })).optional(),
    // grammar-card
    rule:        z.string().optional(),
    explanation: z.string().optional(),
    examples:    z.array(z.string()).optional(),
    // timeline
    events: z.array(z.object({ date: z.string(), event: z.string() })).optional(),
  }),
});

// ── HTML escape helper ────────────────────────────────────────────────────────

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── HTML templates ────────────────────────────────────────────────────────────

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; }
`;

function vocabularyGridHtml(title: string, subtitle: string | undefined, words: { word: string; definition: string; example?: string }[]): string {
  const cards = words.slice(0, 9).map((w) => `
    <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:16px;">
      <div style="font-size:18px;font-weight:700;color:#4F46E5;margin-bottom:4px;">${esc(w.word)}</div>
      <div style="font-size:13px;color:#374151;margin-bottom:6px;">${esc(w.definition)}</div>
      ${w.example ? `<div style="font-size:12px;color:#6B7280;font-style:italic;">&ldquo;${esc(w.example)}&rdquo;</div>` : ""}
    </div>
  `).join("");

  return `<!DOCTYPE html><html><head><style>
    ${BASE_STYLES}
    body { width:1200px; min-height:800px; padding:48px; background:#fff; }
    h1 { font-size:28px; color:#1E1B4B; margin-bottom:6px; }
    p  { font-size:14px; color:#6B7280; margin-bottom:28px; }
    .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  </style></head><body>
    <div style="border-bottom:3px solid #4F46E5;padding-bottom:16px;margin-bottom:24px;">
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </div>
    <div class="grid">${cards}</div>
  </body></html>`;
}

function grammarCardHtml(title: string, rule: string, explanation: string, examples: string[]): string {
  const exList = examples.slice(0, 4).map((e) => `
    <div style="padding:10px 14px;background:#F9FAFB;border-left:3px solid #4F46E5;border-radius:0 6px 6px 0;font-size:14px;color:#374151;">
      ${esc(e)}
    </div>
  `).join("");

  return `<!DOCTYPE html><html><head><style>
    ${BASE_STYLES}
    body { width:1200px; height:800px; padding:48px; display:flex; flex-direction:column; gap:24px; }
  </style></head><body>
    <div style="background:#4F46E5;border-radius:12px;padding:28px 32px;color:#fff;">
      <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:.7;margin-bottom:6px;">Grammar Focus</div>
      <h1 style="font-size:26px;font-weight:700;">${esc(title)}</h1>
    </div>
    <div style="background:#EEF2FF;border-radius:10px;padding:20px 24px;">
      <div style="font-size:12px;color:#4F46E5;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Rule</div>
      <div style="font-size:18px;font-weight:600;color:#1E1B4B;">${esc(rule)}</div>
    </div>
    <div style="font-size:14px;color:#374151;line-height:1.6;">${esc(explanation)}</div>
    <div>
      <div style="font-size:12px;color:#6B7280;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Examples</div>
      <div style="display:flex;flex-direction:column;gap:8px;">${exList}</div>
    </div>
  </body></html>`;
}

function timelineHtml(title: string, subtitle: string | undefined, events: { date: string; event: string }[]): string {
  const items = events.slice(0, 8).map((e, i) => `
    <div style="display:flex;gap:20px;align-items:flex-start;">
      <div style="display:flex;flex-direction:column;align-items:center;min-width:16px;">
        <div style="width:16px;height:16px;border-radius:50%;background:${i % 2 === 0 ? "#4F46E5" : "#A5B4FC"};flex-shrink:0;margin-top:2px;"></div>
        ${i < events.length - 1 ? `<div style="width:2px;flex:1;background:#E5E7EB;min-height:20px;margin-top:4px;"></div>` : ""}
      </div>
      <div style="padding-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#4F46E5;margin-bottom:2px;">${esc(e.date)}</div>
        <div style="font-size:14px;color:#374151;">${esc(e.event)}</div>
      </div>
    </div>
  `).join("");

  return `<!DOCTYPE html><html><head><style>
    ${BASE_STYLES}
    body { width:1200px; min-height:800px; padding:48px; }
    h1 { font-size:28px; color:#1E1B4B; margin-bottom:4px; }
    p  { font-size:14px; color:#6B7280; margin-bottom:32px; }
  </style></head><body>
    <div style="border-bottom:3px solid #4F46E5;padding-bottom:16px;margin-bottom:28px;">
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </div>
    <div style="display:flex;flex-direction:column;">${items}</div>
  </body></html>`;
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { templateType, lessonId, data } = parsed.data;

  let html: string;

  switch (templateType) {
    case "vocabulary-grid":
      html = vocabularyGridHtml(data.title, data.subtitle, data.words ?? []);
      break;
    case "grammar-card":
      html = grammarCardHtml(data.title, data.rule ?? "", data.explanation ?? "", data.examples ?? []);
      break;
    case "timeline":
      html = timelineHtml(data.title, data.subtitle, data.events ?? []);
      break;
  }

  const url = await renderHtmlToPng(html!, { width: 1200, height: 800, deviceScaleFactor: 2 });

  try {
    const asset = await db.mediaAsset.create({
      data: {
        type:      "INFOGRAPHIC",
        url,
        prompt:    `${templateType}: ${data.title}`,
        filename:  url.split("/").pop() ?? "infographic.png",
        mimeType:  "image/png",
        ...(lessonId ? { lessonId } : {}),
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    // DB insert failed — clean up the R2 object so we don't leak storage
    console.error("DB insert failed after R2 upload; cleaning up orphan:", err);
    await deleteFromR2(url).catch((r2Err) =>
      console.error("R2 cleanup also failed:", r2Err)
    );
    return NextResponse.json({ error: "Failed to save infographic" }, { status: 500 });
  }
}
