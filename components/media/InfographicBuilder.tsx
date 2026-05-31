"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, ImageIcon, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TemplateType = "vocabulary-grid" | "grammar-card" | "timeline";

interface Props {
  lessonId?: string;
  onGenerated: (url: string, assetId: string) => void;
}

const TEMPLATES: { type: TemplateType; label: string; description: string }[] = [
  { type: "vocabulary-grid", label: "Vocabulary Grid",  description: "Up to 9 word cards with definitions" },
  { type: "grammar-card",    label: "Grammar Card",     description: "Rule + explanation + examples" },
  { type: "timeline",        label: "Timeline",         description: "Up to 8 dated events" },
];

export function InfographicBuilder({ lessonId, onGenerated }: Props) {
  const [template, setTemplate] = useState<TemplateType>("vocabulary-grid");
  const [title, setTitle]       = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [generating, startGen]  = useTransition();
  const [saved, setSaved]       = useState(false);

  // ── Vocabulary grid state ──────────────────────────────────────────────────
  const [words, setWords] = useState([{ word: "", definition: "", example: "" }]);

  // ── Grammar card state ─────────────────────────────────────────────────────
  const [rule, setRule]               = useState("");
  const [explanation, setExplanation] = useState("");
  const [examples, setExamples]       = useState(["", ""]);

  // ── Timeline state ─────────────────────────────────────────────────────────
  const [events, setEvents] = useState([{ date: "", event: "" }]);

  function buildData() {
    switch (template) {
      case "vocabulary-grid":
        return { title, subtitle, words: words.filter((w) => w.word && w.definition) };
      case "grammar-card":
        return { title, rule, explanation, examples: examples.filter(Boolean) };
      case "timeline":
        return { title, subtitle, events: events.filter((e) => e.date && e.event) };
    }
  }

  async function handleGenerate() {
    setError(null);
    setSaved(false);
    startGen(async () => {
      try {
        const res = await fetch("/api/generate/infographic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateType: template, lessonId, data: buildData() }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setPreviewUrl(data.url);
        onGenerated(data.url, data.id);
        setSaved(true);
      } catch {
        setError("Infographic generation failed — please try again.");
      }
    });
  }

  // ── Template-specific form ─────────────────────────────────────────────────

  function VocabForm() {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Words (max 9)</Label>
          {words.length < 9 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setWords([...words, { word: "", definition: "", example: "" }])}>
              <Plus className="h-3 w-3 mr-1" />Add word
            </Button>
          )}
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {words.map((w, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-3 gap-1">
                <Input placeholder="Word" value={w.word} className="text-xs h-8" onChange={(e) => { const n = [...words]; n[i] = { ...n[i], word: e.target.value }; setWords(n); }} />
                <Input placeholder="Definition" value={w.definition} className="text-xs h-8 col-span-1" onChange={(e) => { const n = [...words]; n[i] = { ...n[i], definition: e.target.value }; setWords(n); }} />
                <Input placeholder="Example (opt.)" value={w.example} className="text-xs h-8" onChange={(e) => { const n = [...words]; n[i] = { ...n[i], example: e.target.value }; setWords(n); }} />
              </div>
              {words.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setWords(words.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function GrammarForm() {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm font-medium">Rule</Label>
          <Input placeholder="e.g. Subject + had + past participle" value={rule} onChange={(e) => setRule(e.target.value)} className="mt-1 text-sm h-8" />
        </div>
        <div>
          <Label className="text-sm font-medium">Explanation</Label>
          <Textarea placeholder="When and how to use this grammar structure…" value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className="mt-1 text-sm resize-none" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-sm font-medium">Examples</Label>
            {examples.length < 4 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExamples([...examples, ""])}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            )}
          </div>
          {examples.map((ex, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <Input placeholder={`Example ${i + 1}`} value={ex} className="text-xs h-8" onChange={(e) => { const n = [...examples]; n[i] = e.target.value; setExamples(n); }} />
              {examples.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setExamples(examples.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function TimelineForm() {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Events (max 8)</Label>
          {events.length < 8 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEvents([...events, { date: "", event: "" }])}>
              <Plus className="h-3 w-3 mr-1" />Add event
            </Button>
          )}
        </div>
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {events.map((ev, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input placeholder="Date/Year" value={ev.date} className="text-xs h-8 w-24 shrink-0" onChange={(e) => { const n = [...events]; n[i] = { ...n[i], date: e.target.value }; setEvents(n); }} />
              <Input placeholder="Event description" value={ev.event} className="text-xs h-8 flex-1" onChange={(e) => { const n = [...events]; n[i] = { ...n[i], event: e.target.value }; setEvents(n); }} />
              {events.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setEvents(events.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Template picker */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Template</Label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => { setTemplate(t.type); setPreviewUrl(null); setSaved(false); }}
              className={`rounded-lg border p-2.5 text-left transition-colors ${template === t.type ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
            >
              <p className={`text-xs font-medium ${template === t.type ? "text-primary" : ""}`}>{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm font-medium">Title</Label>
          <Input placeholder="Infographic title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 text-sm h-8" />
        </div>
        {template !== "grammar-card" && (
          <div>
            <Label className="text-sm font-medium">Subtitle (optional)</Label>
            <Input placeholder="e.g. Unit 3 — Travel" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1 text-sm h-8" />
          </div>
        )}
      </div>

      {/* Template-specific fields */}
      {template === "vocabulary-grid" && <VocabForm />}
      {template === "grammar-card"    && <GrammarForm />}
      {template === "timeline"        && <TimelineForm />}

      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={generating || !title.trim()}
      >
        {generating ? (
          <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Rendering infographic…</>
        ) : (
          <><ImageIcon className="h-3.5 w-3.5 mr-2" />Generate Infographic</>
        )}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {previewUrl && (
        <div className="space-y-2">
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
            <Image src={previewUrl} alt={title} fill className="object-cover" unoptimized />
          </div>
          {saved && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <Check className="h-3.5 w-3.5" />Saved to media library
            </div>
          )}
        </div>
      )}
    </div>
  );
}
