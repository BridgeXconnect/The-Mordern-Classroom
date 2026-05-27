"use client";
// TODO Phase 4: Infographic builder — template selector, data input, Puppeteer preview
interface Props { lessonId: string; onGenerated: (url: string) => void; }
export function InfographicBuilder({ lessonId: _lessonId, onGenerated: _onGenerated }: Props) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <p className="font-medium">Infographic Builder</p>
      <p className="text-sm mt-1">TODO: Phase 4 — Puppeteer HTML templates</p>
    </div>
  );
}
