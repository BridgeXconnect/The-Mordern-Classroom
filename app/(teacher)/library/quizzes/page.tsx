import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHead, Chip, CefrBadge } from "@/components/ui/ef-primitives";

export default async function QuizzesDashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const quizzes = await db.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lesson: { include: { unit: { include: { class: true } } } },
      attempts: true,
    },
  });

  const totalAttempts = quizzes.reduce((s, q) => s + q.attempts.length, 0);
  const activeCount = quizzes.filter((q) => q.isActive).length;
  const needsReview = quizzes.filter((q) => q.attempts.some((a) => a.score < 60)).length;

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      <PageHead eyebrow="Library" title="Quizzes" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active quizzes",   value: activeCount },
          { label: "Total attempts",   value: totalAttempts },
          { label: "Awaiting review",  value: needsReview },
        ].map(({ label, value }) => (
          <div key={label} className="card p-4 text-center">
            <p className="font-serif text-[30px]" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] mt-1" style={{ color: "var(--fg-subtle)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Quiz list */}
      <div className="space-y-1.5">
        {quizzes.map((quiz) => {
          const cls = quiz.lesson.unit.class;
          const avgScore = quiz.attempts.length
            ? Math.round(quiz.attempts.reduce((s, a) => s + a.score, 0) / quiz.attempts.length)
            : null;
          return (
            <Link
              key={quiz.id}
              href={`/library/quizzes/${quiz.id}/grade`}
              className="card card-hover flex items-center gap-4 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium truncate" style={{ color: "var(--fg)" }}>{quiz.lesson.title}</p>
                <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                  {cls.name} · {quiz.type}
                </p>
              </div>
              <CefrBadge level={quiz.cefrLevel} />
              <span className="font-mono text-[12px] shrink-0" style={{ color: "var(--fg-muted)" }}>
                {quiz.attempts.length} attempts
              </span>
              {avgScore !== null && (
                <span
                  className="font-mono text-[12px] shrink-0"
                  style={{ color: avgScore >= 70 ? "var(--green)" : "var(--amber)" }}
                >
                  {avgScore}%
                </span>
              )}
              <Chip
                label={quiz.isActive ? "Open" : "Closed"}
                variant={quiz.isActive ? "green" : "default"}
              />
            </Link>
          );
        })}
        {quizzes.length === 0 && (
          <div className="card flex items-center justify-center py-12 text-center">
            <p style={{ color: "var(--fg-muted)" }}>No quizzes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
