"use client";

// TODO Phase 2: Embed Reveal.js and render slide JSON as a full presentation
// Uses dynamic import to avoid SSR issues with Reveal.js
import type { SlideData } from "@/types/slide";

interface RevealViewerProps {
  slides: SlideData[];
  className?: string;
}

export function RevealViewer({ slides, className }: RevealViewerProps) {
  return (
    <div className={className}>
      <div className="rounded-lg border bg-muted p-8 text-center text-muted-foreground">
        <p>Slide Viewer — {slides.length} slides</p>
        <p className="text-sm mt-1">TODO: Phase 2 — Reveal.js integration</p>
      </div>
    </div>
  );
}
