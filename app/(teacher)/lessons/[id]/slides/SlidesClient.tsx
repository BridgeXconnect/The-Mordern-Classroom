"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft, Presentation, Play, Download, Loader2,
  Plus, Trash2, GripVertical, Pencil, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CefrLevel, SlideType } from "@prisma/client";
import type { SlideContent, SlideData } from "@/types/slide";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface LessonMeta {
  id: string;
  title: string;
  duration: number;
  cefrLevel: CefrLevel;
  unitTitle: string;
  className: string;
  objectives: string[];
}

interface SlideRow extends SlideData {
  id: string;
}

interface Props {
  lesson: LessonMeta;
  initialSlides: SlideRow[];
  classId: string;
}

// ── Slide type colour chips ──────────────────────────────────────────────────
const TYPE_COLORS: Record<SlideType, string> = {
  TITLE:      "bg-indigo-100 text-indigo-700",
  CONTENT:    "bg-blue-100 text-blue-700",
  VOCABULARY: "bg-emerald-100 text-emerald-700",
  GRAMMAR:    "bg-amber-100 text-amber-700",
  ACTIVITY:   "bg-pink-100 text-pink-700",
  IMAGE:      "bg-purple-100 text-purple-700",
};

const TYPE_EMOJI: Record<SlideType, string> = {
  TITLE: "🎯", CONTENT: "📄", VOCABULARY: "📚",
  GRAMMAR: "🔤", ACTIVITY: "✏️", IMAGE: "🖼️",
};

// ── Sortable slide row ───────────────────────────────────────────────────────
function SortableSlide({
  slide,
  isSelected,
  onSelect,
  onDelete,
}: {
  slide: SlideRow;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const c = slide.content as SlideContent;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 rounded-lg border p-2.5 cursor-pointer transition-colors ${
        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
        {slide.order + 1}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${TYPE_COLORS[slide.type]}`}>
            {TYPE_EMOJI[slide.type]} {slide.type}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{c.title ?? "Untitled"}</p>
      </div>

      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Slide preview card ───────────────────────────────────────────────────────
function SlidePreview({ slide }: { slide: SlideRow }) {
  const c = slide.content as SlideContent;
  const isTitle = slide.type === "TITLE";

  return (
    <div
      className={`w-full aspect-video rounded-xl border flex flex-col items-center justify-center p-8 relative overflow-hidden ${
        isTitle ? "bg-indigo-950 text-white" : "bg-white"
      }`}
    >
      {/* Title slide */}
      {isTitle && (
        <>
          <h1 className="text-2xl font-bold text-center text-white">{c.title}</h1>
          {c.subtitle && <p className="mt-2 text-indigo-300 text-center text-sm">{c.subtitle}</p>}
        </>
      )}

      {/* Content slide */}
      {slide.type === "CONTENT" && (
        <div className="w-full">
          <h2 className="text-lg font-bold text-indigo-950 border-b-2 border-indigo-600 pb-1 mb-3">{c.title}</h2>
          {c.bullets && c.bullets.length > 0 ? (
            <ul className="space-y-1.5">
              {c.bullets.slice(0, 5).map((b, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-indigo-500 shrink-0">▸</span> {b}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600 leading-relaxed">{c.body}</p>
          )}
        </div>
      )}

      {/* Vocabulary slide */}
      {slide.type === "VOCABULARY" && (
        <div className="w-full">
          <h2 className="text-base font-bold text-indigo-950 mb-3">📚 {c.title}</h2>
          <div className="flex gap-2 flex-wrap">
            {(c.vocabularyItems ?? []).slice(0, 3).map((v, i) => (
              <div key={i} className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex-1 min-w-0">
                <div className="font-semibold text-indigo-600 text-sm">{v.word}</div>
                <div className="text-xs text-gray-500 italic">{v.partOfSpeech}</div>
                <div className="text-xs text-gray-700 mt-0.5 line-clamp-2">{v.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar slide */}
      {slide.type === "GRAMMAR" && c.grammarRule && (
        <div className="w-full">
          <h2 className="text-base font-bold text-indigo-950 mb-2">🔤 {c.title}</h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-2">
            <div className="font-semibold text-indigo-600 text-sm">{c.grammarRule.rule}</div>
            <div className="text-xs text-gray-600 mt-1">{c.grammarRule.explanation}</div>
          </div>
          {c.grammarRule.examples.slice(0, 2).map((e, i) => (
            <div key={i} className="text-xs text-gray-600">▸ {e}</div>
          ))}
        </div>
      )}

      {/* Activity slide */}
      {slide.type === "ACTIVITY" && (
        <div className="w-full">
          <div className="bg-indigo-600 text-white rounded-t-lg px-3 py-1.5 font-semibold text-sm mb-2">
            ✏️ {c.title}
          </div>
          <p className="text-xs text-gray-600 mb-2">{c.activityInstructions}</p>
          <ol className="list-decimal list-inside space-y-1">
            {(c.activityItems ?? []).slice(0, 3).map((item, i) => (
              <li key={i} className="text-xs text-gray-700">{item}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Slide number badge */}
      <span className="absolute bottom-2 right-3 text-xs text-gray-300 font-mono">
        {slide.order + 1}
      </span>
    </div>
  );
}

// ── Edit dialog ──────────────────────────────────────────────────────────────
function EditDialog({
  slide,
  open,
  onClose,
  onSave,
}: {
  slide: SlideRow | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, content: SlideContent, notes: string) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [bullets, setBullets] = useState("");
  const [body, setBody] = useState("");
  const [notes, setNotes] = useState("");
  const [activityInstr, setActivityInstr] = useState("");
  const [activityItems, setActivityItems] = useState("");

  // Sync state when slide changes
  const initFromSlide = useCallback((s: SlideRow) => {
    const c = s.content as SlideContent;
    setTitle(c.title ?? "");
    setSubtitle(c.subtitle ?? "");
    setBullets((c.bullets ?? []).join("\n"));
    setBody(c.body ?? "");
    setNotes(s.speakerNotes ?? "");
    setActivityInstr(c.activityInstructions ?? "");
    setActivityItems((c.activityItems ?? []).join("\n"));
  }, []);

  if (!slide) return null;

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) initFromSlide(slide);
    else onClose();
  };

  const handleSave = async () => {
    if (!slide) return;
    setSaving(true);
    const c = slide.content as SlideContent;
    const newContent: SlideContent = {
      ...c,
      title,
      subtitle: subtitle || undefined,
      bullets: bullets ? bullets.split("\n").filter(Boolean) : undefined,
      body: body || undefined,
      activityInstructions: activityInstr || undefined,
      activityItems: activityItems ? activityItems.split("\n").filter(Boolean) : undefined,
    };
    await onSave(slide.id, newContent, notes);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[slide.type]}`}>
              {TYPE_EMOJI[slide.type]} {slide.type}
            </span>
            Edit Slide {slide.order + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
          </div>

          {slide.type === "TITLE" && (
            <div>
              <Label>Subtitle</Label>
              <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1" />
            </div>
          )}

          {slide.type === "CONTENT" && (
            <>
              <div>
                <Label>Bullet Points <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                <Textarea
                  value={bullets}
                  onChange={(e) => setBullets(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={5}
                  placeholder="First point&#10;Second point&#10;Third point"
                />
              </div>
              <div>
                <Label>Body text <span className="text-muted-foreground text-xs">(used if no bullets)</span></Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-1" rows={3} />
              </div>
            </>
          )}

          {slide.type === "ACTIVITY" && (
            <>
              <div>
                <Label>Instructions</Label>
                <Textarea value={activityInstr} onChange={(e) => setActivityInstr(e.target.value)} className="mt-1" rows={2} />
              </div>
              <div>
                <Label>Activity items <span className="text-muted-foreground text-xs">(one per line)</span></Label>
                <Textarea
                  value={activityItems}
                  onChange={(e) => setActivityItems(e.target.value)}
                  className="mt-1 font-mono text-sm"
                  rows={4}
                />
              </div>
            </>
          )}

          <div>
            <Label>Speaker Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 text-sm"
              rows={3}
              placeholder="Teacher guidance…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Generate options dialog ──────────────────────────────────────────────────
function GenerateDialog({
  open,
  onClose,
  onGenerate,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (opts: { slideCount: number; includeVocabulary: boolean; includeGrammar: boolean; includeActivity: boolean }) => Promise<void>;
}) {
  const [generating, setGenerating] = useState(false);
  const [slideCount, setSlideCount] = useState(8);
  const [includeVocabulary, setIncludeVocabulary] = useState(true);
  const [includeGrammar, setIncludeGrammar] = useState(false);
  const [includeActivity, setIncludeActivity] = useState(true);

  const handleGenerate = async () => {
    setGenerating(true);
    await onGenerate({ slideCount, includeVocabulary, includeGrammar, includeActivity });
    setGenerating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Slide Deck</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Number of slides</Label>
            <input
              type="range" min={4} max={16} step={2}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full mt-1"
            />
            <div className="text-sm text-center text-muted-foreground">{slideCount} slides</div>
          </div>

          <div className="space-y-2">
            <Label>Include optional slides</Label>
            {[
              { label: "Vocabulary slides", value: includeVocabulary, set: setIncludeVocabulary },
              { label: "Grammar slide", value: includeGrammar, set: setIncludeGrammar },
              { label: "Activity slide", value: includeActivity, set: setIncludeActivity },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => set(e.target.checked)}
                  className="rounded"
                />
                {label}
              </label>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            ⚠️ This will replace any existing slides for this lesson.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Presentation className="h-3.5 w-3.5 mr-1.5" />}
              {generating ? "Generating…" : "Generate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function SlidesClient({ lesson, initialSlides, classId }: Props) {
  const [slides, setSlides] = useState<SlideRow[]>(initialSlides);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSlides[0]?.id ?? null
  );
  const [editSlide, setEditSlide] = useState<SlideRow | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSlide = slides.find((s) => s.id === selectedId) ?? null;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async (opts: {
    slideCount: number;
    includeVocabulary: boolean;
    includeGrammar: boolean;
    includeActivity: boolean;
  }) => {
    setError(null);
    const res = await fetch("/api/generate/slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, ...opts }),
    });
    if (!res.ok) {
      setError("Generation failed. Please try again.");
      return;
    }
    const newSlides = await res.json();
    setSlides(newSlides);
    setSelectedId(newSlides[0]?.id ?? null);
  };

  // ── Reorder (drag end) ────────────────────────────────────────────────────
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = slides.findIndex((s) => s.id === active.id);
    const newIdx = slides.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(slides, oldIdx, newIdx).map((s, i) => ({
      ...s,
      order: i,
    }));
    setSlides(reordered);

    await fetch("/api/slides/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slides: reordered.map(({ id, order }) => ({ id, order })) }),
    });
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const updated = slides
      .filter((s) => s.id !== id)
      .map((s, i) => ({ ...s, order: i }));
    setSlides(updated);
    if (selectedId === id) setSelectedId(updated[0]?.id ?? null);

    await fetch(`/api/slides/${id}`, { method: "DELETE" });

    if (updated.length > 0) {
      await fetch("/api/slides/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: updated.map(({ id: sid, order }) => ({ id: sid, order })) }),
      });
    }
  };

  // ── Edit save ─────────────────────────────────────────────────────────────
  const handleSaveEdit = async (id: string, content: SlideContent, speakerNotes: string) => {
    await fetch(`/api/slides/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, speakerNotes: speakerNotes || null }),
    });
    setSlides((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content, speakerNotes } : s))
    );
  };

  // ── Add blank content slide ───────────────────────────────────────────────
  const handleAddSlide = async () => {
    const res = await fetch("/api/slides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId: lesson.id,
        type: "CONTENT",
        content: { title: "New Slide", bullets: ["Add your content here"] },
        order: slides.length,
      }),
    });
    if (!res.ok) return;
    const newSlide = await res.json();
    setSlides((prev) => [...prev, { ...newSlide, content: newSlide.content }]);
    setSelectedId(newSlide.id);
  };

  // ── Export PPTX ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: lesson.id }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${lesson.title.replace(/[^a-z0-9]/gi, "_")}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Open Reveal.js presentation in new tab ────────────────────────────────
  const handlePresent = () => {
    window.open(`/api/slides/present?lessonId=${lesson.id}`, "_blank");
  };

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="mb-4">
        <Link
          href={`/lessons/${lesson.id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> {lesson.title}
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">Slide Builder</h1>
            <Badge variant="outline">{lesson.cefrLevel}</Badge>
            <span className="text-sm text-muted-foreground">
              {slides.length} {slides.length === 1 ? "slide" : "slides"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGenerate(true)}
            >
              <Presentation className="h-3.5 w-3.5 mr-1.5" />
              {slides.length > 0 ? "Regenerate" : "Generate Deck"}
            </Button>
            {slides.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={handlePresent}>
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting
                    ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    : <Download className="h-3.5 w-3.5 mr-1.5" />}
                  Export PPTX
                </Button>
              </>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Body */}
      {slides.length === 0 ? (
        // Empty state
        <Card className="flex-1">
          <CardContent className="h-full flex flex-col items-center justify-center py-20 gap-4">
            <Presentation className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium">No slides yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Generate a deck from this lesson's objectives and content.
              </p>
            </div>
            <Button onClick={() => setShowGenerate(true)}>
              <Presentation className="h-4 w-4 mr-2" />
              Generate Slide Deck
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left: slide list */}
          <div className="w-56 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={slides.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {slides.map((slide) => (
                  <SortableSlide
                    key={slide.id}
                    slide={slide}
                    isSelected={selectedId === slide.id}
                    onSelect={() => setSelectedId(slide.id)}
                    onDelete={() => handleDelete(slide.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <button
              onClick={handleAddSlide}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border p-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add slide
            </button>
          </div>

          {/* Right: preview + edit */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {selectedSlide && (
              <>
                <SlidePreview slide={selectedSlide} />

                {/* Slide meta + edit button */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${TYPE_COLORS[selectedSlide.type]}`}>
                        {TYPE_EMOJI[selectedSlide.type]} {selectedSlide.type}
                      </span>
                      <span className="text-sm font-medium">
                        {(selectedSlide.content as SlideContent).title}
                      </span>
                    </div>
                    {selectedSlide.speakerNotes && (
                      <p className="text-xs text-muted-foreground mt-1.5 italic">
                        📝 {selectedSlide.speakerNotes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSlide(selectedSlide)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <GenerateDialog
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerate={handleGenerate}
      />
      <EditDialog
        slide={editSlide}
        open={editSlide !== null}
        onClose={() => setEditSlide(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
