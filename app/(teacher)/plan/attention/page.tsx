"use client";

import { useState } from "react";
import { Check, ClipboardCheck, BookOpen, GraduationCap } from "lucide-react";
import { PageHead } from "@/components/ui/ef-primitives";
import Link from "next/link";

type Item = {
  id: string;
  type: "grading" | "prep" | "class";
  title: string;
  sub: string;
  time: string;
  color: "red" | "amber" | "blue";
  actionLabel: string;
  actionHref: string;
};

const MOCK_ITEMS: Item[] = [
  {
    id: "1", type: "grading", color: "red",
    title: "Unit 3 Quiz — Travel",
    sub: "12 responses awaiting review",
    time: "2h ago", actionLabel: "Grade", actionHref: "/library/quizzes",
  },
  {
    id: "2", type: "prep", color: "amber",
    title: "Passive Voice — News Reports",
    sub: "Lesson has no slides yet",
    time: "Yesterday", actionLabel: "Add slides", actionHref: "/create",
  },
  {
    id: "3", type: "class", color: "blue",
    title: "IB Year 1 — Average dropped to 62%",
    sub: "3 students below 60% threshold",
    time: "3d ago", actionLabel: "View class", actionHref: "/plan/classes",
  },
];

const COLOR_MAP = {
  red: { bg: "var(--red-bg)", fg: "var(--red)" },
  amber: { bg: "var(--amber-bg)", fg: "var(--amber)" },
  blue: { bg: "var(--blue-bg)", fg: "var(--blue)" },
};

const TYPE_ICON = {
  grading: ClipboardCheck,
  prep: BookOpen,
  class: GraduationCap,
};

export default function AttentionPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const visible = MOCK_ITEMS.filter((i) => !dismissed.has(i.id));

  return (
    <div className="max-w-[820px] mx-auto animate-fade-up">
      <PageHead
        eyebrow="Plan"
        title="Needs attention"
        sub="Prioritised queue of items requiring action."
      />

      {visible.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center animate-pop-in">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full mb-4"
            style={{ background: "var(--green-bg)" }}
          >
            <Check className="h-6 w-6" style={{ color: "var(--green)" }} />
          </div>
          <p className="font-serif text-[20px]" style={{ color: "var(--fg)" }}>Inbox zero</p>
          <p className="text-[13px] mt-1" style={{ color: "var(--fg-muted)" }}>
            You're all caught up. Nice work.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((item) => {
            const Icon = TYPE_ICON[item.type];
            const { bg, fg } = COLOR_MAP[item.color];
            return (
              <div
                key={item.id}
                className="card card-hover flex items-center gap-4 px-5 py-4 animate-fade-up"
              >
                {/* Icon tile */}
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{ background: bg }}
                >
                  <Icon className="h-4 w-4" style={{ color: fg }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium" style={{ color: "var(--fg)" }}>{item.title}</p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{item.sub}</p>
                </div>

                {/* Time */}
                <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-faint)" }}>
                  {item.time}
                </span>

                {/* Action */}
                <Link href={item.actionHref} className="btn btn-ghost btn-sm shrink-0">
                  {item.actionLabel}
                </Link>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => setDismissed((prev) => new Set([...prev, item.id]))}
                  className="btn-icon shrink-0"
                  title="Mark done"
                  style={{ color: "var(--fg-faint)" }}
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
