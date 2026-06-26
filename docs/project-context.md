---
project: Modern Classroom (EduForge)
version: 1.0
generated: 2026-06-26
bmad-version: 6.9.0
---

# Modern Classroom — Project Context

Critical rules and patterns for AI agents implementing code in this codebase. This document captures non-obvious constraints that prevent implementation mistakes.

---

## 1. Technology Stack (pinned versions)

| Layer | Choice | Version | Notes |
|-------|--------|---------|-------|
| Framework | Next.js App Router | 15.5.18 | **Not Pages Router** |
| Runtime | React | 19.0.0 | Concurrent features enabled |
| Language | TypeScript | 5.5.3 | `strict: true` always |
| Database | Neon PostgreSQL via Prisma | Prisma 5.16 | |
| Auth | Clerk | v6 | `@clerk/nextjs` server components |
| Styling | Tailwind CSS + Shadcn | v3.4.6 | No CSS modules |
| AI client | OpenRouter + Vercel AI SDK | ai v6 | **All AI calls go through `lib/openrouter.ts`** |
| Package mgr | pnpm | 11.1.3 | Declared in `package.json` `packageManager` |
| Testing | Vitest | v2.1.9 | Unit-only, no DB/network |
| Media store | Cloudflare R2 | — | via `lib/r2.ts` |
| Toast/alerts | Sonner | v2 | |
| Validation | Zod | v3 | Always validate before DB write |

---

## 2. Data Model — Critical Rules

### Ownership Chain
```
Class (clerkUserId) → Unit → Lesson → { Slide, Worksheet, Quiz, MediaAsset }
```

**RULE**: Every resource roots back to `Class.clerkUserId`. Never check auth any other way.

**RULE**: Always use helpers from `lib/ownership.ts` — never write inline ownership queries:
```ts
import { ownedLesson, ownedClass, ownedUnit } from "@/lib/ownership";
const lesson = await ownedLesson(id, userId);
if (!lesson) return NextResponse.json({ error: "Not found" }, { status: 404 });
```
Return **404** (never 403) to prevent existence leaking.

### JSON Columns
These Prisma columns are typed `Json` (Prisma's `JsonValue`):
- `Lesson.plan` — see `types/lesson.ts` → `LessonPlanBody`
- `Lesson.objectives` — array of strings
- `Lesson.ibAlignment` — `{ theme, unitQuestion, textTypes, atlSkills }`
- `Slide.content` — see `types/slide.ts` → `SlideContent`
- `Worksheet.sections` — see `types/worksheet.ts` → `WorksheetSection[]`
- `Quiz.questions` — see `types/quiz.ts` → `QuizQuestion[]`
- `QuizAttempt.answers` — `{ questionId, selected }[]`

**RULE**: When casting from `JsonValue` to a typed object, always use double-cast through `unknown`:
```ts
// ✅ correct
const plan = (lesson.plan ?? {}) as unknown as LessonPlanBody;

// ❌ wrong — TS error: conversion may be a mistake
const plan = lesson.plan as LessonPlanBody;
```

**RULE**: When writing a Json column back to Prisma, cast with `as unknown as Prisma.InputJsonValue` or `as any` (with eslint-disable comment):
```ts
data: { plan: updatedPlan as any }   // eslint-disable-line @typescript-eslint/no-explicit-any
```

---

## 3. API Routes — Mandatory Patterns

Every API route handler must follow this exact pattern:
```ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownedLesson } from "@/lib/ownership";

const RequestSchema = z.object({ /* ... */ });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }  // Note: params is a Promise in Next.js 15
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;  // Must await params
  if (!(await ownedLesson(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // ... db operations ...

  revalidatePath(`/library/lessons/${id}`);
  return NextResponse.json(result);
}
```

**CRITICAL**: `params` in Next.js 15 App Router is a `Promise<{id: string}>` — always `await params` before destructuring. This is different from Next.js 14.

**RULE**: Call `revalidatePath()` after any mutation that touches teacher-visible UI. This is the only cache invalidation mechanism used (no `next/cache` tags).

---

## 4. AI Generation — Critical Rules

### All AI calls go through `lib/openrouter.ts`
Never import OpenAI or AI SDK directly in route files. Use the helpers:
```ts
import { generateStructured, chat, chatJSON, MODELS } from "@/lib/openrouter";
```

### Model selection
```ts
export const MODELS = {
  DEFAULT: "openai/gpt-5.4-mini",  // Primary model for all generation
  CEFR: "openai/gpt-5.4-mini",     // CEFR-adapted phrasing
  FAST: "openai/gpt-5.4-mini",     // Fast tasks
};
```
**RULE**: Do NOT change models without testing JSON validity. Other providers (Gemini, Claude via OpenRouter) intermittently emit malformed JSON. `gpt-5.4-mini` is the only tested-reliable model for structured JSON output via this client.

### generateStructured usage
```ts
import { NoObjectGeneratedError } from "ai";

try {
  const result = await generateStructured(
    MyZodSchema,
    systemPrompt,
    userPrompt,
    { model: MODELS.DEFAULT, temperature: 0.7 }
  );
} catch (err) {
  if (err instanceof NoObjectGeneratedError) {
    return NextResponse.json({ error: "Generation failed" }, { status: 502 });
  }
  throw err;
}
```
Always catch `NoObjectGeneratedError` — it's the AI SDK's structured output failure mode.

### Zod schema validation before DB write
Always validate AI output against a Zod schema before storing. See `lib/lesson-validation.ts`, `lib/slide-validation.ts`, `lib/worksheet-validation.ts`, `lib/quiz-validation.ts`.

---

## 5. Component Patterns

### Server vs Client Components
```ts
// Server component (default — no directive needed)
// Can call db directly, cannot use hooks or browser APIs
export default async function MyPage() {
  const data = await db.lesson.findUnique({ ... });
  return <div>{data.title}</div>;
}

// Client component — explicit directive required
"use client";
import { useState } from "react";
export function MyClientComponent() { ... }
```

**RULE**: Server components live in `page.tsx` files and data-fetching wrappers. Client components are co-located (e.g., `LessonDetail.tsx` alongside `page.tsx`). The naming convention is: page = server, detail/client/view = client.

### Path alias
Always use `@/` for project-root-relative imports:
```ts
import { db } from "@/lib/db";          // ✅
import { db } from "../../lib/db";       // ❌
```

### UI Components
Shadcn-derived components live in `components/ui/`. Do not rebuild what's there. Key available components:
- `button`, `badge`, `card`, `checkbox`, `dialog`, `label`, `scroll-area`, `select`, `separator`, `tabs`, `textarea`
- `InlineEditField` — pencil-on-hover inline editing with save/cancel (see `components/ui/InlineEditField.tsx`)
- `ef-primitives.tsx` — `@base-ui/react` wrapper primitives

### Routing after mutation
```ts
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
// After a successful mutation:
router.refresh();  // Re-fetches current page server data without hard nav
```

---

## 6. Copilot State Machine (Key Domain Logic)

The AI lesson creation flow in `app/(teacher)/create/CopilotView.tsx` follows this state machine:
```
idle → thinking → angles → building → built
```
Each phase has specific UI behavior. Never short-circuit the state sequence.

### Session Persistence
Copilot sessions are persisted to `localStorage` keyed by `copilot-session-{lessonId}` with a 7-day TTL. The `SessionStore` type tracks: `{ lessonId, text, selectedClassId, duration, angles, chosenAngle, assetState, assetData, savedAt }`.

`/create?lessonId={id}` restores a session from Library's "Ask Copilot" link.

### Asset Keys
```ts
type AssetKey = "plan" | "slides" | "worksheet" | "quiz" | "media";
```
Each maps to a specific generate route. The plan must complete before parallel asset generation starts.

### RefineSidebar
Per-asset refinement chat in `app/(teacher)/create/RefineSidebar.tsx`. Calls `onRefresh(key, additionalNotes)` which re-runs the asset generator with extra context. Plan-level refine is not supported (prompt user to Start Over instead).

---

## 7. Testing Rules

```
tests/
  *.test.ts       ← all unit tests here
```

**RULE**: Tests only cover pure library functions in `lib/`. No DB access, no network, no React rendering. If a function needs DB or network, it's not unit-testable — create an integration test plan instead.

**RULE**: Vitest `globals: true` is set — do not import `describe`, `it`, `expect`, `vi` in test files.

**RULE**: Test files named `<module-name>.test.ts`, co-referenced by filename. Example: `lib/quiz-scoring.ts` → `tests/quiz-scoring.test.ts`.

Coverage includes `lib/**/*.ts` but excludes:
- `lib/db.ts` (Prisma singleton, can't unit test)
- `lib/**/*.tsx` (React components)  
- `lib/prompts/**` (prompt strings, content not logic)

---

## 8. Environment Variables

Required in `.env.local` and Vercel:
```
DATABASE_URL                    # Neon PostgreSQL (also DIRECT_URL)
OPENROUTER_API_KEY              # OpenRouter AI gateway
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
R2_ACCOUNT_ID                   # Cloudflare R2
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL                   # Public CDN URL for R2
NEXT_PUBLIC_APP_URL             # App's public URL (used in AI client headers)
```

**RULE**: Never access env vars directly in components. Import from `lib/env.ts` which validates at startup and throws meaningful errors for missing vars.

---

## 9. Git & Deployment Rules

- Default branch: **`master`** (not `main`)
- All commits must end with: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- PR base: always `--base master`
- Never auto-push or merge without explicit user instruction
- Vercel deploys from `master` automatically; feature branches get preview URLs

---

## 10. Routing Structure

```
app/
  (auth)/                         ← Clerk auth (sign-in, sign-up)
  (teacher)/                      ← All teacher-facing routes (layout with sidebar)
    create/                       ← Copilot lesson creation
    library/                      ← Lesson/quiz/media library
      lessons/[id]/               ← Lesson detail (Plan/Slides/Worksheet/Quiz/Media tabs)
      quizzes/[id]/grade/         ← Quiz grading
    plan/                         ← Class planning dashboard
    classes/, media/, quizzes/    ← Legacy routes (some redirect to library)
  api/
    classes/[id]/                 ← Class CRUD
    generate/{angles,lesson,slides,worksheet,quiz,image,infographic}/
    lessons/{id}/plan/            ← PATCH for plan inline edit
    export/{pdf,pptx}/
    quizzes/, units/
  quiz/[shareToken]/              ← Public student-facing quiz (no auth)
```

**RULE**: The teacher layout wraps everything in `(teacher)/`. Public routes (student quiz) live outside route groups.

---

## 11. BMAD Workflow Conventions

Going forward all new features follow the BMAD process:
1. **PM Agent** → PRD (`_bmad-output/planning-artifacts/prd-{feature}.md`)
2. **Architect Agent** → Architecture doc if DB/API changes needed
3. **Dev Agent** → Epics + Stories with acceptance criteria
4. **Dev Agent** → Implementation story-by-story with tests first

Output folder: `_bmad-output/`
- Planning artifacts: `_bmad-output/planning-artifacts/`
- Implementation artifacts: `_bmad-output/implementation-artifacts/`
- Project knowledge: `docs/`

Backlog of known issues (NOT to implement without a story):
- Slides tab: thumbnails render as empty dark boxes (content renderer missing)
- Worksheet tab: shows "Section content goes here" placeholder (sections JSON not read)
- Quiz tab: generated quiz not appearing (Prisma join likely missing `quiz` include)
- Media generation: intermittently fails (API key or provider config issue)
- Asset generation lacks lesson plan as primary input (currently independent)
