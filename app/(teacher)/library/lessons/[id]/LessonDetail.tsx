"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ExternalLink } from "lucide-react";
import { Chip, CefrBadge, Swatch } from "@/components/ui/ef-primitives";
import { InlineEditField } from "@/components/ui/InlineEditField";
import type { LessonPlanBody, IbAlignment, LessonObjective } from "@/types/lesson";
import type { SlideContent } from "@/types/slide";

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

async function putJSON(url: string, body: unknown) {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(typeof data?.error === "string" ? data.error : `Request failed (${res.status})`);
  }
  return res.json();
}

async function patchJSON(url: string, body: unknown) {
  const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(typeof data?.error === "string" ? data.error : `Request failed (${res.status})`);
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
  plan: unknown;
  unit: { title: string; class: { name: string; cefrLevel: string; color?: string | null } };
  slides: { id: string; order: number; type: string; content: unknown }[];
  worksheets: { id: string }[];
  quizzes: { id: string; shareToken: string; type: string; questions: unknown; attempts: unknown[] }[];
  mediaAssets: { id: string; type: string; title?: string | null; url: string }[];
}

export function LessonDetail({ lesson }: { lesson: Lesson }) {
  const [activeTab, setActiveTab] = useState<Tab>("plan");
  const router = useRouter();
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
        <InlineEditField
          value={lesson.title}
          displayAs="h1"
          displayClassName="font-serif text-[28px] mb-2"
          inputClassName="font-serif text-[28px] mb-2"
          onSave={async (v) => {
            await putJSON(`/api/lessons/${lesson.id}`, { title: v });
            router.refresh();
          }}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <span className="chip">{lesson.duration} min</span>
          <span className="chip">{lesson.unit.title}</span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Link href={`/create?lessonId=${lesson.id}`} className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Ask copilot
          </Link>
          <button
            className="btn btn-primary btn-sm"
            disabled={lesson.slides.length === 0}
            onClick={() => window.open(`/api/slides/present?lessonId=${lesson.id}`, "_blank")}
          >
            Present
          </button>
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
  const router = useRouter();
  const plan = lesson.plan as LessonPlanBody | null;
  const ib = lesson.ibAlignment as IbAlignment | null;
  const objectives = (lesson.objectives as LessonObjective[] | null) ?? [];

  if (!plan || !plan.activities?.length) {
    return (
      <div className="card p-6 text-center">
        <p style={{ color: "var(--fg-muted)" }}>This lesson doesn’t have a detailed plan yet.</p>
        {objectives.length > 0 && (
          <ul className="mt-3 inline-block text-left space-y-1">
            {objectives.map((o, i) => (
              <li key={i} className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
                • <span className="capitalize">{o.skill}</span>: {o.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const targets = plan.targets;
  const hasTargets = !!(targets?.vocabulary?.length || targets?.grammar?.length || targets?.skills?.length);

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 300px" }}>
      {/* Main column — scripted activities */}
      <div className="space-y-4">
        {plan.summary !== undefined && (
          <InlineEditField
            value={plan.summary ?? ""}
            multiline
            displayAs="p"
            displayClassName="text-[13.5px] leading-relaxed"
            inputClassName="text-[13.5px] leading-relaxed"
            onSave={async (v) => {
              await patchJSON(`/api/lessons/${lesson.id}/plan`, { summary: v });
              router.refresh();
            }}
          />
        )}

        {plan.activities.map((a, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="chip">{a.section}</span>
              <h3 className="font-medium text-[14px]" style={{ color: "var(--fg)" }}>{a.title}</h3>
              <span className="font-mono text-[10.5px] ml-auto" style={{ color: "var(--fg-subtle)" }}>{a.durationMin} min</span>
            </div>

            {a.objectives?.length > 0 && (
              <div className="mb-2.5 space-y-0.5">
                {a.objectives.map((o, oi) => (
                  <p key={oi} className="text-[12px] flex gap-1.5">
                    <span style={{ color: "var(--green)" }}>✓</span>
                    <span style={{ color: "var(--fg-muted)" }}>{o}</span>
                  </p>
                ))}
              </div>
            )}

            {a.materials?.length > 0 && (
              <p className="text-[12px] mb-2" style={{ color: "var(--fg-subtle)" }}>
                <span className="font-mono uppercase tracking-[0.08em] text-[10px]">Materials: </span>
                {a.materials.join(", ")}
              </p>
            )}

            {a.contextSetup && (
              <div className="mb-2.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>Set-up</p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>{a.contextSetup}</p>
              </div>
            )}

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--fg-faint)" }}>Instructions</p>
              <ol className="space-y-1.5">
                {a.steps.map((step, si) => (
                  <li key={si} className="text-[13px] leading-relaxed flex gap-2">
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-faint)" }}>{si + 1}.</span>
                    <span style={{ color: "var(--fg-muted)" }}>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {a.teachingTips?.length > 0 && (
              <div className="mt-2.5 rounded-[8px] p-2.5" style={{ background: "var(--surface-2)" }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>Teaching tips</p>
                <div className="space-y-0.5">
                  {a.teachingTips.map((t, ti) => (
                    <p key={ti} className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>• {t}</p>
                  ))}
                </div>
              </div>
            )}

            {a.extension && (
              <div className="mt-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>Extension</p>
                <p className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>{a.extension}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sidebar — targets, materials, IB */}
      <div className="space-y-4 self-start">
        {hasTargets && (
          <div className="card p-4 space-y-3">
            <p className="section-label">Targets</p>
            {([["Vocabulary", targets.vocabulary], ["Grammar", targets.grammar], ["Skills", targets.skills]] as const).map(
              ([label, items]) =>
                items?.length ? (
                  <div key={label}>
                    <p className="font-mono text-[10px] uppercase tracking-[0.1em] mb-1" style={{ color: "var(--fg-faint)" }}>{label}</p>
                    <div className="space-y-0.5">
                      {items.map((it, idx) => (
                        <p key={idx} className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>• {it}</p>
                      ))}
                    </div>
                  </div>
                ) : null
            )}
          </div>
        )}

        {plan.materials?.length > 0 && (
          <div className="card p-4">
            <p className="section-label mb-2">Materials</p>
            <div className="space-y-0.5">
              {plan.materials.map((m, i) => (
                <p key={i} className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>• {m}</p>
              ))}
            </div>
          </div>
        )}

        {ib && (
          <div className="card p-4 space-y-2">
            <p className="section-label">IB alignment</p>
            {ib.globalContext && (
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--green)" }} />
                Global context: {ib.globalContext}
              </div>
            )}
            {(ib.atlSkills ?? []).map((s) => (
              <div key={String(s)} className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--green)" }} />
                <span>ATL: <span className="capitalize">{String(s).toLowerCase().replace(/_/g, " ")}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SlideThumbnail({ slide }: { slide: Lesson["slides"][number] }) {
  const c = (slide.content) as unknown as SlideContent;
  const type = slide.type;
  const isTitle = type === "TITLE";

  return (
    <div
      className={`w-full aspect-video rounded-lg flex flex-col items-center justify-center p-4 relative overflow-hidden ${
        isTitle ? "bg-indigo-950 text-white" : "bg-white border border-gray-200"
      }`}
      style={{ fontSize: "clamp(6px, 1.5vw, 11px)" }}
    >
      {isTitle && (
        <>
          <h1 className="text-[1.6em] font-bold text-center text-white leading-tight">{c.title}</h1>
          {c.subtitle && <p className="mt-1 text-indigo-300 text-center text-[1em]">{c.subtitle}</p>}
        </>
      )}

      {type === "CONTENT" && (
        <div className="w-full">
          <h2 className="text-[1.4em] font-bold text-indigo-950 border-b-2 border-indigo-600 pb-0.5 mb-2 leading-tight">{c.title}</h2>
          {c.bullets && c.bullets.length > 0 ? (
            <ul className="space-y-0.5">
              {c.bullets.slice(0, 4).map((b, i) => (
                <li key={i} className="text-[1em] text-gray-700 flex gap-1 leading-tight">
                  <span className="text-indigo-500 shrink-0">▸</span> {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[1em] text-gray-600 leading-snug line-clamp-4">{c.body}</p>
          )}
        </div>
      )}

      {type === "VOCABULARY" && (
        <div className="w-full">
          <h2 className="text-[1.3em] font-bold text-indigo-950 mb-2">📚 {c.title}</h2>
          <div className="flex gap-1.5 flex-wrap">
            {(c.vocabularyItems ?? []).slice(0, 3).map((v, i) => (
              <div key={i} className="bg-indigo-50 border border-indigo-200 rounded p-1.5 flex-1 min-w-0">
                <div className="font-semibold text-indigo-600 text-[1em]">{v.word}</div>
                <div className="text-[0.85em] text-gray-500 italic">{v.partOfSpeech}</div>
                <div className="text-[0.85em] text-gray-700 line-clamp-2">{v.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === "GRAMMAR" && c.grammarRule && (
        <div className="w-full">
          <h2 className="text-[1.3em] font-bold text-indigo-950 mb-1.5">🔤 {c.title}</h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded p-2 mb-1">
            <div className="font-semibold text-indigo-600 text-[1em]">{c.grammarRule.rule}</div>
            <div className="text-[0.85em] text-gray-600 mt-0.5">{c.grammarRule.explanation}</div>
          </div>
          {c.grammarRule.examples.slice(0, 2).map((e, i) => (
            <div key={i} className="text-[0.85em] text-gray-600">▸ {e}</div>
          ))}
        </div>
      )}

      {type === "ACTIVITY" && (
        <div className="w-full">
          <div className="bg-indigo-600 text-white rounded-t px-2 py-1 font-semibold text-[1.1em] mb-1.5">
            ✏️ {c.title}
          </div>
          <p className="text-[0.9em] text-gray-600 mb-1 line-clamp-2">{c.activityInstructions}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            {(c.activityItems ?? []).slice(0, 3).map((item, i) => (
              <li key={i} className="text-[0.85em] text-gray-700">{item}</li>
            ))}
          </ol>
        </div>
      )}

      <span className="absolute bottom-1 right-2 text-[0.8em] text-gray-300 font-mono">
        {slide.order + 1}
      </span>
    </div>
  );
}

function SlidesTab({ slides, lessonId }: { slides: Lesson["slides"]; lessonId: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>{slides.length} slides</p>
        <button className="btn btn-ghost btn-sm">Export PPTX</button>
        <button
          className="btn btn-primary btn-sm"
          disabled={slides.length === 0}
          onClick={() => window.open(`/api/slides/present?lessonId=${lessonId}`, "_blank")}
        >
          Present
        </button>
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
              <SlideThumbnail slide={slide} />
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
