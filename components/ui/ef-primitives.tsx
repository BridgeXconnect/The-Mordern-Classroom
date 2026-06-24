"use client";

import { cn } from "@/lib/utils";
import { FileText, LayoutGrid, ClipboardCheck, Headphones } from "lucide-react";

/* ── Dot ── */
export function Dot({ color = "green", size = 8 }: { color?: "green" | "amber" | "blue" | "red" | "violet"; size?: number }) {
  const map = {
    green: "var(--green)", amber: "var(--amber)", blue: "var(--blue)",
    red: "var(--red)", violet: "var(--violet)",
  };
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: map[color] }}
    />
  );
}

/* ── Class color swatch circle ── */
const SWATCH_COLORS: Record<string, string> = {
  blue: "oklch(0.58 0.12 250)", teal: "oklch(0.60 0.12 195)",
  green: "oklch(0.62 0.12 150)", amber: "oklch(0.70 0.12 75)",
  red: "oklch(0.585 0.15 25)", violet: "oklch(0.56 0.12 300)",
  rose: "oklch(0.60 0.14 15)",
};

export function Swatch({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, background: SWATCH_COLORS[color] ?? color }}
    />
  );
}

/* ── CEFR badge ── */
export function CefrBadge({ level }: { level: string }) {
  return (
    <span className="cefr">{level}</span>
  );
}

/* ── Status chip ── */
type ChipVariant = "green" | "amber" | "blue" | "red" | "violet" | "default";

export function Chip({ label, variant = "default", className }: {
  label: string;
  variant?: ChipVariant;
  className?: string;
}) {
  return (
    <span className={cn("chip", variant !== "default" && `chip-${variant}`, className)}>
      {label}
    </span>
  );
}

/* ── Segmented control ── */
export function Segmented<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      className="inline-flex gap-0.5 rounded-[9px] p-0.5"
      style={{ background: "var(--hover)", border: "1px solid var(--border-soft)" }}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="rounded-[7px] px-3 py-1.5 text-[12.5px] font-medium transition-all duration-100"
          style={
            value === opt.value
              ? { background: "var(--surface)", color: "var(--fg)", boxShadow: "var(--shadow-sm)" }
              : { color: "var(--fg-subtle)" }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── Asset strip (slides / worksheet / quiz / media counts) ── */
export function AssetStrip({
  slides = 0, worksheet = false, quiz = false, media = 0,
}: {
  slides?: number;
  worksheet?: boolean;
  quiz?: boolean;
  media?: number;
}) {
  const items = [
    { icon: LayoutGrid,    count: slides,          label: "slides" },
    { icon: FileText,      count: worksheet ? 1 : 0, label: "worksheet" },
    { icon: ClipboardCheck,count: quiz ? 1 : 0,    label: "quiz" },
    { icon: Headphones,    count: media,            label: "media" },
  ];
  return (
    <div className="flex items-center gap-3">
      {items.map(({ icon: Icon, count, label }) => (
        <span
          key={label}
          className="flex items-center gap-1 font-mono text-[11px]"
          style={{ color: count > 0 ? "var(--fg-muted)" : "var(--fg-faint)", opacity: count === 0 ? 0.4 : 1 }}
        >
          <Icon className="h-3 w-3" />
          {count}
        </span>
      ))}
    </div>
  );
}

/* ── Section label ── */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label">{children}</p>;
}

/* ── Page head ── */
export function PageHead({
  eyebrow, title, sub, actions,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 animate-fade-up">
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase mb-1" style={{ color: "var(--fg-subtle)" }}>
            {eyebrow}
          </p>
        )}
        <h1
          className="font-serif text-[30px] leading-[1.1]"
          style={{ color: "var(--fg)", fontWeight: 420, letterSpacing: "-0.015em" }}
        >
          {title}
        </h1>
        {sub && (
          <p className="mt-1.5 text-[14px]" style={{ color: "var(--fg-muted)" }}>
            {sub}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 mt-1">{actions}</div>}
    </div>
  );
}
