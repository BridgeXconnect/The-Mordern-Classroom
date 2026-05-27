"use client";
// TODO Phase 5: YouTube search UI — search bar, results grid, embed selector
interface Props { lessonId: string; cefrLevel: string; }
export function VideoSearch({ lessonId: _lessonId, cefrLevel: _cefrLevel }: Props) {
  return (
    <div className="p-6 border rounded-lg text-center text-muted-foreground">
      <p className="font-medium">Video Search</p>
      <p className="text-sm mt-1">TODO: Phase 5 — YouTube Data API v3</p>
    </div>
  );
}
