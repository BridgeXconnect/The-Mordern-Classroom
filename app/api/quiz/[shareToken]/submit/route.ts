// PUBLIC ROUTE — no auth required
// TODO Phase 6: Accept quiz submission, score it, store QuizAttempt in DB
// POST { quizId, studentAlias, answers }
export async function POST() {
  return Response.json({ ok: true, message: "TODO: Phase 6 — quiz submission" });
}
