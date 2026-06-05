"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Plus, BookOpen, GraduationCap } from "lucide-react";
import { PageHead, CefrBadge, Chip, Swatch } from "@/components/ui/ef-primitives";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDays() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isToday(d: Date) {
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

interface Class {
  id: string;
  name: string;
  cefrLevel: string;
  description?: string | null;
  _count: { units: number };
  units: { id: string; title: string; lessons: { id: string; title: string }[] }[];
}

interface Lesson {
  id: string;
  title: string;
  unit: { class: { name: string; cefrLevel: string } };
}

export function PlanDashboard({ classes, recentLessons }: { classes: Class[]; recentLessons: Lesson[] }) {
  const weekDays = getWeekDays();
  const today = new Date();

  const dateStr = today.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="max-w-[1080px] mx-auto space-y-8 animate-fade-up">
      {/* ── Greeting ── */}
      <PageHead
        eyebrow={dateStr}
        title="Welcome back"
        sub="Here's what's on for today."
        actions={
          <>
            <Link href="/plan/calendar" className="btn btn-ghost btn-sm flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Calendar
            </Link>
            <Link href="/create" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Plan a lesson
            </Link>
          </>
        }
      />

      {/* ── This week strip ── */}
      <div>
        <p className="section-label mb-2">This week</p>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, i) => {
            const today_ = isToday(d);
            return (
              <div
                key={i}
                className="rounded-[10px] p-2.5 text-center transition-colors"
                style={{
                  background: today_ ? "var(--accent-soft)" : "var(--surface)",
                  border: today_ ? "1.5px solid var(--accent-color)" : "1px solid var(--border)",
                }}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: "var(--fg-subtle)" }}>
                  {DAYS[i]}
                </p>
                <p
                  className="font-serif text-[17px] mt-0.5"
                  style={{
                    color: today_ ? "var(--accent-color)" : "var(--fg)",
                    fontWeight: today_ ? 600 : 400,
                  }}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        {/* Today's schedule */}
        <div>
          <p className="section-label mb-3">Today's schedule</p>
          {recentLessons.length === 0 ? (
            <div
              className="card flex flex-col items-center justify-center py-12 text-center"
            >
              <BookOpen className="h-8 w-8 mb-3" style={{ color: "var(--fg-faint)" }} />
              <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>Nothing scheduled today</p>
              <Link href="/create" className="btn btn-ghost btn-sm mt-3">Plan a lesson</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentLessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  href={`/library/lessons/${lesson.id}`}
                  className="card card-hover flex items-center gap-0 overflow-hidden"
                  style={{ padding: 0 }}
                >
                  {/* Time gutter */}
                  <div
                    className="flex flex-col items-end justify-center px-4 py-4 shrink-0 font-mono text-[11px]"
                    style={{ width: 86, color: "var(--fg-subtle)", borderRight: "1px solid var(--border-soft)" }}
                  >
                    <span>09:00</span>
                    <span style={{ color: "var(--fg-faint)" }}>09:45</span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 px-4 py-3 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Swatch color="blue" size={8} />
                      <span className="text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>
                        {lesson.unit.class.name}
                      </span>
                      <CefrBadge level={lesson.unit.class.cefrLevel} />
                    </div>
                    <p className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                      {lesson.title}
                    </p>
                  </div>

                  {/* Status + chevron */}
                  <div className="flex items-center gap-2 px-4 shrink-0">
                    <Chip label="Ready" variant="green" />
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--fg-faint)" }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Needs attention</p>
            <Link href="/plan/attention" className="font-mono text-[10.5px]" style={{ color: "var(--fg-subtle)" }}>
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { title: "Unit 3 Quiz — Travel", sub: "12 responses awaiting review", color: "red" as const },
              { title: "Passive Voice lesson", sub: "No slides added yet", color: "amber" as const },
            ].map(({ title, sub, color }) => (
              <div
                key={title}
                className="card card-hover flex items-start gap-3 p-4"
              >
                <span
                  className="mt-0.5 h-2 w-2 rounded-full shrink-0"
                  style={{ background: `var(--${color})`, marginTop: 5 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate" style={{ color: "var(--fg)" }}>{title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{sub}</p>
                </div>
                <button className="btn btn-ghost btn-sm shrink-0">Review</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Your classes ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="section-label">Your classes</p>
          <Link href="/plan/classes" className="font-mono text-[10.5px]" style={{ color: "var(--fg-subtle)" }}>
            View all
          </Link>
        </div>
        {classes.length === 0 ? (
          <div className="card flex items-center justify-center py-12 text-center">
            <div>
              <GraduationCap className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--fg-faint)" }} />
              <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>No classes yet</p>
              <Link href="/plan/classes" className="btn btn-primary btn-sm mt-3 inline-flex">
                <Plus className="h-3.5 w-3.5" /> Add a class
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(244px, 1fr))" }}
          >
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/plan/classes/${cls.id}`}
                className="card card-hover p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <Swatch color="blue" size={10} />
                  <span className="text-[14px] font-medium truncate" style={{ color: "var(--fg)" }}>
                    {cls.name}
                  </span>
                  <CefrBadge level={cls.cefrLevel} />
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                  <span>{cls._count.units} units</span>
                </div>
                {cls.description && (
                  <p className="text-[12px] truncate" style={{ color: "var(--fg-faint)" }}>
                    {cls.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
