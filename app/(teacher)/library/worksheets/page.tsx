import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHead, CefrBadge } from "@/components/ui/ef-primitives";
import { FileText } from "lucide-react";

export default async function WorksheetsLibraryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const lessons = await db.lesson.findMany({
    where: { worksheets: { some: {} } },
    include: { worksheets: true, unit: { include: { class: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      <PageHead eyebrow="Library" title="Worksheets" />
      {lessons.length === 0 ? (
        <div className="card flex items-center justify-center py-16 text-center">
          <p style={{ color: "var(--fg-muted)" }}>No worksheets yet. Generate one from a lesson.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/library/lessons/${lesson.id}?tab=worksheet`}
              className="card card-hover flex items-center gap-4 px-4 py-4"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[8px] shrink-0"
                style={{ background: "var(--surface-2)" }}
              >
                <FileText className="h-4.5 w-4.5" style={{ color: "var(--fg-subtle)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium truncate" style={{ color: "var(--fg)" }}>{lesson.title}</p>
                <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>{lesson.unit.class.name}</p>
              </div>
              <CefrBadge level={lesson.unit.class.cefrLevel} />
              <span className="font-mono text-[11px]" style={{ color: "var(--fg-faint)" }}>
                {lesson.worksheets.length} worksheet{lesson.worksheets.length !== 1 ? "s" : ""}
              </span>
              <button className="btn btn-ghost btn-sm">Export PDF</button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
