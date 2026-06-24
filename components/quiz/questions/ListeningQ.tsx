"use client";

import { useEffect, useState } from "react";
import { Volume2, Play, Square, ChevronDown } from "lucide-react";
import type { ListeningQuestion } from "@/types/quiz";

interface Props {
  question: ListeningQuestion;
  value?: number[];
  onAnswer: (answers: number[]) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function ListeningQ({ question, value, onAnswer }: Props) {
  const subs = question.subQuestions ?? [];
  const [answers, setAnswers] = useState<number[]>(value ?? Array(subs.length).fill(-1));
  const [speaking, setSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    return () => { if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, []);

  function choose(subIndex: number, optionIndex: number) {
    const next = [...answers];
    next[subIndex] = optionIndex;
    setAnswers(next);
    onAnswer(next);
  }

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utter = new SpeechSynthesisUtterance(question.audioText);
    utter.rate = 0.9;
    utter.lang = "en-US";
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  }

  return (
    <div className="space-y-4">
      <p className="font-serif text-[20px] leading-snug" style={{ color: "var(--fg)", fontWeight: 420 }}>
        {question.prompt}
      </p>

      {/* Audio player */}
      <div className="rounded-[12px] p-4 space-y-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {question.audioUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={question.audioUrl} className="w-full" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={speak}
                className="btn btn-ghost btn-sm flex items-center gap-1.5"
              >
                {speaking ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {speaking ? "Stop" : "Listen"}
              </button>
              <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                <Volume2 className="h-3.5 w-3.5" /> Browser voice
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTranscript((s) => !s)}
              className="flex items-center gap-1 font-mono text-[11px]"
              style={{ color: "var(--fg-subtle)" }}
            >
              <ChevronDown
                className="h-3 w-3 transition-transform"
                style={{ transform: showTranscript ? "rotate(180deg)" : undefined }}
              />
              {showTranscript ? "Hide" : "Show"} transcript
            </button>
            {showTranscript && (
              <p className="rounded-[8px] p-3 text-[13.5px] leading-relaxed" style={{ background: "var(--surface-2)", color: "var(--fg-muted)" }}>
                {question.audioText}
              </p>
            )}
          </>
        )}
      </div>

      {/* Sub-questions */}
      <div className="space-y-5">
        {subs.map((sub, si) => (
          <div key={si} className="space-y-2.5">
            <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>
              {si + 1}. {sub.prompt}
            </p>
            <div className="grid gap-2">
              {sub.options.map((opt, oi) => {
                const active = answers[si] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => choose(si, oi)}
                    className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-all"
                    style={{
                      border: active ? "1.5px solid var(--accent-color)" : "1.5px solid var(--border)",
                      background: active ? "var(--accent-soft)" : "var(--surface)",
                    }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] font-bold"
                      style={{
                        background: active ? "var(--accent-color)" : "var(--surface-2)",
                        color: active ? "var(--accent-fg)" : "var(--fg-subtle)",
                      }}
                    >
                      {LETTERS[oi] ?? oi + 1}
                    </span>
                    <span style={{ color: "var(--fg)" }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
