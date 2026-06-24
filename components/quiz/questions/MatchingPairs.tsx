"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { MatchingQuestion } from "@/types/quiz";

interface Props {
  question: MatchingQuestion;
  value?: [number, number][];
  onAnswer: (pairs: [number, number][]) => void;
}

const PAIR_COLORS = [
  "oklch(0.58 0.12 250)", "oklch(0.62 0.12 150)", "oklch(0.70 0.12 75)",
  "oklch(0.56 0.12 300)", "oklch(0.585 0.15 25)", "oklch(0.60 0.12 195)",
];

export function MatchingPairsQ({ question, value, onAnswer }: Props) {
  const rightOrder = useMemo(() => {
    const idx = question.rightItems.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pairs, setPairs] = useState<[number, number][]>(value ?? []);
  const [activeLeft, setActiveLeft] = useState<number | null>(null);

  function commit(next: [number, number][]) { setPairs(next); onAnswer(next); }
  function leftPairIndex(left: number) { return pairs.findIndex((p) => p[0] === left); }
  function rightPairIndex(right: number) { return pairs.findIndex((p) => p[1] === right); }

  function clickLeft(left: number) {
    const existing = leftPairIndex(left);
    if (existing >= 0) { commit(pairs.filter((_, i) => i !== existing)); setActiveLeft(null); return; }
    setActiveLeft(left === activeLeft ? null : left);
  }

  function clickRight(right: number) {
    if (activeLeft === null) return;
    const filtered = pairs.filter((p) => p[0] !== activeLeft && p[1] !== right);
    commit([...filtered, [activeLeft, right]]);
    setActiveLeft(null);
  }

  const colorFor = (pi: number) => PAIR_COLORS[pi % PAIR_COLORS.length];

  return (
    <div className="space-y-4">
      <p className="font-serif text-[20px] leading-snug" style={{ color: "var(--fg)", fontWeight: 420 }}>
        {question.prompt}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "var(--fg-subtle)" }}>
        Tap an item on the left, then its match on the right
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {question.leftItems.map((item, i) => {
            const pi = leftPairIndex(i);
            const matched = pi >= 0;
            const active = activeLeft === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => clickLeft(i)}
                className="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-all"
                style={{
                  border: active
                    ? "1.5px solid var(--accent-color)"
                    : matched
                    ? `1.5px solid ${colorFor(pi)}40`
                    : "1.5px solid var(--border)",
                  background: active ? "var(--accent-soft)" : matched ? `${colorFor(pi)}18` : "var(--surface)",
                  boxShadow: active ? "var(--shadow-sm)" : "none",
                }}
              >
                <span style={{ color: "var(--fg)" }}>{item}</span>
                {matched && (
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: colorFor(pi) }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right column (shuffled) */}
        <div className="space-y-2">
          {rightOrder.map((orig) => {
            const pi = rightPairIndex(orig);
            const matched = pi >= 0;
            return (
              <button
                key={orig}
                type="button"
                onClick={() => clickRight(orig)}
                disabled={activeLeft === null && !matched}
                className="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13.5px] transition-all disabled:opacity-100"
                style={{
                  border: matched
                    ? `1.5px solid ${colorFor(pi)}40`
                    : activeLeft !== null
                    ? "1.5px solid var(--accent-color)"
                    : "1.5px solid var(--border)",
                  background: matched ? `${colorFor(pi)}18` : activeLeft !== null ? "var(--accent-soft)" : "var(--surface)",
                }}
              >
                <span className="flex items-center gap-2" style={{ color: "var(--fg)" }}>
                  {matched && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorFor(pi) }} />}
                  {question.rightItems[orig]}
                </span>
                {matched && <X className="h-3.5 w-3.5" style={{ color: "var(--fg-faint)" }} />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
        {pairs.length} / {question.leftItems.length} matched
      </p>
    </div>
  );
}
