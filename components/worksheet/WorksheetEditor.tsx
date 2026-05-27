"use client";
// TODO Phase 3: Section-based worksheet editor — add/remove/reorder sections, edit content
import type { WorksheetSection } from "@/types/worksheet";
interface Props { sections: WorksheetSection[]; onChange: (sections: WorksheetSection[]) => void; }
export function WorksheetEditor({ sections, onChange: _onChange }: Props) {
  return (
    <div className="space-y-4">
      {sections.map((s) => (
        <div key={s.id} className="p-4 border rounded-lg">
          <p className="font-medium">{s.title}</p>
          <p className="text-sm text-muted-foreground">{s.type} — TODO: Phase 3</p>
        </div>
      ))}
      {sections.length === 0 && (
        <div className="p-8 border rounded-lg text-center text-muted-foreground">
          No sections yet — TODO: Phase 3
        </div>
      )}
    </div>
  );
}
