"use client";

import React, { useState, useTransition } from "react";
import { Volume2, Loader2, Download, Check } from "lucide-react";
import type { CefrLevel } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TTS_VOICES, DEFAULT_VOICE } from "@/lib/tts-voices";

interface Props {
  lessonId?: string;
  onGenerated: (url: string, assetId: string) => void;
}

const CEFR_LEVELS: { value: CefrLevel; label: string }[] = [
  { value: "L1", label: "L1 — Slowest" },
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Natural pace" },
];

export function AudioGenerator({ lessonId, onGenerated }: Props) {
  const [text, setText]       = useState("");
  const [voiceName, setVoice] = useState<string>(DEFAULT_VOICE);
  const [cefrLevel, setLevel] = useState<CefrLevel>("B1");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cached, setCached]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [generating, startGen] = useTransition();

  async function handleGenerate() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setPreviewUrl(null);
    startGen(async () => {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, voiceName, cefrLevel, lessonId }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setPreviewUrl(data.url);
        setCached(Boolean(data.cached));
        onGenerated(data.url, "");
      } catch {
        setError("Audio generation failed — please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Script</Label>
        <Textarea
          placeholder="e.g. Hello! Today we are going to talk about our weekend plans…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={5000}
          className="resize-none text-sm"
        />
        <p className="text-xs text-muted-foreground text-right">{text.length}/5000</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Voice</Label>
          <Select value={voiceName} onValueChange={(v) => v && setVoice(v)}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {TTS_VOICES.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Speaking pace</Label>
          <Select value={cefrLevel} onValueChange={(v) => v && setLevel(v as CefrLevel)}>
            <SelectTrigger size="sm">
              <SelectValue placeholder="Select pace" />
            </SelectTrigger>
            <SelectContent>
              {CEFR_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full" onClick={handleGenerate} disabled={generating || !text.trim()}>
        {generating ? (
          <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Generating…</>
        ) : (
          <><Volume2 className="h-3.5 w-3.5 mr-2" />Generate Audio</>
        )}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {previewUrl && (
        <div className="space-y-2">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={previewUrl} className="w-full" />
          <div className="flex items-center gap-2">
            <a
              href={previewUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />Download
            </a>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium ml-auto">
              <Check className="h-3.5 w-3.5" />
              {cached ? "Reused cached audio" : "Saved to library"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
