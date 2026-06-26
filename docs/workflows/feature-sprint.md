# Feature Sprint Workflow

**Purpose:** Build a new feature from idea → PRD → stories → code → shipped.  
**Rule:** No feature code without an acceptance criterion. No acceptance criterion without a PRD.

---

## Pre-sprint research (use when exploring an idea)

Before involving the PM agent, if you're uncertain whether the idea is feasible,
what libraries/APIs exist, or whether it's been done before:

### Domain research prompt
```
Read CLAUDE.md and docs/project-context.md before doing anything.

I want to explore the idea of [describe idea].
I don't know: [list what you're uncertain about — APIs, feasibility, existing tools, etc.]

Run /bmad-domain-research to find out what exists in this space before I commit to building it.
```

### Technical research prompt
```
Read CLAUDE.md and docs/project-context.md before doing anything.

I want to build [feature]. Domain research is done (see _bmad-output/planning-artifacts/research-*.md).

Run /bmad-technical-research to evaluate the implementation options,
recommend an approach, and identify any libraries or APIs we should use.
```

---

## Sprint sessions

### Session 1 — PRD

```
Read CLAUDE.md and docs/project-context.md before doing anything.

I want to build [feature name].
[Optional: attach domain/technical research files from _bmad-output/planning-artifacts/]

Run /bmad-agent-pm to write the PRD.
Save it to _bmad-output/planning-artifacts/prd-{feature-slug}.md.
```

Review the PRD. Push back on anything vague or that conflicts with
what the research showed. Approve it before moving to Session 2.

---

### Session 2 — Architecture (skip if no DB/API/infra changes)

```
Read CLAUDE.md and docs/project-context.md before doing anything.

PRD: _bmad-output/planning-artifacts/prd-{feature-slug}.md

Run /bmad-architecture to produce the technical architecture.
Focus on: new DB schema, new API routes, new external services.
Save to _bmad-output/planning-artifacts/architecture-{feature-slug}.md.
```

---

### Session 3 — Epics and stories

```
Read CLAUDE.md and docs/project-context.md before doing anything.

PRD: _bmad-output/planning-artifacts/prd-{feature-slug}.md
Architecture: _bmad-output/planning-artifacts/architecture-{feature-slug}.md (if exists)

Run /bmad-create-epics-and-stories.
For each story created:
1. Save a story file to _bmad-output/planning-artifacts/{story-slug}.md
2. Create a Linear issue with the story title and acceptance criteria
3. Label it with the feature name
4. Add it to the active sprint in Linear

Update docs/workflows/active-sprint.md with the new sprint name and Linear board link.
```

---

### Sessions 4–N — Implement one story per session

```
Read CLAUDE.md and docs/project-context.md before doing anything.

I'm working on [story title].
Story file: _bmad-output/planning-artifacts/{story-slug}.md
Linear issue: [URL]

Run /bmad-dev-story pointing at the story file above.

- Write failing tests first for any lib/ logic
- Run pnpm lint and pnpm test before declaring done
- Verify in the browser
- One commit, one PR
```

---

### Final session — Verification

```
Read CLAUDE.md and docs/project-context.md before doing anything.

All [feature] stories are marked Done in Linear.
Run /bmad-checkpoint-preview to verify the feature end-to-end
against the acceptance criteria in the PRD.

If all pass: update docs/workflows/active-sprint.md to close this sprint.
If any fail: open a regression issue in Linear and fix before closing.
```

---

## Story lifecycle in Linear

| State | When |
|-------|------|
| Todo | Created in Session 3 |
| In Progress | Set at start of the session that works it |
| In Review | PR created, waiting for approval |
| Done | PR merged to master |

Never skip In Review — every PR needs a human look before merge.
