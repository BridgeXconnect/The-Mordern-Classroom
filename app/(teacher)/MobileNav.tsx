"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, BookOpen, CalendarDays, Inbox, GraduationCap, Sparkles, FileStack, Library, LayoutGrid, ListFilter, ClipboardCheck, Headphones } from "lucide-react";

const MODES = [
  { key: "plan",    label: "Plan",    href: "/plan" },
  { key: "create",  label: "Create",  href: "/create" },
  { key: "library", label: "Library", href: "/library" },
] as const;

const MODE_NAV = {
  plan: [
    { href: "/plan",           label: "Dashboard",       icon: LayoutGrid },
    { href: "/plan/calendar",  label: "Calendar",        icon: CalendarDays },
    { href: "/plan/attention", label: "Needs attention", icon: Inbox },
    { href: "/plan/classes",   label: "Classes",         icon: GraduationCap },
  ],
  create: [
    { href: "/create",              label: "Copilot",   icon: Sparkles },
    { href: "/create/templates",    label: "Templates", icon: FileStack },
  ],
  library: [
    { href: "/library",             label: "All lessons",  icon: Library },
    { href: "/library/slides",      label: "Slides",       icon: LayoutGrid },
    { href: "/library/worksheets",  label: "Worksheets",   icon: ListFilter },
    { href: "/library/quizzes",     label: "Quizzes",      icon: ClipboardCheck },
    { href: "/library/media",       label: "Media",        icon: Headphones },
  ],
};

function detectMode(pathname: string): "plan" | "create" | "library" {
  if (pathname.startsWith("/create"))  return "create";
  if (pathname.startsWith("/library")) return "library";
  return "plan";
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const activeMode = detectMode(pathname);

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="inline-flex h-8 w-8 items-center justify-center rounded-[7px] transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
            style={{ background: "oklch(0 0 0 / 0.5)", backdropFilter: "blur(4px)" }}
          />

          <nav
            className="absolute left-0 top-0 flex h-full flex-col shadow-2xl"
            style={{
              width: "var(--sidebar-w)",
              background: "var(--surface-2)",
              borderRight: "1px solid var(--border)",
            }}
          >
            {/* Logo strip */}
            <div
              className="flex h-[52px] items-center justify-between px-4 shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[5px]"
                  style={{ background: "var(--accent-color)" }}
                >
                  <BookOpen className="h-3 w-3" style={{ color: "var(--accent-fg)" }} />
                </div>
                <span className="font-serif text-[14px] font-medium" style={{ color: "var(--fg)" }}>EduForge</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="btn-icon"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode tabs */}
            <div className="px-3 py-3 shrink-0">
              <div
                className="flex gap-0.5 rounded-[9px] p-0.5"
                style={{ background: "var(--hover)", border: "1px solid var(--border-soft)" }}
              >
                {MODES.map(({ key, label, href }) => (
                  <Link
                    key={key}
                    href={href}
                    className="flex flex-1 items-center justify-center rounded-[7px] py-1.5 text-[12px] font-medium transition-all"
                    style={
                      activeMode === key
                        ? { background: "var(--surface)", color: "var(--fg)", boxShadow: "var(--shadow-sm)" }
                        : { color: "var(--fg-subtle)" }
                    }
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mode nav */}
            <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
              <p className="section-label px-2 pt-1 pb-1.5">{activeMode}</p>
              {MODE_NAV[activeMode].map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/plan" && href !== "/create" && href !== "/library" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] transition-colors"
                    style={
                      isActive
                        ? { background: "var(--active)", color: "var(--fg)", fontWeight: 500 }
                        : { color: "var(--fg-muted)" }
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" style={{ opacity: isActive ? 1 : 0.55 }} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
