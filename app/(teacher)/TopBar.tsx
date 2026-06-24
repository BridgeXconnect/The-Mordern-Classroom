"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, MonitorSmartphone, StickyNote } from "lucide-react";

const MODE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/create",  title: "Create" },
  { prefix: "/library", title: "Library" },
  { prefix: "/plan",    title: "Plan" },
  { prefix: "/settings", title: "Settings" },
];

function getModeTitle(pathname: string) {
  return MODE_TITLES.find((m) => pathname.startsWith(m.prefix))?.title ?? "Plan";
}

export function TopBar() {
  const pathname = usePathname();
  const modeTitle = getModeTitle(pathname);

  return (
    <div
      className="flex h-[54px] shrink-0 items-center justify-between px-6"
      style={{
        background: "color-mix(in oklch, var(--bg) 80%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {/* Left: mode title */}
      <div className="flex items-center gap-3">
        <h1
          className="font-serif text-[16px]"
          style={{ color: "var(--fg)", fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          {modeTitle}
        </h1>
        <span
          className="font-mono text-[10px] tracking-[0.14em] uppercase"
          style={{ color: "var(--fg-faint)" }}
        >
          EduForge
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Student preview */}
        <Link
          href="/quiz/preview"
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
          style={{ fontSize: "12.5px" }}
        >
          <MonitorSmartphone className="h-3.5 w-3.5" />
          Student preview
        </Link>

        {/* Design notes */}
        <button
          type="button"
          className="btn-icon"
          title="Design notes"
          style={{ color: "var(--fg-subtle)" }}
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* Notifications bell */}
        <Link
          href="/plan/attention"
          className="btn-icon relative"
          style={{ color: "var(--fg-subtle)" }}
          title="Needs attention"
        >
          <Bell className="h-4 w-4" />
          {/* unread dot */}
          <span
            className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--red)" }}
          />
        </Link>
      </div>
    </div>
  );
}
