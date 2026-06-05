"use client";

import { useRef, useState, useEffect } from "react";
import { Sparkles, ChevronDown, Mic, RotateCcw, Eye, Check, BookOpen, LayoutGrid, FileText, ClipboardCheck, Headphones } from "lucide-react";
import { Swatch, CefrBadge, Segmented } from "@/components/ui/ef-primitives";
import { toast } from "sonner";

type Phase = "idle" | "thinking" | "angles" | "building" | "built";

interface Cls { id: string; name: string; cefrLevel: string; }

const QUICK_PROMPTS = [
  "A reading lesson on climate change for B1",
  "Grammar: present perfect for experiences, IB Year 1",
  "Listening activity using a TED talk about identity",
  "Vocabulary: travel idioms + gap-fill worksheet",
];

const ANGLE_PROPOSALS = [
  {
    title: "Inquiry-based discussion",
    blurb: "Students analyse real news articles, then debate the passive construction in English vs. their L1.",
    skills: ["Critical thinking", "Communication"],
    fit: "Strong fit for IB ATL skills",
  },
  {
    title: "Guided practice → production",
    blurb: "Structured grammar input with controlled practice, leading to a short newspaper-style writing task.",
    skills: ["Self-management", "Research"],
    fit: "Aligns with CEFR B2 writing descriptors",
  },
  {
    title: "Media-driven vocabulary build",
    blurb: "Short BBC news clips with gap-fill listening, then students re-tell the story using passive structures.",
    skills: ["Communication", "Thinking"],
    fit: "Ideal for mixed listening + grammar goals",
  },
];

const KIT_ASSETS = [
  { key: "plan",      icon: BookOpen,        label: "Lesson plan",  lines: ["5 stages · 45 min", "IB ATL: Thinking, Communication", "CEFR B2 aligned"] },
  { key: "slides",    icon: LayoutGrid,      label: "Slides",       lines: ["14 slides", "Warm-up → Input → Practice → Production", "Includes media placeholders"] },
  { key: "worksheet", icon: FileText,        label: "Worksheet",    lines: ["Gap-fill · Reading · Writing", "3 sections · export PDF", "Differentiated tasks"] },
  { key: "quiz",      icon: ClipboardCheck,  label: "Quiz",         lines: ["8 questions · mixed types", "MC + fill-in + word order", "Share link ready"] },
  { key: "media",     icon: Headphones,      label: "Media",        lines: ["BBC clip shortlisted", "2 infographics", "TTS audio generated"] },
];

export function CopilotView({ classes }: { classes: Cls[] }) {
  const [text, setText] = useState("");
  const [selectedClass, setSelectedClass] = useState<Cls | null>(classes[0] ?? null);
  const [duration, setDuration] = useState<"45" | "60" | "75">("45");
  const [phase, setPhase] = useState<Phase>("idle");
  const [chosenAngle, setChosenAngle] = useState<number | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phase, readyCount]);

  function handleGenerate() {
    if (!text.trim()) return;
    setPhase("thinking");
    setTimeout(() => setPhase("angles"), 1100);
  }

  function handleChooseAngle(i: number) {
    setChosenAngle(i);
    setTimeout(() => {
      setPhase("building");
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setReadyCount(count);
        if (count >= KIT_ASSETS.length) {
          clearInterval(interval);
          setTimeout(() => setPhase("built"), 300);
        }
      }, 650);
    }, 400);
  }

  function handleReset() {
    setPhase("idle");
    setText("");
    setChosenAngle(null);
    setReadyCount(0);
  }

  function handleSave() {
    toast("Saved to Library");
  }

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
                disabled={!text.trim()}
                style={{ opacity: text.trim() ? 1 : 0.5 }}
              >
                Generate
              </button>
            </div>
          </div>

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
          {(phase === "angles" || phase === "building" || phase === "built") && (
            <div className="animate-fade-up">
              <p className="text-[13px] mb-3" style={{ color: "var(--fg-muted)" }}>
                Here are three directions for this lesson. Choose one to continue.
              </p>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
              >
                {ANGLE_PROPOSALS.map((angle, i) => {
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
                Building your lesson kit…
              </p>
              {KIT_ASSETS.map(({ key, icon: Icon, label, lines }, i) => {
                const ready = i < readyCount;
                return (
                  <div
                    key={key}
                    className="card flex items-start gap-4 p-4 transition-all animate-fade-up"
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="font-mono text-[10.5px] uppercase tracking-[0.1em]"
                          style={{ color: "var(--fg-subtle)" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{label}</span>
                        {ready ? (
                          <span className="chip chip-green">Ready</span>
                        ) : (
                          <span className="skeleton h-4 w-16" />
                        )}
                      </div>
                      {ready ? (
                        <div className="space-y-0.5">
                          {lines.map((l) => (
                            <p key={l} className="text-[12.5px]" style={{ color: "var(--fg-muted)" }}>
                              {l}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="skeleton h-3 w-3/4" />
                          <div className="skeleton h-3 w-1/2" />
                        </div>
                      )}
                    </div>

                    {ready && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button className="btn btn-ghost btn-sm flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                        <button className="btn btn-ghost btn-sm flex items-center gap-1">
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion bar */}
          {phase === "built" && (
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
                  Lesson kit complete · 5 assets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm">Edit in Library</button>
                <button onClick={handleSave} className="btn btn-primary btn-sm">
                  Accept &amp; save
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
