# Stabilization Sprint Workflow

**Purpose:** Fix every stub in the existing app so every feature works end-to-end.  
**Rule:** No code before `/bmad-dev-story`. No PR before `/bmad-code-review`. No "done" on a tab until its full capability batch is merged.

---

## Which BMAD skills apply in a stabilization sprint

| Skill | When | What it does |
|-------|------|--------------|
| `/bmad-investigate` | Session 1 only (already done) | Audits the codebase, writes story files, creates Linear issues |
| `/bmad-dev-story` | **MANDATORY FIRST ACTION** in every implementation session | Reads the story file, plans the work, enforces test-first, verifies each AC |
| `/bmad-code-review` | **MANDATORY** before every PR | Adversarial code review — fix all issues before opening PR |
| `/bmad-checkpoint-preview` | After each capability batch lands on master | End-to-end verification of the full user capability |

**Not used in stabilization:** `/bmad-agent-pm`, `/bmad-architecture`, `/bmad-create-epics-and-stories`. Those belong in `feature-sprint.md` and are for building new features from scratch.

The reason BMAD was brought in is exactly this: `/bmad-dev-story` makes implementation deterministic (the agent works to the spec, not to its own interpretation), and `/bmad-checkpoint-preview` gives you evidence that the whole capability works rather than just the edited file.

---

## Capability batches

A capability batch is the set of STAB issues that must all be merged before a tab is usable end-to-end. **Do not merge a story to master if the adjacent issues in its batch are still open.** Hold the PR in "In Review" until the whole batch is ready.

| Batch | Tab is usable when | Issues |
|-------|--------------------|--------|
| Navigation | All three editor links visible | STAB-9 |
| Slides | View thumbnails + Present + Export PPTX | STAB-1 ✅ + STAB-6 + STAB-5 (PPTX) |
| Worksheet | Sections render + Export PDF | STAB-2 (includes PDF; STAB-5 PDF is redundant if STAB-2 ships first) |
| Quiz | Real QR code + computed attempt stats | STAB-8 |
| AI quality | Generators include lesson plan in prompt | STAB-7 |
| Infrastructure | Media generation retries reliably | STAB-4 |

What went wrong with STAB-1: thumbnails merged while Present (STAB-6) and Export PPTX (STAB-5) were still open, so the teacher has a tab that shows content but can't be used for anything. The batch rule prevents this.

---

## Session 1 — Audit (ALREADY DONE)

Story files exist in `_bmad-output/planning-artifacts/`. Linear issues BRI-86 through BRI-93 exist in Cycle 4. See `docs/workflows/active-sprint.md` for the full registry.

---

## Sessions 2–N — One story per session

### Before you start
1. Open Linear → check `docs/workflows/active-sprint.md` → pick the next **Todo** from the recommended order
2. Set that issue to **In Progress** in Linear
3. Note the STAB-N ID, story file path, and branch name

### Paste this prompt exactly

```
Read CLAUDE.md, docs/project-context.md, and docs/workflows/active-sprint.md before doing anything else.

I am working on [STAB-N] [title].
Linear issue: [BRI-XX URL]
Story file: _bmad-output/planning-artifacts/[stab-N-slug].md

MANDATORY: Your first and only action before touching any code is to run /bmad-dev-story
pointing at the story file above. Do not read the story file yourself first.
Do not write any code before invoking the skill. This is not optional.

After /bmad-dev-story completes:
1. Run pnpm lint — zero new errors allowed
2. Run pnpm test — all tests must pass (write a test first if fix touches lib/)
3. Run /bmad-code-review — fix every issue it raises before continuing
4. Commit on branch [see active-sprint.md for branch name]
5. Create a PR targeting master — do NOT merge without explicit instruction
6. Update the story file's "Dev Agent Record" section with what was done
7. Update docs/workflows/active-sprint.md: advance "Active issue" to the next STAB
```

### Why `/bmad-dev-story` cannot be skipped

When STAB-1 was implemented, the skill was not invoked. The agent read the story file directly and coded against its own interpretation. There was no checkpoint that each acceptance criterion was met, no test-first enforcement, and no adversarial review before the PR merged. The result: technically correct code in isolation, but the tab still can't present or export.

The skill exists precisely to prevent this. It makes the agent work to the spec rather than to its memory.

### Batch merge rule

Before creating a PR, check the capability batch table above. If other issues in the same batch are still open, do not merge to master yet — hold the PR in "In Review" and complete the other stories. Once all PRs in the batch are ready, merge them together or in quick succession.

---

## Capability verification (run after each batch)

```
Read CLAUDE.md, docs/project-context.md, and docs/workflows/active-sprint.md.

The [Slides / Worksheet / Quiz] capability batch is fully merged to master:
[list each STAB and its Linear URL]

Run /bmad-checkpoint-preview to verify the complete [tab name] tab works end-to-end.
Cover the full teacher workflow: open a lesson → use the tab → verify the output.

Verify each AC from each story file in the batch — not just a surface check.

If any AC fails: open a new Linear issue labelled "stabilization-regression",
add to Cycle 4, and fix before declaring this batch done.

If all pass: update docs/workflows/active-sprint.md to mark the batch complete.
```

---

## Final session — Full end-to-end verification

Run after all STAB issues are Done.

```
Read CLAUDE.md, docs/project-context.md, and docs/workflows/active-sprint.md.

All stabilization stories are marked Done in Linear.
Run /bmad-checkpoint-preview to verify the full teacher flow end-to-end.

CHECKPOINTS:
1. Create flow: brief → angles → pick angle → all 5 assets reach Ready
2. Built state → "Edit in Library" → correct Lesson Detail page
3. Lesson Detail → "Ask Copilot" → restores Built + opens Refine sidebar
4. Plan tab: shows summary, activities, vocabulary/grammar targets
5. Slides tab: thumbnails show real content → Present opens Reveal.js → Export PPTX downloads
6. Worksheet tab: sections render with real content → Export PDF downloads
7. Quiz tab: QR code renders → stats computed from real attempt data
8. Media tab: generated media is visible
9. Quiz share: copy link → student takes quiz → attempt appears in grade view
10. Navigation: "Edit slides →", "Edit worksheet →", "Manage quizzes →" links work in each tab

For each checkpoint: PASS or FAIL with specific evidence.
If any FAIL: open a new Linear issue labelled "stabilization-regression", create story file.

If all PASS: update docs/workflows/active-sprint.md to close this sprint and set next sprint.
```

---

## After this sprint

Update `docs/workflows/active-sprint.md` to point to `feature-sprint.md` and start the next sprint.
