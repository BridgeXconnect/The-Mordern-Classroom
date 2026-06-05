"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, Plus } from "lucide-react";
import { PageHead, Segmented, Chip, CefrBadge, AssetStrip, Swatch } from "@/components/ui/ef-primitives";

type Status = "all" | "scheduled" | "draft" | "published";

interface Lesson {
  id: string;
  title: string;
  updatedAt: Date;
  unit: { title: string; class: { name: string; cefrLevel: string; color?: string | null } };
  slides: unknown[];
  quizzes: unknown[];
  mediaAssets: unknown[];
  worksheets?: unknown[];
}

function getStatus(lesson: Lesson): { label: string; variant: "green" | "amber" | "blue" } {
  if (lesson.quizzes.length > 0 && lesson.slides.length > 0) return { label: "Published", variant: "green" };
  if (lesson.slides.length > 0) return { label: "Scheduled", variant: "blue" };
  return { label: "Draft", variant: "amber" };
}

function relTime(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LibraryGrid({ lessons }: { lessons: Lesson[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = lessons.filter((l) => {
    const q = search.toLowerCase();
    if (q && !l.title.toLowerCase().includes(q) && !l.unit.class.name.toLowerCase().includes(q)) return false;
    if (status === "draft" && getStatus(l).label !== "Draft") return false;
    if (status === "scheduled" && getStatus(l).label !== "Scheduled") return false;
    if (status === "published" && getStatus(l).label !== "Published") return false;
    return true;
  });

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      <PageHead
        eyebrow="Library"
        title="All lessons"
        actions={
          <Link href="/create" className="btn btn-primary flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New lesson
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--fg-faint)" }} />
          <input
            type="text"
            placeholder="Search lessons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-8 py-2 text-[13px]"
          />
        </div>

        {/* Status filter */}
        <Segmented
          options={[
            { value: "all", label: "All" },
            { value: "scheduled", label: "Scheduled" },
            { value: "draft", label: "Drafts" },
            { value: "published", label: "Published" },
          ]}
          value={status}
          onChange={setStatus}
        />

        {/* View toggle */}
        <div
          className="flex gap-0.5 rounded-[9px] p-0.5"
          style={{ background: "var(--hover)", border: "1px solid var(--border-soft)" }}
        >
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setViewMode(v)}
              className="rounded-[7px] p-1.5 transition-all"
              style={viewMode === v
                ? { background: "var(--surface)", boxShadow: "var(--shadow-sm)", color: "var(--fg)" }
                : { color: "var(--fg-subtle)" }
              }
            >
              {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-serif text-[18px] mb-2" style={{ color: "var(--fg)" }}>No lessons found</p>
          <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>Try adjusting your search or create a new lesson.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(296px, 1fr))" }}>
          {filtered.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((lesson) => (
            <LessonRow key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
  const { label, variant } = getStatus(lesson);
  const cls = lesson.unit.class;
  return (
    <Link
      href={`/library/lessons/${lesson.id}`}
      className="card card-hover flex flex-col overflow-hidden"
      style={{ padding: 0 }}
    >
      {/* Hatched cover */}
      <div className="ph relative" style={{ height: 96 }}>
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{ background: "rgba(0,0,0,0.45)", color: "#fff", backdropFilter: "blur(4px)" }}
          >
            <Swatch color={cls.color ?? "blue"} size={7} />
            {cls.name}
          </span>
        </div>
        <div className="absolute top-2 right-2">
          <Chip label={label} variant={variant} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-2">
          <CefrBadge level={cls.cefrLevel} />
          <span className="font-mono text-[10.5px] truncate" style={{ color: "var(--fg-subtle)" }}>
            {lesson.unit.title}
          </span>
        </div>
        <h3
          className="font-serif text-[18px] leading-snug"
          style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.01em" }}
        >
          {lesson.title}
        </h3>
      </div>

      {/* Footer */}
      <div
        className="px-4 pb-4 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border-soft)", paddingTop: 12 }}
      >
        <AssetStrip
          slides={lesson.slides.length}
          quiz={lesson.quizzes.length > 0}
          media={lesson.mediaAssets.length}
        />
        <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
          {relTime(lesson.updatedAt)}
        </span>
      </div>
    </Link>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  const { label, variant } = getStatus(lesson);
  const cls = lesson.unit.class;
  return (
    <Link
      href={`/library/lessons/${lesson.id}`}
      className="card card-hover flex items-center gap-4 px-4 py-3"
    >
      <Swatch color={cls.color ?? "blue"} size={10} />
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-medium truncate" style={{ color: "var(--fg)" }}>{lesson.title}</p>
        <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          {cls.name} · {lesson.unit.title}
        </p>
      </div>
      <div className="hidden md:block shrink-0">
        <AssetStrip slides={lesson.slides.length} quiz={lesson.quizzes.length > 0} media={lesson.mediaAssets.length} />
      </div>
      <Chip label={label} variant={variant} />
      <span className="font-mono text-[10.5px] shrink-0" style={{ color: "var(--fg-faint)" }}>
        {relTime(lesson.updatedAt)}
      </span>
    </Link>
  );
}
