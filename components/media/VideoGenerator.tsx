"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Check, Plus, Trash2, Clapperboard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TemplateType = "vocabulary-explainer" | "grammar-rule" | "reading-strategy";

interface Props {
  lessonId?:   string;
  onGenerated: (url: string, assetId: string) => void;
}

const TEMPLATES: { type: TemplateType; label: string; description: string; colour: string }[] = [
  { type: "vocabulary-explainer", label: "Vocabulary Explainer", description: "Animated word cards with definitions", colour: "bg-blue-100 text-blue-700" },
  { type: "grammar-rule",         label: "Grammar Rule",         description: "Rule + explanation + examples",    colour: "bg-emerald-100 text-emerald-700" },
  { type: "reading-strategy",     label: "Reading Strategy",     description: "Strategy + numbered steps",        colour: "bg-orange-100 text-orange-700" },
];

type CefrLevel = "L1" | "A1" | "A2" | "B1" | "B2";
const CEFR_OPTIONS: CefrLevel[] = ["L1", "A1", "A2", "B1", "B2"];

export function VideoGenerator({ lessonId, onGenerated }: Props) {
  const [template,   setTemplate]   = useState<TemplateType>("vocabulary-explainer");
  const [title,      setTitle]      = useState("");
  const [cefrLevel,  setCefrLevel]  = useState<CefrLevel>("B1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [generating, startGen]      = useTransition();
  const [saved,      setSaved]      = useState(false);

  // vocabulary-explainer state
  const [words, setWords] = useState([{ word: "", definition: "", example: "" }]);

  // grammar-rule state
  const [rule,        setRule]        = useState("");
  const [explanation, setExplanation] = useState("");
  const [examples,    setExamples]    = useState(["", ""]);

  // reading-strategy state
  const [strategy, setStrategy] = useState("");
  const [steps,    setSteps]    = useState(["", ""]);

  function buildData() {
    switch (template) {
      case "vocabulary-explainer":
        return { templateType: template, title, cefrLevel, words: words.filter((w) => w.word && w.definition) };
      case "grammar-rule":
        return { templateType: template, title, cefrLevel, rule, explanation, examples: examples.filter(Boolean) };
      case "reading-strategy":
        return { templateType: template, title, cefrLevel, strategy, steps: steps.filter(Boolean) };
    }
  }

  function isValid() {
    if (!title.trim()) return false;
    switch (template) {
      case "vocabulary-explainer": return words.some((w) => w.word && w.definition);
      case "grammar-rule":         return !!rule.trim();
      case "reading-strategy":     return !!strategy.trim() && steps.some(Boolean);
    }
  }

  async function handleGenerate() {
    setError(null);
    setSaved(false);
    startGen(async () => {
      try {
        const res = await fetch("/api/video/generate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ templateType: template, lessonId, data: buildData() }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setPreviewUrl(data.url);
        onGenerated(data.url, data.id);
        setSaved(true);
      } catch {
        setError("Video preview generation failed — please try again.");
      }
    });
  }

  // ── Template-specific forms ─────────────────────────────────────────────────

  function VocabForm() {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Words (max 6)</Label>
          {words.length < 6 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs"
              onClick={() => setWords([...words, { word: "", definition: "", example: "" }])}>
              <Plus className="h-3 w-3 mr-1" />Add
            </Button>
          )}
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {words.map((w, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <div className="flex-1 grid grid-cols-3 gap-1">
                <Input placeholder="Word" value={w.word} className="text-xs h-8"
                  onChange={(e) => { const n = [...words]; n[i] = { ...n[i], word: e.target.value }; setWords(n); }} />
                <Input placeholder="Definition" value={w.definition} className="text-xs h-8"
                  onChange={(e) => { const n = [...words]; n[i] = { ...n[i], definition: e.target.value }; setWords(n); }} />
                <Input placeholder="Example (opt.)" value={w.example} className="text-xs h-8"
                  onChange={(e) => { const n = [...words]; n[i] = { ...n[i], example: e.target.value }; setWords(n); }} />
              </div>
              {words.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setWords(words.filter((_, j) => j !== i))}>
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
      <div className="space-y-2.5">
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
            <div key={i} className="flex gap-1.5 mb-1">
              <Input placeholder={`Example ${i + 1}`} value={ex} className="text-xs h-8"
                onChange={(e) => { const n = [...examples]; n[i] = e.target.value; setExamples(n); }} />
              {examples.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setExamples(examples.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StrategyForm() {
    return (
      <div className="space-y-2.5">
        <div>
          <Label className="text-sm font-medium">Strategy name</Label>
          <Input placeholder="e.g. Skimming, Scanning, Inferencing…" value={strategy} onChange={(e) => setStrategy(e.target.value)} className="mt-1 text-sm h-8" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-sm font-medium">Steps (max 5)</Label>
            {steps.length < 5 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSteps([...steps, ""])}>
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            )}
          </div>
          {steps.map((s, i) => (
            <div key={i} className="flex gap-1.5 mb-1 items-center">
              <span className="text-xs font-semibold text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <Input placeholder={`Step ${i + 1}`} value={s} className="text-xs h-8"
                onChange={(e) => { const n = [...steps]; n[i] = e.target.value; setSteps(n); }} />
              {steps.length > 1 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lambda note */}
      <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Generates an animated <strong>preview frame</strong>. Full MP4 rendering requires Remotion Lambda (Phase 8).</span>
      </div>

      {/* Template picker */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Template</Label>
        <div className="grid grid-cols-3 gap-2">
          {TEMPLATES.map((t) => (
            <Button
              key={t.type}
              variant="outline"
              type="button"
              onClick={() => { setTemplate(t.type); setPreviewUrl(null); setSaved(false); }}
              className={`h-auto p-2.5 flex-col items-start text-left transition-colors ${template === t.type ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}
            >
              <p className={`text-xs font-medium ${template === t.type ? "text-primary" : ""}`}>{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight whitespace-normal">{t.description}</p>
            </Button>
          ))}
        </div>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-sm font-medium">Title</Label>
          <Input placeholder="e.g. Travel Vocabulary" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 text-sm h-8" />
        </div>
        <div>
          <Label className="text-sm font-medium">Level</Label>
          <div className="flex gap-1 mt-1 flex-wrap">
            {CEFR_OPTIONS.map((lvl) => (
              <Button
                key={lvl}
                variant="outline"
                size="sm"
                className={`h-8 px-2.5 text-xs ${cefrLevel === lvl ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"}`}
                onClick={() => setCefrLevel(lvl)}
              >
                {lvl}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Template-specific */}
      {template === "vocabulary-explainer" && <VocabForm />}
      {template === "grammar-rule"         && <GrammarForm />}
      {template === "reading-strategy"     && <StrategyForm />}

      <Button className="w-full" onClick={handleGenerate} disabled={generating || !isValid()}>
        {generating
          ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Rendering preview…</>
          : <><Clapperboard className="h-3.5 w-3.5 mr-2" />Generate Preview Frame</>
        }
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {previewUrl && (
        <div className="space-y-1.5">
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
