// TODO Phase 6: Generate quiz questions via LLM (JSON mode, gpt-4o-mini)
// POST { lessonId, lessonTitle, objectives, cefrLevel, type, questionTypes, questionCount, vocabulary }
export async function POST() {
  return Response.json({ ok: true, message: "TODO: Phase 6 — quiz generation" });
}
