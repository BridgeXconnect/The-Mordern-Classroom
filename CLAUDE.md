# Modern Classroom — Claude Code Session Instructions

## MANDATORY: Run this at the start of every session

1. Read `docs/project-context.md` — all codebase rules, patterns, and implementation constraints live here. Do not write any code until you've read it.
2. Read `docs/workflows/active-sprint.md` — tells you what sprint is currently active and links to the sprint workflow.
3. Ask the user which Linear issue they're working on, OR if they say "pick next", query Linear for the highest-priority **Todo** issue in the **Modern Classroom** project.

Never skip step 1. It contains non-obvious rules (e.g. `params` is a Promise in Next.js 15, JSON columns need double-cast, all AI calls go through `lib/openrouter.ts`) that are easy to get wrong.

---

## Linear

**Workspace:** `https://linear.app/` — ask Roy for the team URL if you don't have it.  
**Project:** Modern Classroom  
**Source of truth:** Linear is the only place that tracks what's In Progress across sessions.

Issue lifecycle:
- **Todo** → start of session: set to **In Progress**
- **In Progress** → PR merged: set to **Done**
- Never work on more than one issue per session
- Never mark Done until the PR has merged to `master`

---

## BMAD

Installed at `_bmad/`. Skills are in `.claude/skills/`.  
Planning artifacts: `_bmad-output/planning-artifacts/`  
Project knowledge base: `docs/`

| Workflow | When to use |
|----------|-------------|
| `docs/workflows/stabilization-sprint.md` | Fixing stubs and broken features (current sprint) |
| `docs/workflows/feature-sprint.md` | Building a new feature from scratch |

Always check `docs/workflows/active-sprint.md` first — it tells you which workflow applies right now.

---

## Git conventions

- Default branch: **`master`** (never `main`)
- Branch per story: `fix/stub-{N}` for stabilization, `feat/{slug}` for features
- PR base: always `--base master`
- **Never push or merge without explicit user instruction**
- **Never commit automatically** — stage, show the diff, ask for approval

### Commit message format
```
type(scope): short description

Body explaining why (optional, for non-obvious changes).

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Types: `fix`, `feat`, `chore`, `docs`, `test`, `refactor`

---

## Scope discipline

- One Linear issue = one branch = one PR
- If you find something broken that isn't the current issue, **do not fix it** — create a Linear issue for it and continue
- Do not refactor code adjacent to the thing you're fixing
- Do not add features during a stabilization sprint

---

## Definition of Done (every story)

A story is not done until ALL of these are true:
- [ ] Acceptance criteria from the Linear issue are met
- [ ] `pnpm run lint` passes with no new errors
- [ ] `pnpm test` passes (add a test if the fix involves logic in `lib/`)
- [ ] Manually verified in the browser (dev server or preview deploy)
- [ ] PR created and linked to the Linear issue
- [ ] Roy has approved the PR

Do not mark a Linear issue Done until Roy approves the PR.
