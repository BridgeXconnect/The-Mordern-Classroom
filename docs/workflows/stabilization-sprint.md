# Stabilization Sprint Workflow

**Purpose:** Eliminate every stub and broken feature before any new feature work begins.  
**Rule:** No new features. No refactors. Fix only what's broken.

---

## Session 1 — Audit (run once, creates the Linear backlog)

### Prompt to paste

```
Read CLAUDE.md and docs/project-context.md before doing anything.

I'm running Session 1 of the stabilization sprint.

Run /bmad-investigate with this brief:

INVESTIGATION BRIEF:
Audit the Modern Classroom app for every stub, broken feature, and 
disconnected data path. Confirm or deny each suspected issue with 
evidence from the code. Also look for issues we haven't listed.

Suspected issues:
1. Slides tab — thumbnails render as empty dark boxes
2. Worksheet tab — shows "Section content goes here" placeholder
3. Quiz tab — generated quiz may not appear (possible missing Prisma include)
4. Media generation — intermittently fails
5. Export buttons (PPTX/PDF) — may be stubs with no implementation
6. Present mode button — may be a stub
7. Asset generation doesn't use lesson plan as primary input

For each issue (confirmed or newly discovered), produce:
- ID: STAB-N (sequential)
- Title: short, imperative (e.g. "Fix worksheet sections not rendering")
- Status: Confirmed / Not confirmed
- Root cause: one sentence
- Files affected: list the specific files
- Acceptance criteria: what "fixed" looks like, written as testable statements

After the investigation, do the following for each confirmed issue:
1. Create a story file at _bmad-output/planning-artifacts/stab-N-{slug}.md
   using the /bmad-create-story format
2. Create a Linear issue titled "[STAB-N] {Title}" with the acceptance
   criteria in the description and label "stabilization"
3. Add the issue to the active sprint in Linear

Finally, update docs/workflows/active-sprint.md with:
- The Linear board URL for this sprint
- The list of STAB-N IDs and their Linear issue numbers
```

### What Session 1 produces
- Story files in `_bmad-output/planning-artifacts/stab-N-*.md`
- Linear issues for each confirmed stub
- Updated `docs/workflows/active-sprint.md` with the issue list

---

## Sessions 2–N — Fix one story per session

### Before you start
1. Open Linear → Modern Classroom → filter by `stabilization` → pick highest priority **Todo**
2. Set it to **In Progress**
3. Note the STAB-N ID and story file path

### Prompt to paste

```
Read CLAUDE.md and docs/project-context.md before doing anything.

I'm working on [STAB-N] from the stabilization sprint.
Story file: _bmad-output/planning-artifacts/stab-N-{slug}.md
Linear issue: [paste URL]

Run /bmad-dev-story pointing at the story file above.

Constraints:
- Do not touch code outside the files listed in the story
- Write a failing test first if the fix involves any logic in lib/
- Run pnpm lint and pnpm test before declaring done
- Verify the fix manually in the browser
- One commit per story, one PR per story
```

### When the fix is done
1. Claude creates the PR
2. You review and approve
3. Merge to master
4. Set the Linear issue to **Done**
5. Update `docs/workflows/active-sprint.md` → change "Current story" to the next one

---

## Final session — End-to-end verification

Run this after all STAB-N issues are marked Done in Linear.

### Prompt to paste

```
Read CLAUDE.md and docs/project-context.md before doing anything.

All stabilization stories are marked Done in Linear.
Run /bmad-checkpoint-preview to verify the full teacher flow end-to-end.

CHECKPOINTS:
1. Create flow: brief → angles → pick angle → all 5 assets reach Ready
2. Built state → "Edit in Library" → correct Lesson Detail page
3. Lesson Detail → "Ask Copilot" → restores Built + opens Refine sidebar
4. Plan tab: shows summary, activities, vocabulary/grammar targets
5. Slides tab: thumbnails show real slide content (not black boxes)
6. Worksheet tab: sections render with real content
7. Quiz tab: generated quiz is visible
8. Media tab: generated media is visible
9. Quiz share: copy link → student takes quiz → attempt appears in grade view
10. Inline editing: title pencil → edit → save → persists after refresh

For each checkpoint: PASS or FAIL with specific evidence.
If any FAIL: open a new Linear issue labelled "stabilization-regression",
create a story file, and do not close the sprint until it passes.

If all PASS: update docs/workflows/active-sprint.md to mark this sprint Done
and set the next sprint as active.
```

---

## After this sprint

Update `docs/workflows/active-sprint.md` to point to `feature-sprint.md`
and start the next sprint with a PM agent session.
