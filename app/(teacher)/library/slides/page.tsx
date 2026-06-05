import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHead, CefrBadge } from "@/components/ui/ef-primitives";

export default async function SlidesLibraryPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const lessons = await db.lesson.findMany({
    where: { slides: { some: {} } },
    include: { slides: true, unit: { include: { class: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-[1120px] mx-auto animate-fade-up">
      <PageHead eyebrow="Library" title="Slides" />
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            href={`/library/lessons/${lesson.id}?tab=slides`}
            className="card card-hover overflow-hidden"
            style={{ padding: 0 }}
          >
            <div className="ph" style={{ aspectRatio: "16/9" }} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CefrBadge level={lesson.unit.class.cefrLevel} />
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-subtle)" }}>
                  {lesson.slides.length} slides
                </span>
              </div>
              <p className="font-serif text-[15px]" style={{ color: "var(--fg)" }}>{lesson.title}</p>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{lesson.unit.class.name}</p>
            </div>
          </Link>
        ))}
        {lessons.length === 0 && (
          <div className="col-span-full card flex items-center justify-center py-12 text-center">
            <p style={{ color: "var(--fg-muted)" }}>No slide decks yet. Create a lesson to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
