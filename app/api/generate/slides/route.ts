// TODO Phase 2: Generate slide deck JSON from lesson context via LLM
// POST { lessonId, lessonTitle, objectives, cefrLevel, slideCount, includeVocabulary, includeGrammar, includeActivity }
export async function POST() {
  return Response.json({ ok: true, message: "TODO: Phase 2 — slides generation" });
}
