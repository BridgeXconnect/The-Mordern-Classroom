import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SlideContent, VocabularyItem } from "@/types/slide";

/**
 * GET /api/slides/present?lessonId=xxx
 * Returns a self-contained Reveal.js HTML page for the lesson's slides.
 * Opened in a new tab from the slide builder.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const lessonId = searchParams.get("lessonId");
  if (!lessonId) return new NextResponse("lessonId required", { status: 400 });

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      slides: { orderBy: { order: "asc" } },
      unit: { include: { class: true } },
    },
  });

  if (!lesson || lesson.slides.length === 0) {
    return new NextResponse("No slides found", { status: 404 });
  }

  const slidesHtml = lesson.slides
    .map((slide) => {
      const c = slide.content as unknown as SlideContent;
      let inner = "";

      switch (slide.type) {
        case "TITLE":
          inner = `
            <h1 style="font-size:2.4em;font-weight:700;color:#fff;margin-bottom:0.3em">${c.title}</h1>
            ${c.subtitle ? `<p style="font-size:1.2em;color:#a5b4fc">${c.subtitle}</p>` : ""}
            <p style="position:absolute;bottom:1em;left:50%;transform:translateX(-50%);font-size:0.6em;color:#818cf8;letter-spacing:.1em">${lesson.unit.class.cefrLevel} · ${lesson.unit.class.name}</p>`;
          break;

        case "CONTENT":
          inner = `
            <h2 style="text-align:left;font-size:1.5em;font-weight:700;color:#1e1b4b;border-bottom:3px solid #4f46e5;padding-bottom:0.2em;margin-bottom:0.6em">${c.title}</h2>
            ${c.bullets && c.bullets.length > 0
              ? `<ul style="list-style:none;padding:0;text-align:left">${c.bullets.map((b) => `<li style="padding:0.3em 0;color:#374151;font-size:1.05em">▸ ${b}</li>`).join("")}</ul>`
              : `<p style="text-align:left;color:#374151;font-size:1.05em;line-height:1.7">${c.body ?? ""}</p>`}`;
          break;

        case "VOCABULARY":
          inner = `
            <h2 style="font-size:1.4em;font-weight:700;color:#1e1b4b;margin-bottom:0.6em">📚 Vocabulary</h2>
            <div style="display:flex;gap:1em;justify-content:center;flex-wrap:wrap">
              ${(c.vocabularyItems ?? []).slice(0, 3).map((v: VocabularyItem) => `
                <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:0.8em 1em;flex:1;min-width:200px;max-width:280px;text-align:left">
                  <div style="font-size:1.3em;font-weight:700;color:#4f46e5">${v.word}</div>
                  <div style="font-size:0.75em;color:#6b7280;font-style:italic;margin-bottom:0.4em">${v.partOfSpeech}</div>
                  <div style="font-size:0.9em;color:#1e1b4b;margin-bottom:0.4em">${v.definition}</div>
                  <div style="font-size:0.85em;color:#6b7280;font-style:italic">"${v.example}"</div>
                </div>`).join("")}
            </div>`;
          break;

        case "GRAMMAR":
          inner = c.grammarRule ? `
            <h2 style="font-size:1.4em;font-weight:700;color:#1e1b4b;margin-bottom:0.4em">🔤 Grammar Focus</h2>
            <div style="background:#eef2ff;border-radius:8px;padding:0.8em 1em;margin-bottom:0.6em;text-align:left">
              <div style="font-size:1.2em;font-weight:700;color:#4f46e5">${c.grammarRule.rule}</div>
              <div style="color:#374151;margin-top:0.3em;font-size:0.9em">${c.grammarRule.explanation}</div>
            </div>
            <div style="text-align:left">
              <div style="font-weight:700;color:#1e1b4b;margin-bottom:0.3em">Examples:</div>
              ${c.grammarRule.examples.slice(0, 3).map((e: string) => `<div style="color:#374151;padding:0.15em 0">▸ ${e}</div>`).join("")}
            </div>` : `<h2>${c.title}</h2>`;
          break;

        case "ACTIVITY":
          inner = `
            <div style="background:#4f46e5;color:#fff;padding:0.5em 1em;border-radius:8px 8px 0 0;font-size:1.3em;font-weight:700;margin-bottom:0.6em;text-align:left">✏️ ${c.title}</div>
            <p style="text-align:left;color:#374151;margin-bottom:0.6em;font-size:0.95em">${c.activityInstructions ?? ""}</p>
            <ol style="text-align:left;color:#374151;padding-left:1.2em">
              ${(c.activityItems ?? []).map((item: string) => `<li style="padding:0.25em 0;font-size:0.95em">${item}</li>`).join("")}
            </ol>`;
          break;

        default:
          inner = `<h2>${c.title}</h2>`;
      }

      const bg = slide.type === "TITLE" ? 'data-background-color="#1e1b4b"' : 'data-background-color="#ffffff"';
      const notes = slide.speakerNotes ? `<aside class="notes">${slide.speakerNotes}</aside>` : "";
      return `<section ${bg}>${inner}${notes}</section>`;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${lesson.title} — Modern Classroom</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reset.css"/>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css"/>
  <style>
    .reveal { font-family: system-ui, -apple-system, sans-serif; }
    .reveal ul { list-style: none; padding: 0; }
    .reveal h1, .reveal h2 { text-transform: none; letter-spacing: -0.02em; }
    .reveal .controls { color: #4f46e5; }
    .reveal .progress span { background: #4f46e5; }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">${slidesHtml}</div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
  <script>
    Reveal.initialize({ controls:true, progress:true, slideNumber:true, hash:true, transition:'slide', transitionSpeed:'fast', backgroundTransition:'fade' });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
