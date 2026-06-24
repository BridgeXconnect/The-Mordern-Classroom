"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Flag, Sparkles, ChevronRight } from "lucide-react";
import { CefrBadge, Chip } from "@/components/ui/ef-primitives";

interface Attempt {
  id: string;
  studentAlias?: string | null;
  score: number;
  answers: unknown;
  completedAt: Date;
}

interface Quiz {
  id: string;
  type: string;
  cefrLevel: string;
  questions: unknown;
  lesson: { title: string; unit: { class: { name: string; cefrLevel: string } } };
  attempts: Attempt[];
}

const SCORE_BANDS = [
  { label: "90–100%", color: "var(--green)",  bg: "var(--green-bg)" },
  { label: "70–89%",  color: "var(--blue)",   bg: "var(--blue-bg)" },
  { label: "50–69%",  color: "var(--amber)",  bg: "var(--amber-bg)" },
  { label: "0–49%",   color: "var(--red)",    bg: "var(--red-bg)" },
];

function avgScore(attempts: Attempt[]) {
  if (!attempts.length) return null;
  return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
}

export function GradingView({ quiz }: { quiz: Quiz }) {
  const [activeId, setActiveId] = useState<string | null>(quiz.attempts[0]?.id ?? null);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [suggestAccepted, setSuggestAccepted] = useState<Set<string>>(new Set());

  const active = quiz.attempts.find((a) => a.id === activeId);
  const avg = avgScore(quiz.attempts);
  const cls = quiz.lesson.unit.class;

  function acceptSuggested(id: string) {
    setMarks((m) => ({ ...m, [id]: 8 }));
    setSuggestAccepted((s) => new Set([...s, id]));
  }

  function saveAndNext() {
    const idx = quiz.attempts.findIndex((a) => a.id === activeId);
    const next = quiz.attempts[idx + 1];
    if (next) setActiveId(next.id);
  }

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      {/* Back */}
      <Link href="/library/quizzes" className="inline-flex items-center gap-1.5 mb-5 font-mono text-[11.5px]" style={{ color: "var(--fg-subtle)" }}>
        <ArrowLeft className="h-3.5 w-3.5" /> Quizzes
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>{cls.name}</span>
          <CefrBadge level={quiz.cefrLevel} />
          <Chip label={quiz.type} />
        </div>
        <h1 className="font-serif text-[26px] mb-2" style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.015em" }}>
          {quiz.lesson.title}
        </h1>
        <div className="flex items-center gap-4 font-mono text-[12px]" style={{ color: "var(--fg-muted)" }}>
          <span>{quiz.attempts.length} attempts</span>
          {avg !== null && <span>avg {avg}%</span>}
          <button className="btn btn-ghost btn-sm ml-2">Copy link</button>
          <button className="btn btn-ghost btn-sm">Export grades</button>
        </div>
      </div>

      {/* Analytics row */}
      <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: "1fr 1.3fr" }}>
        {/* Score distribution */}
        <div className="card p-4">
          <p className="section-label mb-3">Score distribution</p>
          <div className="space-y-2">
            {SCORE_BANDS.map(({ label, color, bg }) => {
              const count = Math.floor(Math.random() * (quiz.attempts.length + 1));
              const pct = quiz.attempts.length ? (count / quiz.attempts.length) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="font-mono text-[10.5px] w-16 shrink-0" style={{ color: "var(--fg-subtle)" }}>{label}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--surface-2)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="font-mono text-[11px] w-4 shrink-0" style={{ color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question breakdown */}
        <div className="card p-4">
          <p className="section-label mb-3">Question breakdown</p>
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => {
              const pct = 40 + Math.random() * 60;
              const color = pct >= 70 ? "var(--green)" : pct >= 50 ? "var(--amber)" : "var(--red)";
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-[10.5px] w-4 shrink-0" style={{ color: "var(--fg-faint)" }}>Q{i + 1}</span>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "var(--surface-2)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="font-mono text-[11px] w-8 shrink-0" style={{ color }}>{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: "var(--accent-color)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Q3 has the lowest pass rate — consider revisiting in class.</span>
          </div>
        </div>
      </div>

      {/* Grading workspace */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "300px 1fr" }}>
        {/* Roster */}
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="section-label">Roster</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 500 }}>
            {quiz.attempts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>No attempts yet</p>
              </div>
            ) : (
              quiz.attempts.map((attempt, i) => {
                const isActive = attempt.id === activeId;
                const scored = marks[attempt.id] ?? attempt.score;
                return (
                  <button
                    key={attempt.id}
                    type="button"
                    onClick={() => setActiveId(attempt.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 transition-colors text-left"
                    style={{
                      background: isActive ? "var(--active)" : undefined,
                      borderBottom: "1px solid var(--border-soft)",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold"
                      style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
                    >
                      {(attempt.studentAlias?.[0] ?? String.fromCharCode(65 + i)).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: "var(--fg)" }}>
                        {attempt.studentAlias ?? `Student ${i + 1}`}
                      </p>
                      <p className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {scored !== null && scored !== undefined ? (
                      <span
                        className="font-mono text-[12px] font-semibold shrink-0"
                        style={{ color: Number(scored) >= 70 ? "var(--green)" : "var(--amber)" }}
                      >
                        {Math.round(Number(scored))}%
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: "var(--amber)" }} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {active ? (
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-medium" style={{ color: "var(--fg)" }}>
                {active.studentAlias ?? "Anonymous"}
              </p>
              <button className="btn-icon" title="Flag"><Flag className="h-4 w-4" /></button>
            </div>

            {/* Open response */}
            <div>
              <p className="label-mono mb-2">Prompt</p>
              <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
                Using the passive voice, rewrite the following sentences from a news report.
              </p>
            </div>

            <div
              className="rounded-[10px] p-4 text-[13px] italic"
              style={{ background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border-soft)" }}
            >
              "The government has announced new climate policies this week. Scientists welcomed the decision."
            </div>

            {/* Copilot suggestion */}
            {!suggestAccepted.has(active.id) && (
              <div
                className="rounded-[10px] p-4 animate-fade-up"
                style={{ background: "var(--accent-soft)", border: "1px solid var(--border-soft)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
                  <p className="text-[12.5px] font-medium" style={{ color: "var(--accent-color)" }}>Copilot suggested mark</p>
                </div>
                <p className="text-[13px] mb-3" style={{ color: "var(--fg)" }}>
                  <strong>8/10</strong> — Good passive construction in sentence 1. Sentence 2 needs the agent phrase.
                </p>
                <button
                  onClick={() => acceptSuggested(active.id)}
                  className="btn btn-primary btn-sm"
                >
                  Accept
                </button>
              </div>
            )}

            {/* Mark picker */}
            <div>
              <p className="label-mono mb-2">Mark (0–10)</p>
              <div className="flex gap-1.5 flex-wrap">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMarks((m) => ({ ...m, [active.id]: i }))}
                    className="h-8 w-8 rounded-[6px] font-mono text-[12px] transition-all"
                    style={{
                      background: marks[active.id] === i ? "var(--accent-color)" : "var(--surface-2)",
                      color: marks[active.id] === i ? "var(--accent-fg)" : "var(--fg-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
              <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
                {marks[active.id] !== undefined ? `Marked: ${marks[active.id]}/10` : "Not yet marked"}
              </p>
              <button
                onClick={saveAndNext}
                className="btn btn-primary flex items-center gap-1.5"
              >
                Save &amp; next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="card flex items-center justify-center py-16 text-center">
            <p style={{ color: "var(--fg-muted)" }}>Select a student from the roster.</p>
          </div>
        )}
      </div>
    </div>
  );
}
