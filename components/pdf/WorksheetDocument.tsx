// @react-pdf/renderer worksheet component
// TODO Phase 3: Full PDF layout with sections, IB branding, print-ready formatting
// This file is server-side only — never import in client components

import type { WorksheetSection } from "@/types/worksheet";

// Stub export — real implementation in Phase 3
export interface WorksheetDocumentProps {
  title: string;
  lessonTitle: string;
  cefrLevel: string;
  sections: WorksheetSection[];
}

// Returns null in scaffold — Phase 3 will implement full @react-pdf/renderer component
export function WorksheetDocument(_props: WorksheetDocumentProps): null {
  return null;
}
