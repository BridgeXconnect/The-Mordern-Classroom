"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHead, Segmented } from "@/components/ui/ef-primitives";

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 08–17
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const CLASS_COLORS: Record<string, string> = {
  "IB Year 1": "blue",
  "IB Year 2": "teal",
  "B1 Intensive": "amber",
};

const MOCK_EVENTS = [
  { id: "1", title: "Present Perfect — Experiences", class: "IB Year 1", day: 0, start: 9,  end: 9.75 },
  { id: "2", title: "Passive Voice — News",          class: "IB Year 2", day: 1, start: 10, end: 10.75 },
  { id: "3", title: "Listening: Travel Docs",        class: "B1 Intensive",day: 2,start: 14,end: 14.75 },
  { id: "4", title: "Modal Verbs Review",            class: "IB Year 1", day: 3, start: 9,  end: 9.75 },
  { id: "5", title: "Speaking: Role Play",           class: "IB Year 2", day: 4, start: 11, end: 11.75 },
];

const SWATCH_BG: Record<string, string> = {
  blue: "oklch(0.58 0.12 250 / 0.15)",
  teal: "oklch(0.60 0.12 195 / 0.15)",
  amber: "oklch(0.70 0.12 75 / 0.15)",
};
const SWATCH_BORDER: Record<string, string> = {
  blue: "oklch(0.58 0.12 250)",
  teal: "oklch(0.60 0.12 195)",
  amber: "oklch(0.70 0.12 75)",
};

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("week");
  const today = new Date();
  const todayDay = (today.getDay() + 6) % 7; // 0=Mon

  return (
    <div className="max-w-[1080px] mx-auto animate-fade-up">
      <PageHead
        eyebrow="Plan"
        title="Calendar"
        actions={
          <div className="flex items-center gap-2">
            <Segmented
              options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]}
              value={view}
              onChange={setView}
            />
            <button className="btn btn-ghost btn-sm">Add block</button>
          </div>
        }
      />

      {view === "week" ? (
        <div className="card overflow-hidden" style={{ padding: 0 }}>
          {/* Header row */}
          <div
            className="grid border-b"
            style={{
              gridTemplateColumns: "60px repeat(5, 1fr)",
              borderColor: "var(--border)",
            }}
          >
            <div style={{ borderRight: "1px solid var(--border)" }} />
            {WEEK_DAYS.map((d, i) => {
              const isT = i === todayDay;
              return (
                <div
                  key={d}
                  className="py-3 text-center"
                  style={{
                    borderRight: i < 4 ? "1px solid var(--border-soft)" : undefined,
                    background: isT ? "var(--accent-soft)" : undefined,
                  }}
                >
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--fg-subtle)" }}>{d}</p>
                  {isT && (
                    <p className="font-serif text-[18px] font-semibold mt-0.5" style={{ color: "var(--accent-color)" }}>
                      {today.getDate()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Body — hour rows */}
          <div className="relative" style={{ height: `${HOURS.length * 56}px` }}>
            {/* Hour grid lines */}
            {HOURS.map((h, i) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex"
                style={{ top: i * 56, height: 56, borderBottom: "1px solid var(--border-soft)" }}
              >
                <div
                  className="flex items-start justify-end px-2 pt-1 font-mono text-[10px] shrink-0"
                  style={{ width: 60, color: "var(--fg-faint)", borderRight: "1px solid var(--border-soft)" }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
                {WEEK_DAYS.map((_, di) => (
                  <div
                    key={di}
                    className="flex-1"
                    style={{ borderRight: di < 4 ? "1px solid var(--border-soft)" : undefined }}
                  />
                ))}
              </div>
            ))}

            {/* Events */}
            {MOCK_EVENTS.map((ev) => {
              const color = CLASS_COLORS[ev.class] ?? "blue";
              const topPct = ((ev.start - 8) / HOURS.length) * 100;
              const heightPct = ((ev.end - ev.start) / HOURS.length) * 100;
              const colWidth = (100 - (60 / 10)) / 5; // approx
              return (
                <div
                  key={ev.id}
                  className="absolute rounded-[6px] px-2 py-1.5 overflow-hidden cursor-pointer"
                  style={{
                    top: `${((ev.start - 8) * 56)}px`,
                    height: `${((ev.end - ev.start) * 56) - 4}px`,
                    left: `${60 + ev.day * ((100 - 60 / 6) / 5) + 4}px`,
                    width: `calc(${100 / 5}% - 8px - ${ev.day === 0 ? 60 / 5 : 0}px)`,
                    background: SWATCH_BG[color],
                    borderLeft: `3px solid ${SWATCH_BORDER[color]}`,
                  }}
                >
                  <p className="text-[11.5px] font-medium leading-snug truncate" style={{ color: "var(--fg)" }}>
                    {ev.title}
                  </p>
                  <p className="font-mono text-[10px]" style={{ color: "var(--fg-muted)" }}>{ev.class}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month view */
        <MonthView />
      )}
    </div>
  );
}

function MonthView() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, i) => {
    const dayNum = i - startOffset + 1;
    return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
  });

  return (
    <div className="card overflow-hidden" style={{ padding: 0 }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2 text-center font-mono text-[10.5px] uppercase tracking-[0.1em]" style={{ color: "var(--fg-subtle)" }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((dayNum, i) => {
          const isT = dayNum === today.getDate();
          return (
            <div
              key={i}
              className="border-b border-r"
              style={{
                minHeight: 92,
                borderColor: "var(--border-soft)",
                background: isT ? "var(--accent-soft)" : undefined,
                padding: 8,
              }}
            >
              {dayNum && (
                <span
                  className="font-serif text-[15px]"
                  style={{ color: isT ? "var(--accent-color)" : "var(--fg-muted)", fontWeight: isT ? 600 : 400 }}
                >
                  {dayNum}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
