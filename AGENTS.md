# Modern Classroom — OpenCode Agent Context

## Project Overview
ESL teacher productivity platform for university students (CEFR L1–B2).
IB Language B + ATL aligned. Single teacher (Clerk auth), students access
quizzes via public UUID share links (no login required).

GitHub: https://github.com/BridgeXconnect/The-Mordern-Classroom

## Commands
```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build (must pass before commit)
pnpm lint         # ESLint check
pnpm db:generate  # Regenerate Prisma client after schema changes
pnpm db:migrate   # Run migrations (dev)
pnpm db:push      # Push schema to DB without migration (prototyping)
pnpm db:studio    # Open Prisma Studio UI
```

## Tech Stack
- **Framework:** Next.js 15 App Router + TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui (components in `components/ui/`)
- **Auth:** Clerk (`@clerk/nextjs`) — teacher only. Students use share links.
- **Database:** Neon PostgreSQL + Prisma ORM
- **LLM:** OpenRouter API via `@openrouter/sdk`
  - Default model: `google/gemini-2.0-flash-001` (fast, cheap)
  - CEFR-controlled content: `anthropic/claude-3.5-haiku` (best instruction following)
  - Structured JSON output (quizzes): `openai/gpt-4o-mini` (reliable JSON mode)
- **File Storage:** Cloudflare R2 via `@aws-sdk/client-s3` (S3-compatible)
- **Image Generation:** Pollinations.ai (no key) + HF FLUX.1-schnell (free tier)
- **Infographics:** `puppeteer-core` + `@sparticuz/chromium` (Vercel-compatible)
- **PDF Export:** `@react-pdf/renderer` (server-side React → PDF)
- **Presentations:** `pptxgenjs` (PPTX export) + Reveal.js (in-app viewer)
- **TTS:** Google Cloud TTS (`@google-cloud/text-to-speech`) — 1M chars/month free
- **Video Search:** YouTube Data API v3 (search + embed)
- **Video Generation:** Remotion (`remotion` + `@remotion/renderer`)
- **Quiz Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
- **Deployment:** Vercel (Hobby free tier)

## Project Structure
```
app/
  (auth)/               # Clerk auth pages (sign-in, sign-up)
  (teacher)/            # Protected teacher area (Clerk auth guard)
    dashboard/          # Main teacher dashboard
    classes/            # Class management
    lessons/[id]/       # Lesson detail + sub-pages (slides, worksheet, quizzes)
    media/              # Media library
    quizzes/            # Quiz management overview
  quiz/[shareToken]/    # PUBLIC — student quiz access (no auth)
  api/                  # API routes (thin controllers, logic in lib/)
    generate/           # LLM generation endpoints
    tts/                # Google Cloud TTS audio generation
    video/search/       # YouTube search
    export/             # PDF and PPTX export
    quiz/[shareToken]/submit/  # Quiz submission (public)

components/
  ui/                   # shadcn/ui components (DO NOT manually edit)
  slides/               # Reveal.js viewer
  quiz/                 # Duolingo-style quiz shell + 6 question types
  worksheet/            # Section-based worksheet editor
  pdf/                  # @react-pdf/renderer components
  media/                # Image generator, infographic builder, video search

lib/
  openrouter.ts         # ALL LLM calls go through here — never call OpenRouter directly
  r2.ts                 # ALL file storage goes through here — never use fs for user media
  tts.ts                # Google Cloud TTS wrapper
  puppeteer.ts          # Infographic renderer (sparticuz/chromium)
  youtube.ts            # YouTube Data API v3 client
  db.ts                 # Prisma client singleton
  prompts/
    ibContext.ts        # Shared IB Language B phase descriptors + ATL definitions
    lessonPlan.ts       # Lesson plan generation prompt templates
    slides.ts           # Slide generation prompt templates
    worksheet.ts        # Worksheet generation prompt templates
    quiz.ts             # Quiz generation prompt templates

types/                  # Shared TypeScript types (import everywhere, no inline defs)
prisma/schema.prisma    # Database schema
remotion/               # Video template components
```

## Critical Conventions
1. **All LLM calls** → `lib/openrouter.ts`. Never import `@openrouter/sdk` directly in routes/components.
2. **All file storage** → `lib/r2.ts`. Never use `fs` for user-generated media.
3. **CEFR level** must be passed to every generation function (`cefrLevel: CefrLevel`).
4. **IB context** is injected via `lib/prompts/ibContext.ts` into every lesson/worksheet/quiz prompt.
5. **Types** are defined in `types/` and imported. No inline `type` or `interface` definitions in page/route files.
6. **shadcn/ui** components live in `components/ui/` — use them, never re-implement buttons/inputs/cards.
7. **API routes** are thin controllers. Business logic lives in `lib/`. Routes should only: validate input (Zod), call lib function, return Response.
8. **Prisma client** is a singleton from `lib/db.ts` — never `new PrismaClient()` elsewhere.
9. **Quiz share links** are UUID-based (`shareToken` field), accessible at `/quiz/[shareToken]` with zero auth.
10. **Environment variables** — all vars must exist in `.env.example`. Server-only vars are never prefixed with `NEXT_PUBLIC_`.

## Database Models
- `Class` — a group of students at a specific CEFR level
- `Unit` — a thematic unit within a class (IB theme, text types, ATL skills)
- `Lesson` — individual lesson within a unit (objectives, duration, IB alignment JSON)
- `Slide` — individual slide belonging to a lesson (ordered, typed, content JSON)
- `Worksheet` — worksheet for a lesson (sections JSON, optional PDF URL in R2)
- `Quiz` — pre or post lesson quiz (UUID share token, CEFR level, questions JSON)
- `QuizAttempt` — a student's completed attempt (score, answers JSON, optional alias)
- `MediaAsset` — generated image/audio/video linked to a lesson (URL in R2)

## Enums
- `CefrLevel`: L1 | A1 | A2 | B1 | B2
- `QuizType`: PRE | POST
- `SlideType`: TITLE | CONTENT | IMAGE | VOCABULARY | GRAMMAR | ACTIVITY
- `MediaType`: IMAGE | AUDIO | VIDEO_EMBED | VIDEO_GENERATED | INFOGRAPHIC
- `AtlSkill`: COMMUNICATION | THINKING | RESEARCH | SOCIAL | SELF_MANAGEMENT

## IB Language B Context
Global contexts: Identity & Relationships, Experiences, Human Ingenuity,
Social Organisation, Sharing the Planet.
Text types by skill: receptive (article, blog, advertisement, brochure, email,
instructions, interview, letter, notice, report) + productive (same set).
ATL skill categories (5): Communication, Thinking, Research, Social, Self-management.
All lesson/worksheet generation prompts inject the full IB phase descriptor
for the target CEFR level from `lib/prompts/ibContext.ts`.

## Development Phases
- **Phase 0:** Foundation scaffold (current — this file created here)
- **Phase 1:** Lesson Planner (LLM-powered, IB-aligned, DB CRUD)
- **Phase 2:** Slide Builder (Reveal.js viewer + pptxgenjs export)
- **Phase 3:** Worksheet Builder (section editor + react-pdf export)
- **Phase 4:** Image & Infographic Generator (Pollinations + HF + Puppeteer)
- **Phase 5:** Video Module (YouTube search/embed + Remotion templates)
- **Phase 6:** Quiz System (6 question types + share links + results dashboard)
- **Phase 7:** TTS + Audio (Google Cloud TTS + pre-generated listening exercises)
- **Phase 8:** Polish + Vercel Deploy (error handling, mobile, performance)

## Notes for Future Sessions
- Node 20 LTS is the production target (Vercel). Local dev uses Node 25 — no issues.
- `@sparticuz/chromium` is used instead of full Puppeteer to stay within Vercel's 50MB function size limit.
- Google Cloud TTS free tier: 1M characters/month (Neural2 voices). Pre-generate audio and store in R2.
- Remotion renders are CPU-intensive — consider Remotion Lambda for production video generation.
- YouTube Data API v3: 10,000 units/day free. Cache search results in DB to preserve quota.
- pnpm is the package manager. Never use npm or yarn in this project.
