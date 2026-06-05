import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHead, CefrBadge } from "@/components/ui/ef-primitives";

const SWATCH_COLORS = ["blue", "teal", "green", "amber", "violet", "rose", "red"];

export default async function ClassesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const classes = await db.class.findMany({
    orderBy: { name: "asc" },
    include: {
      units: {
        include: {
          lessons: { select: { id: true } },
          _count: { select: { lessons: true } },
        },
        orderBy: { order: "asc" },
      },
      _count: { select: { units: true } },
    },
  });

  return (
    <div className="max-w-[1040px] mx-auto animate-fade-up">
      <PageHead
        eyebrow="Plan"
        title="Classes"
        sub="Manage your classes, units and lesson schedule."
        actions={
          <Link href="/plan/classes/new" className="btn btn-primary flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add a class
          </Link>
        }
      />

      {classes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-serif text-[20px] mb-2" style={{ color: "var(--fg)" }}>No classes yet</p>
          <p className="text-[13px] mb-5" style={{ color: "var(--fg-muted)" }}>
            Create your first class to start organising lessons and tracking students.
          </p>
          <Link href="/plan/classes/new" className="btn btn-primary flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add a class
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((cls, i) => {
            const swatchColor = SWATCH_COLORS[i % SWATCH_COLORS.length];
            const totalLessons = cls.units.reduce((s, u) => s + u._count.lessons, 0);
            return (
              <Link
                key={cls.id}
                href={`/plan/classes/${cls.id}`}
                className="card card-hover flex items-center gap-5 px-5 py-4"
              >
                {/* Color swatch */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-white font-semibold text-[15px]"
                  style={{ background: `var(--${swatchColor === "blue" ? "blue" : swatchColor === "teal" ? "blue" : swatchColor === "green" ? "green" : swatchColor === "amber" ? "amber" : swatchColor === "violet" ? "violet" : swatchColor === "rose" ? "red" : "red"})` }}
                >
                  {cls.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14.5px] font-medium" style={{ color: "var(--fg)" }}>{cls.name}</p>
                    <CefrBadge level={cls.cefrLevel} />
                  </div>
                  <p className="font-mono text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                    {cls._count.units} unit{cls._count.units !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                    {cls.academicYear ? ` · ${cls.academicYear}` : ""}
                  </p>
                  {cls.description && (
                    <p className="text-[12.5px] mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>
                      {cls.description}
                    </p>
                  )}
                </div>

                {/* Unit list preview */}
                <div className="hidden md:flex flex-col gap-1 shrink-0 items-end">
                  {cls.units.slice(0, 3).map((unit) => (
                    <span key={unit.id} className="font-mono text-[10.5px] truncate max-w-[200px]" style={{ color: "var(--fg-faint)" }}>
                      {unit.title}
                    </span>
                  ))}
                  {cls.units.length > 3 && (
                    <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-faint)" }}>
                      +{cls.units.length - 3} more
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
