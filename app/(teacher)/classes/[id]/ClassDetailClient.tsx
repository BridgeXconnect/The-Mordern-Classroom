"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { IB_GLOBAL_CONTEXTS, IB_TEXT_TYPES, ATL_SKILLS } from "@/lib/prompts/ibContext";
import type { AtlSkill, CefrLevel } from "@prisma/client";
import type { GeneratedLessonPlan } from "@/types/lesson";

type Lesson = { id: string; title: string; duration: number };
type Unit = { id: string; title: string; ibTheme: string; atlSkills: AtlSkill[]; lessons: Lesson[] };
type ClassData = { id: string; name: string; cefrLevel: CefrLevel; academicYear: string; units: Unit[] };

const CEFR_COLORS: Record<CefrLevel, string> = {
  L1: "bg-slate-100 text-slate-700 border-slate-200",
  A1: "bg-green-100 text-green-700 border-green-200",
  A2: "bg-blue-100 text-blue-700 border-blue-200",
  B1: "bg-yellow-100 text-yellow-700 border-yellow-200",
  B2: "bg-orange-100 text-orange-700 border-orange-200",
};

export function ClassDetailClient({ cls }: { cls: ClassData }) {
  const router = useRouter();
  const [units, setUnits] = useState(cls.units);

  // Unit creation
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitLoading, setUnitLoading] = useState(false);
  const [unitForm, setUnitForm] = useState({
    title: "",
    ibTheme: "",
    ibTextTypes: [] as string[],
    atlSkills: [] as AtlSkill[],
  });

  // Lesson generation
  const [genOpen, setGenOpen] = useState(false);
  const [genUnitId, setGenUnitId] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedLessonPlan | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [genForm, setGenForm] = useState({
    title: "",
    duration: 60,
    additionalNotes: "",
  });

  // ── Unit creation ──────────────────────────────────────────────────
  function toggleTextType(t: string) {
    setUnitForm((f) => ({
      ...f,
      ibTextTypes: f.ibTextTypes.includes(t) ? f.ibTextTypes.filter((x) => x !== t) : [...f.ibTextTypes, t],
    }));
  }

  function toggleAtlSkill(s: AtlSkill) {
    setUnitForm((f) => ({
      ...f,
      atlSkills: f.atlSkills.includes(s) ? f.atlSkills.filter((x) => x !== s) : [...f.atlSkills, s],
    }));
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitForm.ibTheme || unitForm.atlSkills.length === 0 || unitForm.ibTextTypes.length === 0) return;
    setUnitLoading(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: cls.id, ...unitForm }),
      });
      const created = await res.json();
      setUnits((u) => [...u, { ...created, lessons: [] }]);
      setUnitOpen(false);
      setUnitForm({ title: "", ibTheme: "", ibTextTypes: [], atlSkills: [] });
      router.refresh();
    } finally {
      setUnitLoading(false);
    }
  }

  // ── Lesson generation ──────────────────────────────────────────────
  function openGenForUnit(unitId: string) {
    setGenUnitId(unitId);
    setGeneratedPlan(null);
    setGenForm({ title: "", duration: 60, additionalNotes: "" });
    setGenOpen(true);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    const unit = units.find((u) => u.id === genUnitId);
    if (!unit) return;
    setGenLoading(true);
    setGeneratedPlan(null);
    try {
      const res = await fetch("/api/generate/lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...genForm,
          unitId: genUnitId,
          cefrLevel: cls.cefrLevel,
          ibTheme: unit.ibTheme,
          ibTextTypes: unit.atlSkills,
          atlSkills: unit.atlSkills,
        }),
      });
      const plan = await res.json();
      setGeneratedPlan(plan);
    } finally {
      setGenLoading(false);
    }
  }

  async function handleSaveLesson() {
    if (!generatedPlan) return;
    setSaveLoading(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: genUnitId,
          title: generatedPlan.title,
          objectives: generatedPlan.objectives,
          duration: genForm.duration,
          ibAlignment: generatedPlan.ibAlignment,
        }),
      });
      const saved = await res.json();
      setUnits((prev) =>
        prev.map((u) =>
          u.id === genUnitId ? { ...u, lessons: [...u.lessons, saved] } : u
        )
      );
      setGenOpen(false);
      router.push(`/lessons/${saved.id}`);
    } finally {
      setSaveLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/classes" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1">
            <ChevronLeft className="h-3.5 w-3.5" /> Classes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${CEFR_COLORS[cls.cefrLevel]}`}>
              {cls.cefrLevel}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{cls.academicYear} · {units.length} unit{units.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setUnitOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Unit
        </Button>
      </div>

      {/* Units */}
      {units.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground text-sm">No units yet. Create a unit to start adding lessons.</p>
            <Button onClick={() => setUnitOpen(true)} className="mt-3 gap-2" size="sm">
              <Plus className="h-4 w-4" /> New Unit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <Card key={unit.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{unit.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{unit.ibTheme}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {unit.atlSkills.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{ATL_SKILLS[s].label}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => openGenForUnit(unit.id)} size="sm" variant="outline" className="gap-1.5 shrink-0">
                    <Plus className="h-3.5 w-3.5" /> Generate Lesson
                  </Button>
                </div>
              </CardHeader>
              {unit.lessons.length > 0 && (
                <>
                  <Separator />
                  <CardContent className="pt-3 pb-2">
                    <div className="space-y-1">
                      {unit.lessons.map((lesson) => (
                        <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
                          <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-accent transition-colors">
                            <div className="flex items-center gap-2.5">
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{lesson.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{lesson.duration} min</span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── Create Unit Dialog ───────────────────────────── */}
      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUnit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ut">Unit title</Label>
              <Input id="ut" placeholder="e.g. Unit 1: Identity & Community" value={unitForm.title}
                onChange={(e) => setUnitForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>IB Global Context</Label>
              <Select value={unitForm.ibTheme} onValueChange={(v) => setUnitForm((f) => ({ ...f, ibTheme: v ?? f.ibTheme }))}>
                <SelectTrigger><SelectValue placeholder="Select context" /></SelectTrigger>
                <SelectContent>
                  {IB_GLOBAL_CONTEXTS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IB Text Types <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
              <div className="grid grid-cols-2 gap-1.5">
                {IB_TEXT_TYPES.map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <Checkbox id={`tt-${t}`} checked={unitForm.ibTextTypes.includes(t)}
                      onCheckedChange={() => toggleTextType(t)} />
                    <label htmlFor={`tt-${t}`} className="text-sm cursor-pointer capitalize">{t}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>ATL Skills</Label>
              <div className="space-y-1.5">
                {(Object.keys(ATL_SKILLS) as AtlSkill[]).map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <Checkbox id={`atl-${s}`} checked={unitForm.atlSkills.includes(s)}
                      onCheckedChange={() => toggleAtlSkill(s)} />
                    <label htmlFor={`atl-${s}`} className="text-sm cursor-pointer">{ATL_SKILLS[s].label}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setUnitOpen(false)} disabled={unitLoading}>Cancel</Button>
              <Button type="submit" disabled={unitLoading || !unitForm.ibTheme || unitForm.atlSkills.length === 0 || unitForm.ibTextTypes.length === 0}>
                {unitLoading ? "Creating…" : "Create Unit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Generate Lesson Dialog ───────────────────────── */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{generatedPlan ? "Review Lesson Plan" : "Generate Lesson"}</DialogTitle>
          </DialogHeader>

          {!generatedPlan ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="lt">Lesson topic / title</Label>
                <Input id="lt" placeholder="e.g. Reading Strategies: Skimming & Scanning" value={genForm.title}
                  onChange={(e) => setGenForm((f) => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dur">Duration (minutes)</Label>
                <Select value={String(genForm.duration)} onValueChange={(v) => setGenForm((f) => ({ ...f, duration: v ? Number(v) : f.duration }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[45, 60, 75, 90, 120].map((d) => <SelectItem key={d} value={String(d)}>{d} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Additional notes <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea id="notes" placeholder="Any specific focus, vocabulary, or requirements…" rows={2}
                  value={genForm.additionalNotes} onChange={(e) => setGenForm((f) => ({ ...f, additionalNotes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" onClick={() => setGenOpen(false)} disabled={genLoading}>Cancel</Button>
                <Button type="submit" disabled={genLoading}>
                  {genLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</> : "Generate with AI"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">{generatedPlan.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{genForm.duration} min · {cls.cefrLevel}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Objectives</p>
                <ul className="space-y-1">
                  {generatedPlan.objectives.map((o, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <Badge variant="outline" className="text-xs shrink-0 capitalize">{o.skill}</Badge>
                      <span>{o.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Lesson Stages</p>
                <div className="space-y-2">
                  {generatedPlan.stages.map((s, i) => (
                    <div key={i} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.duration} min</span>
                      </div>
                      <p className="text-xs text-muted-foreground">T: {s.teacherActivity}</p>
                      <p className="text-xs text-muted-foreground">S: {s.studentActivity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {generatedPlan.vocabulary.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Vocabulary</p>
                  <div className="flex flex-wrap gap-1">
                    {generatedPlan.vocabulary.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setGeneratedPlan(null)} className="flex-1">Regenerate</Button>
                <Button onClick={handleSaveLesson} disabled={saveLoading} className="flex-1">
                  {saveLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Lesson →"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
