"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronDown, Mic, RotateCcw, Eye, Check, Plus, BookOpen, LayoutGrid, FileText, ClipboardCheck, Headphones, X, Pencil, MessageCircle } from "lucide-react";
import { Swatch, CefrBadge, Segmented } from "@/components/ui/ef-primitives";
import { buildAssetPreview, type AssetKind } from "@/lib/asset-preview";
import { RefineSidebar } from "./RefineSidebar";

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

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const sessionKey = (id: string) => `copilot-session-${id}`;

type SessionStore = {
  lessonId: string;
  text: string;
  selectedClassId: string;
  duration: "45" | "60" | "75";
  angles: Angle[];
  chosenAngle: number | null;
  assetState: Record<AssetKey, AssetStatus>;
  assetData: Partial<Record<AssetKey, unknown>>;
  savedAt: number;
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

function assetGenerator(key: AssetKey, lessonId: string, lessonTitle: string, additionalNotes?: string): () => Promise<unknown> {
  switch (key) {
    case "slides":
      return () => postJSON("/api/generate/slides", {
        lessonId,
        ...(additionalNotes ? { additionalNotes } : {}),
      });
    case "worksheet":
      return () => postJSON("/api/generate/worksheet", {
        lessonId,
        ...(additionalNotes ? { additionalNotes } : {}),
      });
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
        return gen;
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

export function CopilotView({ classes, initialLessonId }: { classes: Cls[]; initialLessonId?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [classList, setClassList] = useState<Cls[]>(classes);
  const [showNewClass, setShowNewClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Cls | null>(classes[0] ?? null);
  const [duration, setDuration] = useState<"45" | "60" | "75">("45");
  const [phase, setPhase] = useState<Phase>("idle");
  const [angles, setAngles] = useState<Angle[]>([]);
  const [chosenAngle, setChosenAngle] = useState<number | null>(null);
  const [assetState, setAssetState] = useState<Record<AssetKey, AssetStatus>>(INITIAL_ASSETS);
  const [assetData, setAssetData] = useState<Partial<Record<AssetKey, unknown>>>({});
  const [preview, setPreview] = useState<AssetKey | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showRefine, setShowRefine] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on phase/status change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, assetState]);

  // Session restore: if initialLessonId is provided, try to restore from localStorage
  useEffect(() => {
    if (!initialLessonId) return;
    try {
      const raw = localStorage.getItem(sessionKey(initialLessonId));
      if (!raw) return;
      const session = JSON.parse(raw) as SessionStore;
      if (Date.now() - session.savedAt > SESSION_TTL) {
        localStorage.removeItem(sessionKey(initialLessonId));
        return;
      }
      const restoredClass = classes.find((c) => c.id === session.selectedClassId);
      if (!restoredClass) return;

      setLessonId(session.lessonId);
      setText(session.text ?? "");
      setSelectedClass(restoredClass);
      setDuration(session.duration ?? "45");
      setAngles(session.angles ?? []);
      setChosenAngle(session.chosenAngle ?? null);
      setAssetState(session.assetState ?? INITIAL_ASSETS);
      setAssetData(session.assetData ?? {});
      setPhase("built");
      setShowRefine(true);
    } catch {
      // ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save session to localStorage while building/built
  useEffect(() => {
    if (!lessonId || (phase !== "building" && phase !== "built")) return;
    if (!selectedClass) return;
    const session: SessionStore = {
      lessonId,
      text,
      selectedClassId: selectedClass.id,
      duration,
      angles,
      chosenAngle,
      assetState,
      assetData,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(sessionKey(lessonId), JSON.stringify(session));
    } catch {
      // quota exceeded — not critical
    }
  }, [lessonId, phase, assetState, assetData, text, selectedClass, duration, angles, chosenAngle]);

  async function handleGenerate() {
    if (!text.trim() || !selectedClass) return;
    setPhase("thinking");
    setError(null);
    setChosenAngle(null);
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
      setPhase(angles.length > 0 ? "angles" : "idle");
    }
  }

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
      const result = await fn();
      setAssetData((d) => ({ ...d, [key]: result }));
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
      const planBody = {
        summary: plan.summary,
        targets: plan.targets,
        materials: plan.materials,
        activities: plan.activities,
      };
      const lesson = await postJSON("/api/lessons", {
        unitId,
        title: plan.title,
        objectives: plan.objectives,
        duration: Number(duration),
        ibAlignment: plan.ibAlignment,
        plan: planBody,
      });
      createdLessonId = lesson.id;
      setLessonId(lesson.id);
      setAssetData((d) => ({ ...d, plan: planBody }));
      setAssetState((s) => ({ ...s, plan: "ready" }));
    } catch (e) {
      setAssetState((s) => ({ ...s, plan: "error" }));
      setError(e instanceof Error ? e.message : "Could not create the lesson. Start over and try again.");
      return;
    }

    await Promise.allSettled(
      FANOUT_ASSETS.map((key) => runAsset(key, assetGenerator(key, createdLessonId, angle.title)))
    );

    setPhase("built");
  }

  const handleRefresh = useCallback(async (key: AssetKey, additionalNotes?: string) => {
    if (!lessonId || chosenAngle === null) return;
    await runAsset(key, assetGenerator(key, lessonId, angles[chosenAngle].title, additionalNotes));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, chosenAngle, angles]);

  function handleReset() {
    if (lessonId) {
      try { localStorage.removeItem(sessionKey(lessonId)); } catch { /* ignore */ }
    }
    setPhase("idle");
    setText("");
    setAngles([]);
    setChosenAngle(null);
    setAssetState(INITIAL_ASSETS);
    setAssetData({});
    setPreview(null);
    setLessonId(null);
    setError(null);
    setShowRefine(false);
  }

  function handleOpenLesson() {
    if (!lessonId) return;
    router.refresh();
    router.push(`/library/lessons/${lessonId}`);
  }

  const readyCount = KIT_ASSETS.filter(({ key }) => assetState[key] === "ready").length;
  const planFailed = assetState.plan === "error";

  return (
    <div className={`flex gap-5 ${showRefine ? "items-start" : ""}`}>
      {/* ── Main Copilot column ── */}
      <div className="flex-1 max-w-[820px] mx-auto">
        {/* ── Idle: empty composer ── */}
        {phase === "idle" && (
          <div className="flex flex-col items-center text-center pt-8 pb-4 animate-fade-up">
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

              <div
                className="flex items-center gap-2 mt-3 pt-3"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
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
                      {classList.map((cls) => (
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
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[var(--hover)] transition-colors"
                        style={{ color: "var(--accent-color)", borderTop: "1px solid var(--border-soft)" }}
                        onClick={() => { setShowNewClass(true); setShowClassPicker(false); }}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="flex-1 text-left">New class</span>
                      </button>
                    </div>
                  )}
                </div>

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
                <div className="flex items-center justify-between mb-3 gap-3">
                  <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
                    Here are three directions for this lesson. Choose one to continue.
                  </p>
                  {phase === "angles" && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      className="btn btn-ghost btn-sm flex items-center gap-1.5 shrink-0"
                      style={{ color: "var(--fg-subtle)" }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                    </button>
                  )}
                </div>
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

                      {(status === "ready" || (status === "error" && key !== "plan")) && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {status === "ready" && (
                            <button
                              type="button"
                              onClick={() => setPreview(key)}
                              className="btn btn-ghost btn-sm flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </button>
                          )}
                          {key !== "plan" && (
                            <button
                              type="button"
                              onClick={() => handleRefresh(key)}
                              className="btn btn-ghost btn-sm flex items-center gap-1"
                              title="Regenerate"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
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
                  <button
                    type="button"
                    onClick={() => setShowRefine((v) => !v)}
                    className="btn btn-ghost btn-sm flex items-center gap-1.5"
                    style={{ color: showRefine ? "var(--accent-color)" : "var(--fg-subtle)" }}
                    title="Refine with Copilot"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    {showRefine ? "Close refine" : "Refine"}
                  </button>
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

        {showNewClass && (
          <NewClassModal
            onClose={() => setShowNewClass(false)}
            onCreated={(cls) => {
              setClassList((l) => [cls, ...l]);
              setSelectedClass(cls);
              setShowNewClass(false);
            }}
          />
        )}

        {preview && (
          <AssetPreviewModal
            kind={preview}
            data={assetData[preview]}
            canEdit={!!lessonId}
            onClose={() => setPreview(null)}
            onEdit={handleOpenLesson}
          />
        )}

        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}</style>
      </div>

      {/* ── Refine sidebar ── */}
      {showRefine && lessonId && (
        <div className="sticky top-4">
          <RefineSidebar
            lessonId={lessonId}
            assetState={assetState}
            onRefresh={handleRefresh}
            onClose={() => setShowRefine(false)}
            onStartOver={handleReset}
          />
        </div>
      )}
    </div>
  );
}

function AssetStatusChip({ status }: { status: AssetStatus }) {
  if (status === "ready") return <span className="chip chip-green">Ready</span>;
  if (status === "error") return <span className="chip" style={{ color: "var(--red, #dc2626)" }}>Failed</span>;
  if (status === "loading") return <span className="chip">Generating…</span>;
  return <span className="skeleton h-4 w-16" />;
}

function AssetPreviewModal({
  kind,
  data,
  canEdit,
  onClose,
  onEdit,
}: {
  kind: AssetKey;
  data: unknown;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const view = buildAssetPreview(kind as AssetKind, data);
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-[640px] max-h-[82vh] flex flex-col p-0 animate-pop-in"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="min-w-0">
            <p className="font-serif text-[17px] truncate" style={{ color: "var(--fg)" }}>{view.title}</p>
            {view.subtitle && (
              <p className="text-[12.5px] truncate" style={{ color: "var(--fg-muted)" }}>{view.subtitle}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-icon shrink-0" style={{ color: "var(--fg-subtle)" }} aria-label="Close preview">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {view.sections.map((s, i) => (
            <div key={i}>
              <p className="text-[13px] font-medium mb-1" style={{ color: "var(--fg)" }}>{s.heading}</p>
              {s.lines.length > 0 && (
                <div className="space-y-0.5">
                  {s.lines.map((line, li) => (
                    <p key={li} className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-muted)" }}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-3 shrink-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Close</button>
          {canEdit && (
            <button type="button" onClick={onEdit} className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Pencil className="h-3.5 w-3.5" /> Edit in Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CEFR_OPTIONS = [
  { value: "L1", label: "L1" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
];

function NewClassModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (cls: Cls) => void;
}) {
  const year = new Date().getFullYear();
  const [name, setName] = useState("");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [academicYear, setAcademicYear] = useState(`${year}–${year + 1}`);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await postJSON("/api/classes", {
        name: name.trim(),
        cefrLevel,
        academicYear: academicYear.trim(),
        description: description.trim() || undefined,
      });
      onCreated({ id: created.id, name: created.name, cefrLevel: created.cefrLevel });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the class. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-[440px] p-5 space-y-4 animate-pop-in"
        style={{ background: "var(--surface)" }}
      >
        <p className="font-serif text-[18px]" style={{ color: "var(--fg)" }}>New class</p>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="section-label" htmlFor="nc-name">Class name</label>
            <input
              id="nc-name"
              className="field"
              placeholder="e.g. English B — Group 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <span className="section-label">CEFR level</span>
            <Segmented options={CEFR_OPTIONS} value={cefrLevel} onChange={setCefrLevel} />
          </div>
          <div className="space-y-1.5">
            <label className="section-label" htmlFor="nc-year">Academic year</label>
            <input
              id="nc-year"
              className="field"
              placeholder="2025–2026"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="section-label" htmlFor="nc-desc">
              Description <span style={{ color: "var(--fg-faint)" }}>(optional)</span>
            </label>
            <textarea
              id="nc-desc"
              className="field resize-none"
              rows={2}
              placeholder="Any notes about this class…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-[12.5px]" style={{ color: "var(--red, #dc2626)" }}>{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">Cancel</button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={loading || !name.trim()}
              style={{ opacity: loading || !name.trim() ? 0.6 : 1 }}
            >
              {loading ? "Creating…" : "Create class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
