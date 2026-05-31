"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { Sparkles, Loader2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  lessonId?: string;
  onGenerated: (url: string, assetId: string) => void;
}

export function ImageGenerator({ lessonId, onGenerated }: Props) {
  const [prompt, setPrompt]       = useState("");
  const [source, setSource]       = useState<"pollinations" | "huggingface">("pollinations");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assetId, setAssetId]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [generating, startGen]    = useTransition();
  const [saved, setSaved]         = useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setError(null);
    setSaved(false);
    startGen(async () => {
      try {
        const res = await fetch("/api/generate/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), lessonId, source }),
        });
        if (!res.ok) throw new Error("Generation failed");
        const data = await res.json();
        setPreviewUrl(data.url);
        setAssetId(data.id);
        onGenerated(data.url, data.id);
        setSaved(true);
      } catch {
        setError("Image generation failed — please try again.");
      }
    });
  }

  async function handleDownload() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = "generated-image.jpg";
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Image prompt</Label>
        <Textarea
          placeholder="e.g. Students studying in a modern library, bright natural light, diverse group…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
      </div>

      {/* Source selector */}
      <div className="flex gap-2">
        {(["pollinations", "huggingface"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              source === s ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/40"
            }`}
          >
            {s === "pollinations" ? "Pollinations.ai (fast)" : "HF FLUX.1-schnell"}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
      >
        {generating ? (
          <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Generating…</>
        ) : (
          <><Sparkles className="h-3.5 w-3.5 mr-2" />Generate Image</>
        )}
      </Button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="space-y-2">
          <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
            <Image src={previewUrl} alt={prompt} fill className="object-cover" unoptimized />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5 mr-2" />Download
            </Button>
            {saved && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium px-3">
                <Check className="h-3.5 w-3.5" />Saved to library
              </div>
            )}
          </div>
          {assetId && (
            <p className="text-xs text-muted-foreground">Asset ID: {assetId}</p>
          )}
        </div>
      )}
    </div>
  );
}
