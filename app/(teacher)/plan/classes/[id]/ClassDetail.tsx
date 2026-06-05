"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronRight, Sparkles } from "lucide-react";
import { CefrBadge, Chip, PageHead } from "@/components/ui/ef-primitives";

type Tab = "overview" | "units" | "lessons";

interface Attempt { score: number; }
interface Quiz { attempts: Attempt[]; }
interface Lesson {
  id: string;
  title: string;
  duration: number;
  slides: unknown[];
  quizzes: Quiz[];
}
interface Unit {
  id: string;
  title: string;
  ibTheme: string;
  order: number;
  lessons: Lesson[];
}
interface Cls {
  id: string;
  name: string;
  cefrLevel: string;
  academicYear: string;
  description?: string | null;
  units: Unit[];
}

function avgScore(attempts: Attempt[]) {
  if (!attempts.length) return null;
  return Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
}

export function ClassDetail({ cls }: { cls: Cls }) {
  const [tab, setTab] = useState<Tab>("overview");

  const allLessons = cls.units.flatMap((u) => u.lessons);
  const totalAttempts = allLessons.flatMap((l) => l.quizzes.flatMap((q) => q.attempts));
  const classAvg = avgScore(totalAttempts);
  const lessonCount = allLessons.length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "units",    label: `Units (${cls.units.length})` },
    { key: "lessons",  label: `Lessons (${lessonCount})` },
  ];

  return (
    <div className="max-w-[1040px] mx-auto animate-fade-up">
      {/* Back */}
      <Link
        href="/plan/classes"
        className="inline-flex items-center gap-1.5 mb-5 font-mono text-[11.5px] transition-colors"
        style={{ color: "var(--fg-subtle)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Classes
      </Link>

      {/* Header */}
      <PageHead
        eyebrow={`${cls.cefrLevel} · ${cls.academicYear}`}
        title={cls.name}
        sub={cls.description ?? undefined}
        actions={
          <>
            <Link href={`/create?classId=${cls.id}`} className="btn btn-primary flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Plan a lesson
            </Link>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Units",    value: cls.units.length },
          { label: "Lessons",  value: lessonCount },
          { label: "Class avg",
            value: classAvg !== null ? `${classAvg}%` : "—",
            colored: classAvg !== null,
            color: classAvg !== null && classAvg >= 70 ? "var(--green)" : "var(--amber)" },
          { label: "Quizzes",  value: allLessons.filter((l) => l.quizzes.length > 0).length },
        ].map(({ label, value, colored, color }) => (
          <div key={label} className="card p-4 text-center">
            <p
              className="font-serif text-[26px]"
              style={{ color: colored ? color : "var(--fg)" }}
            >
              {value}
            </p>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.08em] mt-1" style={{ color: "var(--fg-subtle)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="px-4 py-2.5 text-[13px] font-medium transition-colors relative"
            style={{
              color: tab === key ? "var(--fg)" : "var(--fg-subtle)",
              borderBottom: tab === key ? "2px solid var(--accent-color)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <OverviewTab cls={cls} classAvg={classAvg} />}
      {tab === "units"    && <UnitsTab cls={cls} />}
      {tab === "lessons"  && <LessonsTab lessons={allLessons} />}
    </div>
  );
}

function OverviewTab({ cls, classAvg }: { cls: Cls; classAvg: number | null }) {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {/* Unit progress */}
      <div className="card p-5">
        <p className="section-label mb-4">Unit progress</p>
        <div className="space-y-3">
          {cls.units.map((unit) => {
            const done = unit.lessons.filter((l) => l.slides.length > 0).length;
            const total = unit.lessons.length;
            const pct = total ? (done / total) * 100 : 0;
            return (
              <div key={unit.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[13px]" style={{ color: "var(--fg)" }}>{unit.title}</p>
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
                    {done}/{total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-2)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: pct === 100 ? "var(--green)" : "var(--accent-color)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {cls.units.length === 0 && (
            <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>No units yet.</p>
          )}
        </div>
      </div>

      {/* Performance overview */}
      <div className="card p-5">
        <p className="section-label mb-4">Performance</p>
        {classAvg !== null ? (
          <div className="flex flex-col items-center justify-center h-32">
            <p
              className="font-serif text-[48px]"
              style={{ color: classAvg >= 70 ? "var(--green)" : "var(--amber)", fontWeight: 400 }}
            >
              {classAvg}%
            </p>
            <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
              class average across all quizzes
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>No quiz data yet.</p>
            <Link href={`/create?classId=${cls.id}`} className="btn btn-ghost btn-sm mt-3 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Generate a quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function UnitsTab({ cls }: { cls: Cls }) {
  return (
    <div className="space-y-3">
      {cls.units.map((unit) => (
        <div key={unit.id} className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[14.5px] font-medium" style={{ color: "var(--fg)" }}>{unit.title}</p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
                {unit.ibTheme} · {unit.lessons.length} lesson{unit.lessons.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Link
              href={`/create?classId=${cls.id}&unitId=${unit.id}`}
              className="btn btn-ghost btn-sm flex items-center gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" /> Add lesson
            </Link>
          </div>
          {unit.lessons.length > 0 && (
            <div className="space-y-1">
              {unit.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/library/lessons/${lesson.id}`}
                  className="flex items-center gap-3 rounded-[8px] px-3 py-2 transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: lesson.slides.length > 0 ? "var(--green)" : "var(--amber)" }} />
                  <span className="flex-1 text-[13px] truncate" style={{ color: "var(--fg)" }}>{lesson.title}</span>
                  <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>{lesson.duration} min</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--fg-faint)" }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
      {cls.units.length === 0 && (
        <div className="card flex items-center justify-center py-12 text-center">
          <div>
            <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>No units yet.</p>
            <Link href={`/create?classId=${cls.id}`} className="btn btn-primary btn-sm mt-3 inline-flex">
              <Plus className="h-3.5 w-3.5" /> Plan first lesson
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function LessonsTab({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="space-y-1.5">
      {lessons.map((lesson) => {
        const quizAttempts = lesson.quizzes.flatMap((q) => q.attempts);
        const avg = avgScore(quizAttempts);
        return (
          <Link
            key={lesson.id}
            href={`/library/lessons/${lesson.id}`}
            className="card card-hover flex items-center gap-4 px-4 py-3"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: lesson.slides.length > 0 ? "var(--green)" : "var(--amber)" }}
            />
            <p className="flex-1 text-[13.5px] font-medium truncate" style={{ color: "var(--fg)" }}>
              {lesson.title}
            </p>
            <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-subtle)" }}>
              {lesson.duration} min
            </span>
            {avg !== null && (
              <Chip
                label={`${avg}%`}
                variant={avg >= 70 ? "green" : "amber"}
              />
            )}
            <Chip
              label={lesson.slides.length > 0 ? "Ready" : "Draft"}
              variant={lesson.slides.length > 0 ? "green" : "amber"}
            />
            <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--fg-faint)" }} />
          </Link>
        );
      })}
      {lessons.length === 0 && (
        <div className="card flex items-center justify-center py-12 text-center">
          <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>No lessons yet.</p>
        </div>
      )}
    </div>
  );
}
