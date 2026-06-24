"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, Mic, RotateCcw, Eye, Check, BookOpen, LayoutGrid, FileText, ClipboardCheck, Headphones } from "lucide-react";
import { Swatch, CefrBadge, Segmented } from "@/components/ui/ef-primitives";

type Phase = "idle" | "thinking" | "angles" | "building" | "built";

interface Cls { id: string; name: string; cefrLevel: string; }

interface Angle {
  title: string;
  blurb: string;
  skills: string[];
  fit: string;
  ibTheme: string;
  ibTextTypes: string[];
  atlSkills: string[];
}

type AssetKey = "plan" | "slides" | "worksheet" | "quiz" | "media";
type AssetStatus = "pending" | "loading" | "ready" | "error";

const QUICK_PROMPTS = [
  "A reading lesson on climate change for B1",
  "Grammar: present perfect for experiences, IB Year 1",
  "Listening activity using a TED talk about identity",
  "Vocabulary: travel idioms + gap-fill worksheet",
];

const KIT_ASSETS: { key: AssetKey; icon: typeof BookOpen; label: string }[] = [
  { key: "plan",      icon: BookOpen,       label: "Lesson plan" },
  { key: "slides",    icon: LayoutGrid,     label: "Slides" },
  { key: "worksheet", icon: FileText,       label: "Worksheet" },
  { key: "quiz",      icon: ClipboardCheck, label: "Quiz" },
  { key: "media",     icon: Headphones,     label: "Media" },
];

const INITIAL_ASSETS: Record<AssetKey, AssetStatus> = {
  plan: "pending", slides: "pending", worksheet: "pending", quiz: "pending", media: "pending",
};

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

async function getJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

/** The single-asset generation call for a persisted lesson — reused by the initial
 *  fan-out and by per-asset Refresh (#38). "plan" is the lesson itself, not refreshable. */
function assetGenerator(key: AssetKey, lessonId: string, lessonTitle: string): () => Promise<unknown> {
  switch (key) {
    case "slides":
      return () => postJSON("/api/generate/slides", { lessonId });
    case "worksheet":
      return () => postJSON("/api/generate/worksheet", { lessonId });
    case "quiz":
      return async () => {
        const gen = await postJSON("/api/generate/quiz", {
          lessonId,
          type: "POST",
          questionTypes: ["multiple-choice", "fill-in-blank"],
          questionCount: 6,
        });
        await postJSON("/api/quizzes", {
          lessonId,
          type: gen.type,
          cefrLevel: gen.cefrLevel,
          questions: gen.questions,
        });
      };
    case "media":
      return () =>
        postJSON("/api/generate/image", {
          lessonId,
          prompt: `Classroom illustration for an ESL lesson titled "${lessonTitle}"`,
        });
    default:
      return async () => {};
  }
}

const FANOUT_ASSETS: AssetKey[] = ["slides", "worksheet", "quiz", "media"];

export function CopilotView({ classes }: { classes: Cls[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [selectedClass, setSelectedClass] = useState<Cls | null>(classes[0] ?? null);
  const [duration, setDuration] = useState<"45" | "60" | "75">("45");
  const [phase, setPhase] = useState<Phase>("idle");
  const [angles, setAngles] = useState<Angle[]>([]);
  const [chosenAngle, setChosenAngle] = useState<number | null>(null);
  const [assetState, setAssetState] = useState<Record<AssetKey, AssetStatus>>(INITIAL_ASSETS);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, assetState]);

  async function handleGenerate() {
    if (!text.trim() || !selectedClass) return;
    setPhase("thinking");
    setError(null);
    try {
      const { angles: proposed } = await postJSON("/api/generate/angles", {
        prompt: text,
        classId: selectedClass.id,
        duration: Number(duration),
      });
      setAngles(proposed);
      setPhase("angles");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not propose directions. Try again.");
      setPhase("idle");
    }
  }

  /** Reuse the per-class "Copilot drafts" unit, creating it on first use. */
  async function resolveCopilotUnit(classId: string, angle: Angle): Promise<string> {
    const units: { id: string; title: string }[] = await getJSON(`/api/units?classId=${classId}`);
    const existing = units.find((u) => u.title === "Copilot drafts");
    if (existing) return existing.id;
    const created = await postJSON("/api/units", {
      classId,
      title: "Copilot drafts",
      ibTheme: angle.ibTheme,
      ibTextTypes: angle.ibTextTypes,
      atlSkills: angle.atlSkills,
    });
    return created.id;
  }

  async function runAsset(key: AssetKey, fn: () => Promise<unknown>) {
    setAssetState((s) => ({ ...s, [key]: "loading" }));
    try {
      await fn();
      setAssetState((s) => ({ ...s, [key]: "ready" }));
    } catch {
      setAssetState((s) => ({ ...s, [key]: "error" }));
    }
  }

  async function handleChooseAngle(i: number) {
    if (!selectedClass || chosenAngle !== null) return;
    const angle = angles[i];
    setChosenAngle(i);
    setError(null);
    setAssetState({ ...INITIAL_ASSETS, plan: "loading" });
    setPhase("building");

    let createdLessonId: string;
    try {
      const unitId = await resolveCopilotUnit(selectedClass.id, angle);
      const plan = await postJSON("/api/generate/lesson", {
        title: angle.title,
        unitId,
        cefrLevel: selectedClass.cefrLevel,
        duration: Number(duration),
        ibTheme: angle.ibTheme,
        ibTextTypes: angle.ibTextTypes,
        atlSkills: angle.atlSkills,
        additionalNotes: `${text}\n\nApproach: ${angle.blurb}`,
      });
      const lesson = await postJSON("/api/lessons", {
        unitId,
        title: plan.title,
        objectives: plan.objectives,
        duration: Number(duration),
        ibAlignment: plan.ibAlignment,
      });
      createdLessonId = lesson.id;
      setLessonId(lesson.id);
      setAssetState((s) => ({ ...s, plan: "ready" }));
    } catch (e) {
      setAssetState((s) => ({ ...s, plan: "error" }));
      setError(e instanceof Error ? e.message : "Could not create the lesson. Start over and try again.");
      return; // no lesson → can't generate assets
    }

    // Generate the four assets concurrently — independent, partial failure is fine.
    await Promise.allSettled(
      FANOUT_ASSETS.map((key) => runAsset(key, assetGenerator(key, createdLessonId, angle.title)))
    );

    setPhase("built");
  }

  /** #38: regenerate a single asset in place. */
  async function handleRefresh(key: AssetKey) {
    if (!lessonId || chosenAngle === null) return;
    await runAsset(key, assetGenerator(key, lessonId, angles[chosenAngle].title));
  }

  function handleReset() {
    setPhase("idle");
    setText("");
    setAngles([]);
    setChosenAngle(null);
    setAssetState(INITIAL_ASSETS);
    setLessonId(null);
    setError(null);
  }

  function handleOpenLesson() {
    if (lessonId) router.push(`/library/lessons/${lessonId}`);
  }

  const readyCount = KIT_ASSETS.filter(({ key }) => assetState[key] === "ready").length;
  const planFailed = assetState.plan === "error";

  return (
    <div className="max-w-[820px] mx-auto">
      {/* ── Idle: empty composer ── */}
      {phase === "idle" && (
        <div className="flex flex-col items-center text-center pt-8 pb-4 animate-fade-up">
          {/* Spark icon */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[12px] mb-5"
            style={{ background: "var(--accent-color)" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "var(--accent-fg)" }} />
          </div>
          <h1
            className="font-serif text-[28px] mb-1"
            style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.015em" }}
          >
            What are we making today?
          </h1>
          <p className="text-[14px] mb-8" style={{ color: "var(--fg-muted)" }}>
            Describe what you want to teach — the copilot will propose a few directions, then build the full lesson kit.
          </p>

          {/* Composer card */}
          <div
            className="w-full text-left rounded-[16px] p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}
          >
            <textarea
              className="field resize-none border-none shadow-none p-0 text-[14px] focus:shadow-none"
              style={{ minHeight: 80, background: "transparent", outline: "none", boxShadow: "none" }}
              placeholder="Describe what you want to teach…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleGenerate(); }}
            />

            {/* Controls row */}
            <div
              className="flex items-center gap-2 mt-3 pt-3"
              style={{ borderTop: "1px solid var(--border-soft)" }}
            >
              {/* Class picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowClassPicker((v) => !v)}
                  className="btn btn-ghost btn-sm flex items-center gap-1.5"
                  style={{ borderRadius: 999 }}
                >
                  {selectedClass && <Swatch color={"blue"} size={8} />}
                  <span>{selectedClass?.name ?? "Select class"}</span>
                  {selectedClass && <CefrBadge level={selectedClass.cefrLevel} />}
                  <ChevronDown className="h-3 w-3" style={{ color: "var(--fg-faint)" }} />
                </button>
                {showClassPicker && (
                  <div
                    className="absolute left-0 top-full mt-1 z-10 rounded-[10px] overflow-hidden"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-lg)",
                      minWidth: 200,
                    }}
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[var(--hover)] transition-colors"
                        style={{ color: "var(--fg)" }}
                        onClick={() => { setSelectedClass(cls); setShowClassPicker(false); }}
                      >
                        <Swatch color="blue" size={8} />
                        <span className="flex-1 text-left">{cls.name}</span>
                        <CefrBadge level={cls.cefrLevel} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Duration toggle */}
              <Segmented
                options={[{ value: "45", label: "45 min" }, { value: "60", label: "60" }, { value: "75", label: "75" }]}
                value={duration}
                onChange={(v) => setDuration(v as "45" | "60" | "75")}
              />

              <button type="button" className="btn-icon ml-1" style={{ color: "var(--fg-faint)" }}>
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                className="btn btn-primary ml-auto"
                disabled={!text.trim() || !selectedClass}
                style={{ opacity: text.trim() && selectedClass ? 1 : 0.5 }}
              >
                Generate
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[12.5px] mt-3" style={{ color: "var(--red, #dc2626)" }}>{error}</p>
          )}

          {/* Quick prompts */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setText(p)}
                className="text-[12.5px] px-3 py-1.5 rounded-full transition-colors"
                style={{
                  border: "1.5px dashed var(--border-strong)",
                  color: "var(--fg-muted)",
                  background: "transparent",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Conversation flow ── */}
      {phase !== "idle" && (
        <div className="space-y-5 animate-fade-up">
          {/* Sticky context header */}
          <div
            className="flex items-center justify-between rounded-[10px] px-4 py-2.5 sticky top-0 z-10"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-color)" }} />
              <span className="font-medium" style={{ color: "var(--fg)" }}>New build</span>
              {selectedClass && (
                <>
                  <span>·</span>
                  <Swatch color={"blue"} size={7} />
                  <span>{selectedClass.name}</span>
                  <CefrBadge level={selectedClass.cefrLevel} />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="btn-icon flex items-center gap-1 text-[12px]"
              style={{ color: "var(--fg-subtle)" }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Start over
            </button>
          </div>

          {/* Teacher bubble */}
          <div className="flex justify-end">
            <div
              className="max-w-[75%] rounded-[14px] px-4 py-3 text-[13.5px]"
              style={{
                background: "var(--accent-soft)",
                color: "var(--fg)",
                borderBottomRightRadius: 4,
              }}
            >
              <p>{text}</p>
              <p className="font-mono text-[10.5px] mt-1.5" style={{ color: "var(--fg-faint)" }}>
                {selectedClass?.name} · {selectedClass?.cefrLevel} · {duration} min
              </p>
            </div>
          </div>

          {/* Thinking */}
          {phase === "thinking" && (
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-4 w-4 shrink-0" style={{ color: "var(--accent-color)" }} />
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: "var(--fg-faint)",
                      animation: `bounce 1s ease-in-out ${i * 0.18}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Angle proposals */}
          {(phase === "angles" || phase === "building" || phase === "built") && angles.length > 0 && (
            <div className="animate-fade-up">
              <p className="text-[13px] mb-3" style={{ color: "var(--fg-muted)" }}>
                Here are three directions for this lesson. Choose one to continue.
              </p>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
              >
                {angles.map((angle, i) => {
                  const chosen = chosenAngle === i;
                  const dimmed = chosenAngle !== null && !chosen;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => phase === "angles" && handleChooseAngle(i)}
                      disabled={chosenAngle !== null}
                      className="card text-left p-4 transition-all"
                      style={{
                        opacity: dimmed ? 0.35 : 1,
                        border: chosen ? "1.5px solid var(--accent-color)" : "1px solid var(--border)",
                        background: chosen ? "var(--accent-soft)" : "var(--surface)",
                        cursor: chosenAngle !== null ? "default" : "pointer",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{angle.title}</p>
                        {chosen && (
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                            style={{ background: "var(--accent-color)" }}
                          >
                            <Check className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />
                          </span>
                        )}
                      </div>
                      <p className="text-[12.5px] mb-3 leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                        {angle.blurb}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {angle.skills.map((s) => (
                          <span key={s} className="chip">{s}</span>
                        ))}
                      </div>
                      <p className="font-mono text-[10.5px]" style={{ color: "var(--green)" }}>
                        ✓ {angle.fit}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kit building */}
          {(phase === "building" || phase === "built") && (
            <div className="animate-fade-up space-y-2.5">
              <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
                {phase === "built" ? "Your lesson kit" : "Building your lesson kit…"}
              </p>
              {KIT_ASSETS.map(({ key, icon: Icon, label }, i) => {
                const status = assetState[key];
                const ready = status === "ready";
                return (
                  <div
                    key={key}
                    className="card flex items-center gap-4 p-4 transition-all animate-fade-up"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    {/* Icon tile */}
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                      style={{
                        background: ready ? "var(--accent-soft)" : "var(--surface-2)",
                        transition: "background 0.3s",
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: ready ? "var(--accent-color)" : "var(--fg-faint)" }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span
                        className="font-mono text-[10.5px] uppercase tracking-[0.1em]"
                        style={{ color: "var(--fg-subtle)" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{label}</span>
                      <AssetStatusChip status={status} />
                    </div>

                    {/* #38: Preview / Refresh — only for persisted, non-plan assets. */}
                    {key !== "plan" && (status === "ready" || status === "error") && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {status === "ready" && (
                          <button
                            type="button"
                            onClick={handleOpenLesson}
                            className="btn btn-ghost btn-sm flex items-center gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRefresh(key)}
                          className="btn btn-ghost btn-sm flex items-center gap-1"
                          title="Regenerate"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan failure */}
          {planFailed && error && (
            <div
              className="card flex items-center justify-between gap-4 px-5 py-4"
              style={{ border: "1.5px solid var(--red, #dc2626)", background: "var(--red-bg, rgba(220,38,38,0.08))" }}
            >
              <p className="text-[13px]" style={{ color: "var(--fg)" }}>{error}</p>
              <button onClick={handleReset} className="btn btn-ghost btn-sm">Start over</button>
            </div>
          )}

          {/* Completion bar */}
          {phase === "built" && !planFailed && (
            <div
              className="card flex items-center justify-between gap-4 px-5 py-4 animate-pop-in"
              style={{ border: "1.5px solid var(--green-bg)", background: "var(--green-bg)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: "var(--green)" }}
                >
                  <Check className="h-4 w-4" style={{ color: "#fff" }} />
                </span>
                <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>
                  Lesson kit saved · {readyCount} of {KIT_ASSETS.length} assets ready
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleOpenLesson} className="btn btn-ghost btn-sm">Edit in Library</button>
                <button onClick={handleOpenLesson} className="btn btn-primary btn-sm">
                  Open lesson
                </button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function AssetStatusChip({ status }: { status: AssetStatus }) {
  if (status === "ready") return <span className="chip chip-green">Ready</span>;
  if (status === "error") return <span className="chip" style={{ color: "var(--red, #dc2626)" }}>Failed</span>;
  if (status === "loading") return <span className="chip">Generating…</span>;
  return <span className="skeleton h-4 w-16" />;
}
