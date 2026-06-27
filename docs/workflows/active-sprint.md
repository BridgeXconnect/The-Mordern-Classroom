# Active Sprint

**Sprint:** Stabilization — Zero Stubs  
**Goal:** Every existing feature works end-to-end. No placeholders, no empty tabs, no broken generators.  
**Status:** Session 1 (audit) ✅ | STAB-1 ✅ | STAB-2 through STAB-9 in progress  
**Workflow:** See `docs/workflows/stabilization-sprint.md`  
**Case file:** `_bmad-output/implementation-artifacts/investigations/stabilization-audit-investigation.md`

## Linear

**Project:** The-Mordern-Classroom  
**Label filter:** `stabilization`  
**Board link:** https://linear.app/bridgexconnect/project/the-mordern-classroom-d993e446453b/overview  
**Cycle:** 4 (ends 2026-06-28)

---

## Capability batches

A tab is only "complete" when every issue in its batch is merged. Do not merge partial batches in isolation.

| Batch | Tab complete when | Status | Issues |
|-------|-------------------|--------|--------|
| Navigation | Editor links visible in all 3 tabs | In review (PR #46) | STAB-9 |
| Slides | View + Present + Export PPTX all work | Partial ✅ | STAB-1 ✅ + STAB-6 + STAB-5 (PPTX) |
| Worksheet | Sections render + Export PDF works | Todo | STAB-2 (includes PDF) |
| Quiz | Real QR code + computed stats | Todo | STAB-8 |
| AI quality | Generators use lesson plan | Todo | STAB-7 |
| Infrastructure | Media generation retries | Todo | STAB-4 |

---

## STAB Issue Registry

| STAB | Linear | Title | Priority | Story file | Status |
|------|--------|-------|----------|------------|--------|
| STAB-1 | [BRI-86](https://linear.app/bridgexconnect/issue/BRI-86) | Slides tab renders real slide content | Medium | `stab-1-slides-thumbnail-renderer.md` | ✅ Done |
| STAB-2 | [BRI-87](https://linear.app/bridgexconnect/issue/BRI-87) | Worksheet tab renders actual section content | Medium | `stab-2-worksheet-sections-renderer.md` | Todo |
| STAB-4 | [BRI-88](https://linear.app/bridgexconnect/issue/BRI-88) | Media generation uses a reliable image provider | Low | `stab-4-media-generation-reliability.md` | Todo |
| STAB-5 | [BRI-89](https://linear.app/bridgexconnect/issue/BRI-89) | Export PPTX and PDF buttons trigger downloads | Medium | `stab-5-export-buttons-wired.md` | Todo |
| STAB-6 | [BRI-90](https://linear.app/bridgexconnect/issue/BRI-90) | Present mode button opens the Reveal.js presentation | High | `stab-6-present-button-wired.md` | Todo |
| STAB-7 | [BRI-91](https://linear.app/bridgexconnect/issue/BRI-91) | Asset generators use the lesson plan as primary input | Medium | `stab-7-plan-aware-generators.md` | Todo |
| STAB-8 | [BRI-92](https://linear.app/bridgexconnect/issue/BRI-92) | Quiz tab shows real QR code and computed statistics | Low | `stab-8-quiz-tab-qr-and-stats.md` | Todo |
| STAB-9 | [BRI-93](https://linear.app/bridgexconnect/issue/BRI-93) | Library lesson view links to full-featured editor routes | High | `stab-9-lesson-editor-navigation.md` | In review (PR #46) |

> STAB-3 was investigated and **refuted** — the Prisma quiz include in `page.tsx` is correct; quizzes appear when they exist. The partial stub in the quiz tab became STAB-8.

---

## Recommended implementation order

1. **STAB-9** ([BRI-93](https://linear.app/bridgexconnect/issue/BRI-93)) — Add "Edit slides →", "Edit worksheet →", "Manage quizzes →" links. Standalone, no dependencies. Ships alone.
2. **STAB-6** ([BRI-90](https://linear.app/bridgexconnect/issue/BRI-90)) — Wire Present button. 2 onClick handlers. Tiny change, highest value-to-effort ratio.
3. **STAB-2** ([BRI-87](https://linear.app/bridgexconnect/issue/BRI-87)) — Worksheet sections render + type fix + PDF export. Closes the Worksheet batch in one story.
4. **STAB-5** ([BRI-89](https://linear.app/bridgexconnect/issue/BRI-89)) — Export PPTX (PDF is already done by STAB-2 if it shipped first). Closes the Slides batch.
5. **STAB-7** ([BRI-91](https://linear.app/bridgexconnect/issue/BRI-91)) — Plan-aware generators. Touches 4 files, each change is a prompt addition.
6. **STAB-8** ([BRI-92](https://linear.app/bridgexconnect/issue/BRI-92)) — Quiz QR + stats. Needs qrcode.react, computed from existing data. Closes the Quiz batch.
7. **STAB-4** ([BRI-88](https://linear.app/bridgexconnect/issue/BRI-88)) — Media reliability. Retry logic + fallback documentation. Low priority.

> Note on STAB-5: If STAB-2 ships first, the PDF export handler is already wired. STAB-5 only needs to add the PPTX handler. Check the story file note on coordination before starting.

---

## Current story

**Active issue:** STAB-6 ([BRI-90](https://linear.app/bridgexconnect/issue/BRI-90)) — next to implement  
**Branch:** `fix/stab-6-present-button`

> STAB-9 ([BRI-93](https://linear.app/bridgexconnect/issue/BRI-93)) complete — PR [#46](https://github.com/BridgeXconnect/The-Mordern-Classroom/pull/46) open against `master` (branch `fix/stab-9-editor-navigation`), awaiting review/merge.

---

_Update "Active issue" and "Branch" at the start of each session before picking up the work._
