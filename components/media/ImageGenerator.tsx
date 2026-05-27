"use client";
// TODO Phase 4: Image generation UI — prompt input, source selector, preview, save to lesson
interface Props { lessonId: string; onGenerated: (url: string) => void; }
export function ImageGenerator({ lessonId: _lessonId, onGenerated: _onGenerated }: Props) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <p className="font-medium">Image Generator</p>
      <p className="text-sm mt-1">TODO: Phase 4 — Pollinations.ai + HF FLUX</p>
    </div>
  );
}
