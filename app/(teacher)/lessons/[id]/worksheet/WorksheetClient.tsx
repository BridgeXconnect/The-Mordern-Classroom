"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  Download,
  Sparkles,
  Trash2,
  Loader2,
  BookOpen,
  AlignLeft,
  List,
  MessageSquare,
  PenLine,
  Columns2,
  SortAsc,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WorksheetSection, WorksheetSectionType } from "@/types/worksheet";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LessonMeta {
  id: string;
  title: string;
  cefrLevel: string;
  unitTitle: string;
  className: string;
  objectives: string[];
}

interface WorksheetData {
  id: string;
  title: string;
  sections: WorksheetSection[];
}

interface Props {
  lesson: LessonMeta;
  classId: string;
  initialWorksheet: WorksheetData | null;
}

// ── Section type config ────────────────────────────────────────────────────────

const SECTION_OPTIONS: {
  type: WorksheetSectionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  { type: "reading-passage",  label: "Reading Passage",   icon: BookOpen,     description: "Passage + comprehension questions" },
  { type: "gap-fill",         label: "Gap Fill",          icon: AlignLeft,    description: "Fill-in-the-blank with word bank" },
  { type: "vocabulary",       label: "Vocabulary",        icon: List,         description: "Word / definition / example table" },
  { type: "multiple-choice",  label: "Multiple Choice",   icon: CheckSquare,  description: "Lettered options, circle the answer" },
  { type: "matching",         label: "Matching",          icon: Columns2,     description: "Column A ↔ Column B" },
  { type: "writing-prompt",   label: "Writing Prompt",    icon: PenLine,      description: "Guided free-write with word count" },
  { type: "ordering",         label: "Ordering",          icon: SortAsc,      description: "Put items in the correct sequence" },
  { type: "discussion",       label: "Discussion",        icon: MessageSquare, description: "Partner / group discussion questions" },
];

const DEFAULT_SELECTION: WorksheetSectionType[] = [
  "vocabulary",
  "gap-fill",
  "reading-passage",
  "writing-prompt",
];

// ── Section icon colours ───────────────────────────────────────────────────────

const SECTION_COLOURS: Record<WorksheetSectionType, string> = {
  "reading-passage": "bg-sky-100 text-sky-700",
  "gap-fill":        "bg-violet-100 text-violet-700",
  vocabulary:        "bg-emerald-100 text-emerald-700",
  "multiple-choice": "bg-amber-100 text-amber-700",
  matching:          "bg-pink-100 text-pink-700",
  "writing-prompt":  "bg-orange-100 text-orange-700",
  ordering:          "bg-teal-100 text-teal-700",
  discussion:        "bg-indigo-100 text-indigo-700",
  instructions:      "bg-gray-100 text-gray-700",
  "image-description": "bg-rose-100 text-rose-700",
};

// ── Section preview ────────────────────────────────────────────────────────────

function SectionCard({ section, index }: { section: WorksheetSection; index: number }) {
  const cfg = SECTION_OPTIONS.find((o) => o.type === section.type);
  const Icon = cfg?.icon ?? FileText;
  const colour = SECTION_COLOURS[section.type] ?? "bg-gray-100 text-gray-700";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = section.content as any;

  function preview(): React.ReactNode {
    switch (section.type) {
      case "reading-passage":
        return c.passage
          ? <p className="text-xs text-muted-foreground line-clamp-2">{c.passage}</p>
          : null;
      case "gap-fill":
        return c.text
          ? <p className="text-xs text-muted-foreground line-clamp-2">{c.text}</p>
          : null;
      case "vocabulary":
        return (c.words?.length ?? 0) > 0
          ? <p className="text-xs text-muted-foreground">{c.words.map((w: { word: string }) => w.word).join(", ")}</p>
          : null;
      case "multiple-choice":
        return (c.questions?.length ?? 0) > 0
          ? <p className="text-xs text-muted-foreground">{c.questions.length} question{c.questions.length !== 1 ? "s" : ""}</p>
          : null;
      case "matching":
        return (c.leftItems?.length ?? 0) > 0
          ? <p className="text-xs text-muted-foreground">{c.leftItems.length} pairs</p>
          : null;
      case "writing-prompt":
        return c.prompt
          ? <p className="text-xs text-muted-foreground line-clamp-2">{c.prompt}</p>
          : null;
      case "ordering":
        return (c.items?.length ?? 0) > 0
          ? <p className="text-xs text-muted-foreground">{c.items.length} items to order</p>
          : null;
      case "discussion":
        return (c.questions?.length ?? 0) > 0
          ? <p className="text-xs text-muted-foreground">{c.questions.length} discussion question{c.questions.length !== 1 ? "s" : ""}</p>
          : null;
      default:
        return null;
    }
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className={`rounded-md p-2 shrink-0 ${colour}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{index + 1}.</span>
          <span className="font-medium text-sm">{section.title}</span>
          {section.points !== undefined && (
            <Badge variant="outline" className="text-xs ml-auto shrink-0">{section.points} pts</Badge>
          )}
        </div>
        {section.instructions && (
          <p className="text-xs text-muted-foreground italic mt-0.5">{section.instructions}</p>
        )}
        <div className="mt-1">{preview()}</div>
      </div>
    </div>
  );
}

// ── Generate dialog ────────────────────────────────────────────────────────────

function GenerateDialog({
  open,
  onClose,
  onGenerate,
  generating,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (types: WorksheetSectionType[], notes: string) => void;
  generating: boolean;
}) {
  const [selected, setSelected] = useState<Set<WorksheetSectionType>>(
    new Set(DEFAULT_SELECTION)
  );
  const [notes, setNotes] = useState("");

  function toggle(type: WorksheetSectionType) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }

  function handleGenerate() {
    // Preserve the insertion order of SECTION_OPTIONS for a sensible section flow
    const ordered = SECTION_OPTIONS
      .map((o) => o.type)
      .filter((t) => selected.has(t));
    onGenerate(ordered, notes);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Generate Worksheet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-sm font-medium mb-3">Select section types (1–6)</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_OPTIONS.map(({ type, label, icon: Icon, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggle(type)}
                  className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                    selected.has(type)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${selected.has(type) ? "text-primary" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-xs font-medium leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{description}</p>
                  </div>
                </button>
              ))}
            </div>
            {selected.size === 0 && (
              <p className="text-xs text-destructive mt-1">Select at least one section type.</p>
            )}
            {selected.size > 6 && (
              <p className="text-xs text-destructive mt-1">Maximum 6 sections allowed.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Additional notes (optional)</Label>
            <Textarea
              placeholder="e.g. Focus on travel vocabulary, keep reading passage under 120 words…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || selected.size === 0 || selected.size > 6}
          >
            {generating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function WorksheetClient({ lesson, classId, initialWorksheet }: Props) {
  const router = useRouter();
  const [worksheet, setWorksheet] = useState<WorksheetData | null>(initialWorksheet);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, startGenerating] = useTransition();
  const [exporting, setExporting] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // ── Generate ────────────────────────────────────────────────────────────────

  async function handleGenerate(sectionTypes: WorksheetSectionType[], additionalNotes: string) {
    setError(null);
    startGenerating(async () => {
      try {
        const res = await fetch("/api/generate/worksheet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: lesson.id,
            sectionTypes,
            additionalNotes: additionalNotes || undefined,
          }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setWorksheet({
          id: data.id,
          title: data.title,
          sections: data.sections as WorksheetSection[],
        });
        setGenerateOpen(false);
      } catch {
        setError("Failed to generate worksheet. Please try again.");
      }
    });
  }

  // ── PDF export ──────────────────────────────────────────────────────────────

  async function handleExportPdf() {
    if (!worksheet) return;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId: worksheet.id }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${worksheet.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!worksheet || !confirm("Delete this worksheet? This cannot be undone.")) return;
    startDeleting(async () => {
      try {
        const res = await fetch(`/api/worksheets/${worksheet.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Delete failed");
        setWorksheet(null);
        router.refresh();
      } catch {
        setError("Failed to delete worksheet.");
      }
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/classes/${classId}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3 w-3" /> {lesson.className}
        </Link>
        <Link
          href={`/lessons/${lesson.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
        >
          <ChevronLeft className="h-3 w-3" /> {lesson.title}
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-tight">
              {worksheet ? worksheet.title : "Worksheet"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {lesson.unitTitle} · {lesson.cefrLevel}
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">{lesson.cefrLevel}</Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={() => setGenerateOpen(true)}
          disabled={generating}
          size="sm"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-2" />
          )}
          {worksheet ? "Regenerate" : "Generate Worksheet"}
        </Button>

        {worksheet && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-2" />
              )}
              Export PDF
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive ml-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-2" />
              )}
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!worksheet && !generating && (
        <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">No worksheet yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Click <strong>Generate Worksheet</strong> to create one from your lesson plan.
          </p>
        </div>
      )}

      {/* Generating placeholder */}
      {generating && (
        <div className="rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
          <p className="font-medium">Generating worksheet…</p>
          <p className="text-sm text-muted-foreground mt-1">
            This takes 10–20 seconds depending on section count.
          </p>
        </div>
      )}

      {/* Section list */}
      {worksheet && !generating && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {worksheet.sections.length} section{worksheet.sections.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Total:{" "}
              {worksheet.sections.reduce((sum, s) => sum + (s.points ?? 0), 0)} pts
            </p>
          </div>
          {worksheet.sections.map((section, i) => (
            <SectionCard key={section.id} section={section} index={i} />
          ))}
        </div>
      )}

      {/* Generate dialog */}
      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={handleGenerate}
        generating={generating}
      />
    </div>
  );
}
