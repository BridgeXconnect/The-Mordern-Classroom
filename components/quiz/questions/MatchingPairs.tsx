"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchingQuestion } from "@/types/quiz";

interface Props {
  question: MatchingQuestion;
  value?: [number, number][];
  onAnswer: (pairs: [number, number][]) => void;
}

const PAIR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500",
  "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-pink-500",
];

/** Click a left item, then a right item, to form a match. Click an existing
 *  match's badge to remove it. Right column is presented shuffled. */
export function MatchingPairsQ({ question, value, onAnswer }: Props) {
  // Stable shuffled order of right items (display position -> original index).
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

  function commit(next: [number, number][]) {
    setPairs(next);
    onAnswer(next);
  }

  function leftPairIndex(left: number) {
    return pairs.findIndex((p) => p[0] === left);
  }
  function rightPairIndex(right: number) {
    return pairs.findIndex((p) => p[1] === right);
  }

  function clickLeft(left: number) {
    const existing = leftPairIndex(left);
    if (existing >= 0) {
      // Un-match.
      commit(pairs.filter((_, i) => i !== existing));
      setActiveLeft(null);
      return;
    }
    setActiveLeft(left === activeLeft ? null : left);
  }

  function clickRight(right: number) {
    if (activeLeft === null) return;
    // Remove any existing pairing for this left or right, then add the new one.
    const filtered = pairs.filter((p) => p[0] !== activeLeft && p[1] !== right);
    commit([...filtered, [activeLeft, right]]);
    setActiveLeft(null);
  }

  const colorFor = (pairIdx: number) => PAIR_COLORS[pairIdx % PAIR_COLORS.length];

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium leading-snug">{question.prompt}</p>
      <p className="text-xs text-muted-foreground">
        Tap an item on the left, then its match on the right.
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
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all",
                  active && "border-primary ring-2 ring-primary/20",
                  !active && matched && "border-transparent",
                  !active && !matched && "border-border hover:border-primary/40"
                )}
              >
                <span>{item}</span>
                {matched && (
                  <span className={cn("h-3 w-3 shrink-0 rounded-full", colorFor(pi))} />
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
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-sm transition-all disabled:opacity-100",
                  matched ? "border-transparent" : "border-border hover:border-primary/40",
                  activeLeft !== null && !matched && "ring-1 ring-primary/30"
                )}
              >
                <span className="flex items-center gap-2">
                  {matched && <span className={cn("h-3 w-3 shrink-0 rounded-full", colorFor(pi))} />}
                  {question.rightItems[orig]}
                </span>
                {matched && <X className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {pairs.length} / {question.leftItems.length} matched
      </p>
    </div>
  );
}
