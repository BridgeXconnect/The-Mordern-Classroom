"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ExternalLink } from "lucide-react";
import { Chip, CefrBadge, Swatch } from "@/components/ui/ef-primitives";

type Tab = "plan" | "slides" | "worksheet" | "quiz" | "media";

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const msg = typeof data?.error === "string" ? data.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

/** Primary/ghost button that runs an async generation, shows loading + error, then refreshes. */
function GenerateButton({
  label,
  run,
  variant = "primary",
  className = "",
}: {
  label: string;
  run: () => Promise<void>;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      await run();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`btn btn-${variant} btn-sm`}
        style={{ opacity: loading ? 0.6 : 1 }}
      >
        {loading ? "Generating…" : label}
      </button>
      {error && (
        <p className="text-[11.5px] text-center" style={{ color: "var(--red, #dc2626)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface Lesson {
  id: string;
  title: string;
  objectives: unknown;
  duration: number;
  ibAlignment: unknown;
  unit: { title: string; class: { name: string; cefrLevel: string; color?: string | null } };
  slides: { id: string; order: number; type: string; content: unknown }[];
  worksheets: { id: string }[];
  quizzes: { id: string; shareToken: string; type: string; questions: unknown; attempts: unknown[] }[];
  mediaAssets: { id: string; type: string; title?: string | null; url: string }[];
}

export function LessonDetail({ lesson }: { lesson: Lesson }) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const cls = lesson.unit.class;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "plan",      label: "Lesson plan" },
    { key: "slides",    label: "Slides",      count: lesson.slides.length },
    { key: "worksheet", label: "Worksheet",   count: lesson.worksheets.length },
    { key: "quiz",      label: "Quiz",        count: lesson.quizzes.length },
    { key: "media",     label: "Media",       count: lesson.mediaAssets.length },
  ];

  return (
    <div className="max-w-[1040px] mx-auto animate-fade-up">
      {/* Back */}
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 mb-5 font-mono text-[11.5px] transition-colors"
        style={{ color: "var(--fg-subtle)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Library
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Swatch color={cls.color ?? "blue"} size={9} />
          <span className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>{cls.name}</span>
          <CefrBadge level={cls.cefrLevel} />
          <Chip label="Draft" variant="amber" />
        </div>
        <h1
          className="font-serif text-[28px] mb-2"
          style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.015em" }}
        >
          {lesson.title}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="chip">{lesson.duration} min</span>
          <span className="chip">{lesson.unit.title}</span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Link href="/create" className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Ask copilot
          </Link>
          <button className="btn btn-primary btn-sm">Present</button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0 mb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className="px-4 py-2.5 text-[13px] font-medium transition-colors relative"
            style={{
              color: activeTab === key ? "var(--fg)" : "var(--fg-subtle)",
              borderBottom: activeTab === key ? "2px solid var(--accent-color)" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className="ml-1.5 font-mono text-[10px] px-1 py-0.5 rounded"
                style={{ background: "var(--surface-2)", color: "var(--fg-muted)" }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "plan" && <PlanTab lesson={lesson} />}
      {activeTab === "slides" && <SlidesTab slides={lesson.slides} lessonId={lesson.id} />}
      {activeTab === "worksheet" && <WorksheetTab worksheets={lesson.worksheets} lessonId={lesson.id} />}
      {activeTab === "quiz" && (
        <QuizTab quizzes={lesson.quizzes} lessonId={lesson.id} cefrLevel={cls.cefrLevel} />
      )}
      {activeTab === "media" && (
        <MediaTab assets={lesson.mediaAssets} lessonId={lesson.id} lessonTitle={lesson.title} />
      )}
    </div>
  );
}

function PlanTab({ lesson }: { lesson: Lesson }) {
  const stages = [
    { label: "Warm-up",    duration: "10 min", teacher: "Elicit prior knowledge.", student: "Share experiences." },
    { label: "Input",      duration: "15 min", teacher: "Present the language point.", student: "Take notes." },
    { label: "Practice",   duration: "10 min", teacher: "Monitor gap-fill activity.", student: "Complete exercises." },
    { label: "Production", duration: "8 min",  teacher: "Facilitate pair discussion.", student: "Role-play conversation." },
    { label: "Feedback",   duration: "2 min",  teacher: "Correct errors, summarise.", student: "Self-evaluate." },
  ];

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 280px" }}>
      <div className="space-y-3">
        {stages.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-medium text-[14px]" style={{ color: "var(--fg)" }}>{s.label}</h3>
              <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-subtle)" }}>{s.duration}</span>
            </div>
            <div className="grid gap-2 text-[13px]" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>Teacher</p>
                <p style={{ color: "var(--fg-muted)" }}>{s.teacher}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>Students</p>
                <p style={{ color: "var(--fg-muted)" }}>{s.student}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-4 self-start space-y-3">
        <p className="section-label">IB Alignment</p>
        {["ATL: Thinking skills", "ATL: Communication", "Global context: Identities"].map((a) => (
          <div key={a} className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--green)" }} />
            {a}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlidesTab({ slides, lessonId }: { slides: Lesson["slides"]; lessonId: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>{slides.length} slides</p>
        <button className="btn btn-ghost btn-sm">Export PPTX</button>
        <button className="btn btn-primary btn-sm">Present</button>
      </div>
      {slides.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No slides yet.</p>
          <GenerateButton
            label="Generate slides"
            className="mt-3"
            run={async () => {
              await postJSON("/api/generate/slides", { lessonId });
            }}
          />
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {slides.map((slide, i) => (
            <div key={slide.id} className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow" style={{ padding: 0 }}>
              <div className="ph" style={{ aspectRatio: "16/9" }} />
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-[10px]" style={{ color: "var(--fg-subtle)" }}>
                  {slide.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WorksheetTab({ worksheets, lessonId }: { worksheets: Lesson["worksheets"]; lessonId: string }) {
  return (
    <div>
      {worksheets.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No worksheet yet.</p>
          <GenerateButton
            label="Generate worksheet"
            className="mt-3"
            run={async () => {
              await postJSON("/api/generate/worksheet", { lessonId });
            }}
          />
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            {["Gap-fill", "Reading comprehension", "Writing prompt"].map((section) => (
              <div key={section} className="card p-4">
                <p className="text-[13.5px] font-medium mb-1" style={{ color: "var(--fg)" }}>{section}</p>
                <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>Section content goes here.</p>
              </div>
            ))}
          </div>
          <div className="shrink-0">
            <button className="btn btn-ghost btn-sm">Export PDF</button>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizTab({
  quizzes,
  lessonId,
  cefrLevel,
}: {
  quizzes: Lesson["quizzes"];
  lessonId: string;
  cefrLevel: string;
}) {
  const quiz = quizzes[0];
  return (
    <div>
      {!quiz ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No quiz yet.</p>
          <GenerateButton
            label="Generate quiz"
            className="mt-3"
            run={async () => {
              // Generate returns unsaved questions; persist them via POST /api/quizzes.
              const gen = await postJSON("/api/generate/quiz", {
                lessonId,
                type: "POST",
                questionTypes: ["multiple-choice", "fill-in-blank"],
                questionCount: 6,
              });
              await postJSON("/api/quizzes", {
                lessonId,
                type: gen.type ?? "POST",
                cefrLevel: gen.cefrLevel ?? cefrLevel,
                questions: gen.questions,
              });
            }}
          />
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 280px" }}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Attempts",       value: quiz.attempts.length },
                { label: "Avg score",      value: "—" },
                { label: "Needs review",   value: "—" },
              ].map(({ label, value }) => (
                <div key={label} className="card p-4 text-center">
                  <p className="font-serif text-[24px]" style={{ color: "var(--fg)" }}>{value}</p>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.08em]" style={{ color: "var(--fg-subtle)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Share card */}
          <div className="card p-4 flex flex-col gap-3 self-start">
            <p className="section-label">Share</p>
            <div className="ph rounded-[8px]" style={{ height: 80 }} />
            <p className="font-mono text-[10.5px] break-all" style={{ color: "var(--fg-subtle)" }}>
              /quiz/{quiz.shareToken.slice(0, 8)}…
            </p>
            <Link
              href={`/quiz/${quiz.shareToken}`}
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Student view
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaTab({
  assets,
  lessonId,
  lessonTitle,
}: {
  assets: Lesson["mediaAssets"];
  lessonId: string;
  lessonTitle: string;
}) {
  const generateImage = async () => {
    await postJSON("/api/generate/image", {
      lessonId,
      prompt: `Classroom illustration for an ESL lesson titled "${lessonTitle}"`,
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>{assets.length} assets</p>
        <GenerateButton label="Generate media" variant="ghost" run={generateImage} />
      </div>
      {assets.length === 0 ? (
        <div className="card flex flex-col items-center py-12 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No media yet.</p>
          <GenerateButton label="Generate media" className="mt-3" run={generateImage} />
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {assets.map((a) => (
            <div key={a.id} className="card overflow-hidden" style={{ padding: 0 }}>
              <div className="ph relative" style={{ aspectRatio: "4/3" }}>
                <span
                  className="absolute bottom-1.5 left-1.5 font-mono text-[9.5px] px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(0,0,0,0.5)", color: "#fff" }}
                >
                  {a.type}
                </span>
              </div>
              <div className="px-3 py-2">
                <p className="text-[12px] truncate" style={{ color: "var(--fg)" }}>{a.title ?? "Untitled"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
