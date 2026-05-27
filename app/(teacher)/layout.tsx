import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { BookOpen, GraduationCap, LayoutDashboard, Library, Brain } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/quizzes", label: "Quizzes", icon: Brain },
  { href: "/media", label: "Media", icon: Library },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r bg-card">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Modern Classroom</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Modern Classroom</span>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
