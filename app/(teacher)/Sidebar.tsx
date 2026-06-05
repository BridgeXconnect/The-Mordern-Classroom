"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  BookOpen, CalendarDays, Inbox, GraduationCap,
  Sparkles, FileStack, Library, Settings,
  LayoutGrid, ListFilter, Headphones, ClipboardCheck,
} from "lucide-react";

/* ── Mode definitions ── */
const MODES = [
  { key: "plan",    label: "Plan" },
  { key: "create",  label: "Create" },
  { key: "library", label: "Library" },
] as const;
type Mode = (typeof MODES)[number]["key"];

/* ── Per-mode nav items ── */
const MODE_NAV: Record<Mode, { href: string; label: string; icon: React.ElementType; badge?: string }[]> = {
  plan: [
    { href: "/plan",             label: "Dashboard",       icon: LayoutGrid },
    { href: "/plan/calendar",    label: "Calendar",        icon: CalendarDays },
    { href: "/plan/attention",   label: "Needs attention", icon: Inbox, badge: "3" },
    { href: "/plan/classes",     label: "Classes",         icon: GraduationCap },
  ],
  create: [
    { href: "/create",           label: "Copilot",         icon: Sparkles },
    { href: "/create/templates", label: "Templates",       icon: FileStack },
  ],
  library: [
    { href: "/library",          label: "All lessons",     icon: Library },
    { href: "/library/slides",   label: "Slides",          icon: LayoutGrid },
    { href: "/library/worksheets", label: "Worksheets",    icon: ListFilter },
    { href: "/library/quizzes",  label: "Quizzes",         icon: ClipboardCheck },
    { href: "/library/media",    label: "Media",           icon: Headphones },
  ],
};

function detectMode(pathname: string): Mode {
  if (pathname.startsWith("/create"))  return "create";
  if (pathname.startsWith("/library")) return "library";
  return "plan";
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const activeMode = detectMode(pathname);
  const navItems = MODE_NAV[activeMode];

  return (
    <aside
      className="flex h-full flex-col select-none"
      style={{
        width: "var(--sidebar-w)",
        background: "var(--surface-2)",
        borderRight: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* ── Brand block ── */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <div
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center"
          style={{
            borderRadius: "7px",
            background: "var(--accent-color)",
            color: "var(--accent-fg)",
          }}
        >
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="font-serif text-[14px] font-semibold"
            style={{ color: "var(--fg)", letterSpacing: "-0.01em" }}
          >
            EduForge
          </span>
          <span
            className="font-mono text-[9.5px] tracking-[0.16em] uppercase"
            style={{ color: "var(--fg-faint)" }}
          >
            The Modern Classroom
          </span>
        </div>
      </div>

      {/* ── Mode segmented control ── */}
      <div className="px-3 pb-3 shrink-0">
        <div
          className="flex gap-0.5 rounded-[9px] p-0.5"
          style={{ background: "var(--hover)", border: "1px solid var(--border-soft)" }}
        >
          {MODES.map(({ key, label }) => (
            <Link
              key={key}
              href={key === "plan" ? "/plan" : key === "create" ? "/create" : "/library"}
              className={cn(
                "flex flex-1 items-center justify-center rounded-[7px] py-[6px] text-[12px] font-medium transition-all duration-100",
              )}
              style={
                activeMode === key
                  ? {
                      background: "var(--surface)",
                      color: "var(--fg)",
                      boxShadow: "var(--shadow-sm)",
                    }
                  : { color: "var(--fg-subtle)" }
              }
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mode-specific nav ── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        <p className="section-label px-2 pt-1 pb-1.5">
          {activeMode === "plan" ? "Plan" : activeMode === "create" ? "Create" : "Library"}
        </p>
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const isActive = pathname === href || (href !== "/plan" && href !== "/create" && href !== "/library" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-[13px] transition-colors relative"
              style={
                isActive
                  ? { background: "var(--active)", color: "var(--fg)", fontWeight: 500 }
                  : { color: "var(--fg-muted)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "var(--hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "";
              }}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" style={{ opacity: isActive ? 1 : 0.55 }} />
              <span className="flex-1 truncate">{label}</span>
              {badge && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[10px] font-semibold"
                  style={{ background: "var(--red-bg)", color: "var(--red)" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* ── User strip ── */}
      <div
        className="shrink-0 flex items-center gap-2.5 px-3 py-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {/* Avatar */}
        <div
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold overflow-hidden"
          style={{ background: "var(--accent-soft)", color: "var(--accent-color)" }}
        >
          {user?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            (user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0] ?? "T").toUpperCase()
          )}
        </div>

        <div className="flex flex-col leading-none min-w-0 flex-1">
          <span className="text-[12.5px] font-medium truncate" style={{ color: "var(--fg)" }}>
            {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Teacher"}
          </span>
          <span className="font-mono text-[10px]" style={{ color: "var(--fg-faint)" }}>
            IB Language B
          </span>
        </div>

        <Link
          href="/settings"
          className="btn-icon shrink-0"
          style={{ color: "var(--fg-faint)" }}
          title="Settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}
