"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHead, Segmented } from "@/components/ui/ef-primitives";

const CEFR_OPTIONS = [
  { value: "L1", label: "L1" },
  { value: "A1", label: "A1" },
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
];

export default function NewClassPage() {
  const router = useRouter();
  const year = new Date().getFullYear();
  const [name, setName] = useState("");
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [academicYear, setAcademicYear] = useState(`${year}–${year + 1}`);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          cefrLevel,
          academicYear: academicYear.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : `Request failed (${res.status})`);
      }
      router.push("/plan/classes");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the class. Try again.");
    } finally {
      setLoading(false);
    }
  }

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

      <form onSubmit={handleSubmit} className="card p-5 space-y-4 mt-2">
        <div className="space-y-1.5">
          <label className="section-label" htmlFor="name">Class name</label>
          <input
            id="name"
            className="field"
            placeholder="e.g. English B — Group 3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <span className="section-label">CEFR level</span>
          <Segmented options={CEFR_OPTIONS} value={cefrLevel} onChange={setCefrLevel} />
        </div>

        <div className="space-y-1.5">
          <label className="section-label" htmlFor="year">Academic year</label>
          <input
            id="year"
            className="field"
            placeholder="2025–2026"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="section-label" htmlFor="desc">
            Description <span style={{ color: "var(--fg-faint)" }}>(optional)</span>
          </label>
          <textarea
            id="desc"
            className="field resize-none"
            rows={2}
            placeholder="Any notes about this class…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-[12.5px]" style={{ color: "var(--red, #dc2626)" }}>{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Link href="/plan/classes" className="btn btn-ghost btn-sm">Cancel</Link>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={loading || !name.trim()}
            style={{ opacity: loading || !name.trim() ? 0.6 : 1 }}
          >
            {loading ? "Creating…" : "Create class"}
          </button>
        </div>
      </form>
    </div>
  );
}
