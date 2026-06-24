"use client";

import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { PageHead } from "@/components/ui/ef-primitives";

export default function NewClassPage() {
  return (
    <div className="max-w-[600px] mx-auto animate-fade-up">
      <Link
        href="/plan/classes"
        className="inline-flex items-center gap-1.5 mb-5 font-mono text-[11.5px]"
        style={{ color: "var(--fg-subtle)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Classes
      </Link>

      <PageHead eyebrow="Plan" title="Add a class" />

      <div className="card flex flex-col items-center justify-center py-16 text-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[12px]"
          style={{ background: "var(--amber-bg)" }}
        >
          <Construction className="h-6 w-6" style={{ color: "var(--amber)" }} />
        </div>
        <div>
          <p className="font-serif text-[18px] mb-1" style={{ color: "var(--fg)" }}>Coming soon</p>
          <p className="text-[13px]" style={{ color: "var(--fg-muted)" }}>
            Class creation will be available in the next build. For now, classes are created via the database.
          </p>
        </div>
        <Link href="/plan/classes" className="btn btn-ghost btn-sm">Back to classes</Link>
      </div>
    </div>
  );
}
