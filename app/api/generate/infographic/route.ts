// TODO Phase 4: Render infographic via Puppeteer + HTML template
// POST { templateType, data, lessonId }
// Heavy route — maxDuration: 60s (configured in vercel.json)
export async function POST() {
  return Response.json({ ok: true, message: "TODO: Phase 4 — infographic generation" });
}
