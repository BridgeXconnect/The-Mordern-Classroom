import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import PptxGenJS from "pptxgenjs";
import type { SlideContent } from "@/types/slide";

const ExportSchema = z.object({ lessonId: z.string().cuid() });

// Brand colours
const PRIMARY = "4F46E5";   // indigo-600
const DARK    = "1E1B4B";   // indigo-950
const LIGHT   = "EEF2FF";   // indigo-50
const MUTED   = "6B7280";   // gray-500
const WHITE   = "FFFFFF";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await db.lesson.findUnique({
    where: { id: parsed.data.lessonId },
    include: {
      slides: { orderBy: { order: "asc" } },
      unit: { include: { class: true } },
    },
  });
  if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 16:9
  pptx.author = "Modern Classroom";
  pptx.subject = lesson.title;
  pptx.title = lesson.title;

  // Define a master slide layout
  pptx.defineSlideMaster({
    title: "MASTER",
    background: { color: WHITE },
    objects: [
      // Footer bar
      { rect: { x: 0, y: "90%", w: "100%", h: "10%", fill: { color: LIGHT } } },
      { text: {
          text: `${lesson.unit.class.name} · ${lesson.unit.title}`,
          options: { x: 0.3, y: "91%", w: "60%", h: "8%", fontSize: 9, color: MUTED, valign: "middle" },
        },
      },
      { text: {
          text: lesson.unit.class.cefrLevel,
          options: { x: "70%", y: "91%", w: "29%", h: "8%", fontSize: 9, color: PRIMARY, bold: true, align: "right", valign: "middle" },
        },
      },
    ],
  });

  for (const dbSlide of lesson.slides) {
    const content = dbSlide.content as unknown as SlideContent;
    const slide = pptx.addSlide({ masterName: "MASTER" });

    switch (dbSlide.type) {
      case "TITLE": {
        // Full-bleed indigo background
        slide.background = { color: DARK };
        slide.addText(content.title, {
          x: 0.8, y: 1.5, w: "85%", h: 1.5,
          fontSize: 36, bold: true, color: WHITE, align: "center",
        });
        if (content.subtitle) {
          slide.addText(content.subtitle, {
            x: 0.8, y: 3.2, w: "85%", h: 0.8,
            fontSize: 18, color: "A5B4FC", align: "center",
          });
        }
        break;
      }

      case "CONTENT": {
        slide.addText(content.title, {
          x: 0.5, y: 0.25, w: "95%", h: 0.7,
          fontSize: 24, bold: true, color: DARK,
        });
        // Accent line
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: 1.0, w: 1.2, h: 0.06,
          fill: { color: PRIMARY }, line: { type: "none" },
        });
        if (content.bullets && content.bullets.length > 0) {
          slide.addText(
            content.bullets.map((b) => ({ text: b, options: { bullet: { type: "bullet" } } })),
            { x: 0.6, y: 1.3, w: "90%", h: 3.8, fontSize: 16, color: "374151", lineSpacingMultiple: 1.4 }
          );
        } else if (content.body) {
          slide.addText(content.body, {
            x: 0.6, y: 1.3, w: "90%", h: 3.8,
            fontSize: 16, color: "374151", lineSpacingMultiple: 1.5,
          });
        }
        break;
      }

      case "VOCABULARY": {
        slide.addText("📚 Vocabulary", {
          x: 0.5, y: 0.25, w: "95%", h: 0.7,
          fontSize: 24, bold: true, color: DARK,
        });
        const items = content.vocabularyItems ?? [];
        const colW = items.length <= 2 ? 4.5 : 3.1;
        items.slice(0, 3).forEach((item, i) => {
          const x = 0.4 + i * (colW + 0.2);
          slide.addShape(pptx.ShapeType.rect, {
            x, y: 1.1, w: colW, h: 3.4,
            fill: { color: LIGHT }, line: { color: "C7D2FE", pt: 1 }, rectRadius: 0.1,
          });
          slide.addText(item.word, { x: x + 0.15, y: 1.2, w: colW - 0.3, h: 0.5, fontSize: 18, bold: true, color: PRIMARY });
          slide.addText(`(${item.partOfSpeech})`, { x: x + 0.15, y: 1.7, w: colW - 0.3, h: 0.3, fontSize: 10, color: MUTED, italic: true });
          slide.addText(item.definition, { x: x + 0.15, y: 2.1, w: colW - 0.3, h: 0.8, fontSize: 12, color: DARK, lineSpacingMultiple: 1.3 });
          slide.addText(`"${item.example}"`, { x: x + 0.15, y: 3.0, w: colW - 0.3, h: 0.9, fontSize: 11, color: MUTED, italic: true, lineSpacingMultiple: 1.3 });
        });
        break;
      }

      case "GRAMMAR": {
        const gr = content.grammarRule;
        slide.addText("🔤 Grammar Focus", {
          x: 0.5, y: 0.25, w: "95%", h: 0.7,
          fontSize: 24, bold: true, color: DARK,
        });
        if (gr) {
          slide.addText(gr.rule, { x: 0.5, y: 1.1, w: "95%", h: 0.6, fontSize: 18, bold: true, color: PRIMARY });
          slide.addText(gr.explanation, { x: 0.5, y: 1.8, w: "95%", h: 0.9, fontSize: 14, color: "374151", lineSpacingMultiple: 1.4 });
          slide.addText("Examples:", { x: 0.5, y: 2.85, w: "95%", h: 0.35, fontSize: 13, bold: true, color: DARK });
          slide.addText(
            gr.examples.slice(0, 3).map((e) => ({ text: e, options: { bullet: true } })),
            { x: 0.7, y: 3.2, w: "90%", h: 1.4, fontSize: 13, color: "374151" }
          );
        }
        break;
      }

      case "ACTIVITY": {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: "100%", h: 0.9,
          fill: { color: PRIMARY }, line: { type: "none" },
        });
        slide.addText("✏️ Activity", {
          x: 0.5, y: 0.1, w: "95%", h: 0.7,
          fontSize: 22, bold: true, color: WHITE,
        });
        slide.addText(content.activityInstructions ?? "Complete the activity.", {
          x: 0.5, y: 1.1, w: "95%", h: 0.8,
          fontSize: 14, color: DARK, lineSpacingMultiple: 1.4,
        });
        if (content.activityItems && content.activityItems.length > 0) {
          slide.addText(
            content.activityItems.map((item, i) => ({ text: `${i + 1}. ${item}`, options: {} })),
            { x: 0.7, y: 2.1, w: "90%", h: 3.2, fontSize: 14, color: "374151", lineSpacingMultiple: 1.6 }
          );
        }
        break;
      }

      default: {
        slide.addText(content.title ?? "Slide", {
          x: 0.5, y: 2, w: "95%", h: 1,
          fontSize: 24, bold: true, color: DARK, align: "center",
        });
      }
    }

    // Speaker notes
    if (dbSlide.speakerNotes) {
      slide.addNotes(dbSlide.speakerNotes);
    }
  }

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
  const safeName = lesson.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${safeName}.pptx"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
