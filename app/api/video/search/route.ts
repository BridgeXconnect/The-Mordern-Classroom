// TODO Phase 5: Search YouTube for educational videos, cache results in DB
// GET ?query=...&cefrLevel=...&lessonId=...
export async function GET() {
  return Response.json({ ok: true, videos: [], message: "TODO: Phase 5 — YouTube search" });
}
