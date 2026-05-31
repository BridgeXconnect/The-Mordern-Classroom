import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { WorksheetPdf } from "@/lib/worksheetPdf";
import type { WorksheetSection } from "@/types/worksheet";
import React from "react";

const ExportSchema = z.object({ worksheetId: z.string() });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const worksheet = await db.worksheet.findUnique({
    where: { id: parsed.data.worksheetId },
    include: { lesson: { include: { unit: { include: { class: true } } } } },
  });
  if (!worksheet) return NextResponse.json({ error: "Worksheet not found" }, { status: 404 });

  const { lesson } = worksheet;
  const sections = worksheet.sections as unknown as WorksheetSection[];

  const buffer = await renderToBuffer(
    React.createElement(WorksheetPdf, {
      title: worksheet.title,
      className: lesson.unit.class.name,
      cefrLevel: lesson.unit.class.cefrLevel,
      lessonTitle: lesson.title,
      sections,
    })
  );

  const safeName = worksheet.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
      "Content-Length": buffer.byteLength.toString(),
    },
  });
}
