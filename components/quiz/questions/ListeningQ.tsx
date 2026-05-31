"use client";

import { useEffect, useState } from "react";
import { Volume2, Play, Square, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function choose(subIndex: number, optionIndex: number) {
    const next = [...answers];
    next[subIndex] = optionIndex;
    setAnswers(next);
    onAnswer(next);
  }

  // Browser-voice fallback until Phase 7 generates real TTS audio.
  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
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
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>

      {/* Audio player */}
      <div className="rounded-xl border bg-muted/30 p-4">
        {question.audioUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <audio controls src={question.audioUrl} className="w-full" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={speak} className="gap-1.5">
                {speaking ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {speaking ? "Stop" : "Listen"}
              </Button>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Volume2 className="h-3.5 w-3.5" /> Played with your browser voice
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTranscript((s) => !s)}
              className="flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              <ChevronDown className={cn("h-3 w-3 transition-transform", showTranscript && "rotate-180")} />
              {showTranscript ? "Hide" : "Show"} transcript
            </button>
            {showTranscript && (
              <p className="rounded-lg bg-background p-3 text-sm leading-relaxed">{question.audioText}</p>
            )}
          </div>
        )}
      </div>

      {/* Sub-questions */}
      <div className="space-y-5">
        {subs.map((sub, si) => (
          <div key={si} className="space-y-2.5">
            <p className="text-sm font-medium">
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
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2 text-left text-sm transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-accent"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold",
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {LETTERS[oi] ?? oi + 1}
                    </span>
                    {opt}
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
