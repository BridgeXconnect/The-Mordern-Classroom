"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  const pinned = NAV_ITEMS.filter((i) => i.section === "pinned");
  const tools  = NAV_ITEMS.filter((i) => i.section === "tools");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <nav
            className="absolute left-0 top-0 flex h-full w-[220px] flex-col shadow-2xl"
            style={{
              background: "hsl(var(--sidebar-bg))",
              borderRight: "1px solid hsl(var(--sidebar-border))",
            }}
          >
            {/* Logo */}
            <div
              className="flex h-[52px] items-center justify-between px-4"
              style={{ borderBottom: "1px solid hsl(var(--sidebar-border))" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-primary/15">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-[13px] font-semibold text-foreground">EduForge</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              <div>
                <p className="section-label">Pinned</p>
                <div className="space-y-0.5 px-2">
                  {pinned.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-all",
                          active
                            ? "nav-active text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="section-label">Tools</p>
                <div className="space-y-0.5 px-2">
                  {tools.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-md px-3 py-[7px] text-[13px] transition-all",
                          active
                            ? "nav-active text-foreground font-medium"
                            : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                        )}
                      >
                        <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "text-primary" : "text-muted-foreground/60")} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
