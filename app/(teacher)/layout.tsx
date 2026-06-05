import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full shrink-0">
          <Sidebar />
        </div>

        {/* Main column */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          {/* Top bar (desktop) */}
          <div className="hidden md:block shrink-0">
            <TopBar />
          </div>

          {/* Mobile header */}
          <header
            className="flex h-[52px] shrink-0 items-center justify-between px-4 md:hidden"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div className="flex items-center gap-2">
              <MobileNav />
              <span className="font-serif text-[14px] font-medium" style={{ color: "var(--fg)" }}>
                EduForge
              </span>
            </div>
          </header>

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto"
            style={{ padding: "30px 30px 60px" }}
          >
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
