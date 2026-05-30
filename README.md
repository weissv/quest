# Mezon Quest Funnel 3.0

> **AI-powered family profiling and psychological screening system for Mezon Inspiring School**

A full-stack Next.js application that serves as the complete digital intake pipeline for school admission — from the parent-facing questionnaire to the admin CRM with AI-assisted decision support.

---

## Table of Contents

- [Overview](#overview)
- [How It Works (End-to-End Flow)](#how-it-works-end-to-end-flow)
- [Scoring Methodology](#scoring-methodology)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)

---

## Overview

Mezon Quest Funnel 3.0 is a psychometric evaluation system designed to screen families applying to [Mezon Inspiring School](https://quest.mezon.uz). The funnel identifies parents whose psychological profiles, communication patterns, and values align with the school's philosophy: **conscious partnership between teacher, parent, and child**.

The system is built around three intellectual pillars:

| Pillar | Description |
|--------|-------------|
| **The Mom Test** | Only real past behavior is evaluated. Hypothetical promises ("I would do…") are red flags. |
| **Boundaries** | A parent must be an independent person, not an extension of their child. Semantic markers of merger ("we" instead of "he/she") are tracked. |
| **The Gift of Failure** | A child's mistakes are their trainer. Parents who rescue children from consequences of failure exhibit toxic "rescuing" behavior. |

---

## How It Works (End-to-End Flow)

```
Parent → Questionnaire Wizard → POST /api/evaluate → Admin Kanban Board → Decision
```

### 1. Questionnaire Wizard (Public)

Parents visit the root URL and fill out a multi-block wizard form. The form fetches questions dynamically from `GET /api/questions` and adapts based on the selected **cohort** (Grades 1–4 or Grades 5–8). Questions are organized into 5 blocks:

| Block | Type | Purpose |
|-------|------|---------|
| **0 — Identification** | `SELECT` / `TEXT` | Family code, cohort, parent role (Mother/Father/Guardian) |
| **A — Situational Scenarios** | `SJT` (Situational Judgment Test) | Behavioral scoring via weighted multiple-choice scenarios |
| **B — Deep Verification** | `OPEN` (free text, min. 150 chars) | Open-ended questions analyzed by AI |
| **C — Cross-Validation** | `MATRIX` (responsibility sliders) | Distribution of responsibility between Family/School/Child |
| **D — Motivational Filter** | `TEXT` / `SELECT` | Final values check |

If SJT score is **≥ 12** or **≤ 6**, Blocks B and C are automatically skipped (fast-track routing). The form auto-advances after radio button selections (500ms delay) and supports `Enter` key navigation.

### 2. Evaluation Engine (`POST /api/evaluate`)

On form submission, the server:

1. **Fetches questions** for the given cohort from the database
2. **Calculates the SJT score** — sums weights of selected options for Block A questions
3. **Fast-track routing:**
   - SJT ≥ 12 → saves result with `status: PENDING` + auto-approve recommendation
   - SJT ≤ 6 → saves result with `status: PENDING` + auto-reject recommendation
4. **Gray Zone (6 < SJT < 12):** calls `runAIEvaluator()` using `gemma-4-31b-it` via the Google Generative AI SDK
5. **Dyad Analysis:** if a partner (other parent from the same `familyCode`) has already submitted, computes:
   - SJT score delta between partners
   - Responsibility matrix delta (Block C answers)
   - If delta is too large → `roleConflict: true` → routes to `INTERVIEW` or `REVIEW` instead of auto-approve/reject
6. **Calculates total score** (SJT + AI score), determines recommended status, and saves to DB

**All submissions store `status: 'PENDING'`** — final decision is always made manually in the admin panel.

### 3. Result Screen (Public)

After submission, the parent sees:
- A thank-you message
- Their SJT score on a visual progress bar (0–12 scale, color-coded)
- AI analysis breakdown (per-question scores B1/B2/B3, total AI score, verdict, and reasoning) — shown only if AI was triggered
- Status badge from the server response

### 4. Admin Panel (Protected)

All `/admin/*` routes and most `/api/*` routes require cookie-based authentication (`admin_token=authorized`). The admin panel has four sections:

---

## Scoring Methodology

### SJT Score (Block A)
Each Block A question has weighted answer options. The total SJT score ranges from 0 to ~12.

| SJT Range | Auto-Decision |
|-----------|---------------|
| ≤ 6 | Recommended: REJECTED |
| 7–11 | Gray Zone → AI called |
| ≥ 12 | Recommended: APPROVED |

### AI Score (Block B — Open Questions)
The AI evaluates each open answer on a **0–2 scale**:

| Score | Label | Meaning |
|-------|-------|---------|
| 0 | 🔴 Red Flag | Rescuing, external locus of control, merger ("we did homework") |
| 1 | 🟡 Yellow Flag | Correct words but no concrete past actions described |
| 2 | 🟢 Green Flag | Clear separation of roles, allowed child to experience failure |

### Combined Decision
- **Total Score = SJT Score + AI Total Score**
- Total ≥ 13.5 → APPROVED
- Total < 13.5 → REJECTED
- If partner conflict detected + APPROVED → INTERVIEW
- If REJECTED but Total ≥ 12 → REVIEW

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** (App Router, RSC + Client Components) |
| Language | **TypeScript 5** |
| Styling | **Tailwind CSS 3** + custom CSS design system |
| State Management | **Zustand** |
| Database ORM | **Prisma 5.22** |
| Database | **PostgreSQL** |
| AI Model | **`gemma-4-31b-it`** via `@google/generative-ai` SDK |
| UI Icons | **Lucide React** |
| Graph/Flow | **@xyflow/react** + **Dagre** (admin question blueprint view) |
| Date Formatting | **date-fns** |
| Deployment | **Docker** + **Coolify** (self-hosted PaaS) |

---

## Project Structure

```
quest/
├── app/
│   ├── page.tsx                    # Public: hero + Wizard component
│   ├── globals.css                 # Global styles + design system tokens
│   ├── layout.tsx                  # Root layout with font config
│   ├── api/
│   │   ├── auth/                   # POST /api/auth/login — cookie auth
│   │   ├── evaluate/route.ts       # POST /api/evaluate — main scoring engine
│   │   ├── re-evaluate/route.ts    # POST /api/re-evaluate — admin AI re-run
│   │   ├── questions/route.ts      # GET / PUT /api/questions — CRUD
│   │   ├── results/route.ts        # GET /api/results — all results
│   │   ├── results/[id]/route.ts   # PATCH /api/results/:id — status update
│   │   ├── dyad-compare/           # GET — compare two family members
│   │   └── settings/route.ts       # GET / PUT /api/settings — AI prompt config
│   └── admin/
│       ├── page.tsx                # Dashboard (stats: total, approved, review)
│       ├── layout.tsx              # Admin shell with sidebar
│       ├── login/page.tsx          # Login form
│       ├── results/page.tsx        # Kanban board + FamilyDetailView
│       ├── questions/page.tsx      # Question CRUD manager
│       ├── blueprint/page.tsx      # Visual question flow (React Flow diagram)
│       ├── prompt/page.tsx         # AI prompt editor (stored in DB)
│       └── components/
│           ├── Sidebar.tsx         # Navigation sidebar
│           ├── KanbanBoard.tsx     # Drag-and-drop family pipeline board
│           ├── FamilyCard.tsx      # Summary card per family
│           ├── FamilyDetailView.tsx# Full-screen family profile + AI panels
│           ├── QuestionCard.tsx    # Question preview card (admin)
│           ├── QuestionForm.tsx    # Question create/edit modal form
│           └── QuestionNode.tsx    # React Flow node (blueprint view)
├── components/                     # Public-facing UI components
│   ├── Wizard.tsx                  # Multi-step form orchestrator
│   ├── QuestionCard.tsx            # Question renderer (SJT / OPEN / MATRIX)
│   ├── RadioOption.tsx             # Styled radio button for SJT
│   ├── TextInput.tsx               # Textarea for OPEN questions
│   ├── SlidersMatrix.tsx           # Responsibility distribution sliders
│   ├── BlockHeader.tsx             # Block title/subtitle display
│   ├── ProgressBar.tsx             # Block-aware animated progress bar
│   └── ResultScreen.tsx            # Post-submission result display
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── constants.ts                # BLOCK_META (titles, icons per block)
│   └── json-extractor.ts           # 4-strategy robust JSON parser for AI output
├── store/
│   └── useFormStore.ts             # Zustand store: form state, answers, SJT
├── types/
│   └── index.ts                    # All TypeScript types and interfaces
├── prisma/
│   └── schema.prisma               # DB schema: Question, Result, Setting
├── middleware.ts                   # Auth middleware (cookie check)
├── next.config.js                  # Next.js config (ESLint/TS checks disabled for build)
├── Dockerfile                      # Docker build: node:22-alpine + prisma generate
├── tailwind.config.ts              # Extended Tailwind: custom colors, animations
└── package.json                    # v2.0.0, postinstall: prisma generate
```

---

## Database Schema

### `Question`
Stores all survey questions. Managed via the admin panel.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `code` | `String?` (unique) | Logical code, e.g. `A1`, `B2`, `C1`, `0.3` |
| `block` | `String` | `'0'`, `'A'`, `'B'`, `'C'`, `'D'` |
| `cohort` | `CohortType?` | `GRADE_1_4` or `GRADE_5_8` (null = both cohorts) |
| `type` | `String` | `SJT`, `OPEN`, `MATRIX`, `SELECT`, `TEXT` |
| `text` | `String` | Question text shown to the parent |
| `options` | `Json?` | Array of `{label, weight?, value?}` for SJT/SELECT |
| `dependsOn` | `Json?` | Conditional display: `{questionId, value}` |
| `mirrorText` | `String?` | Alternate question text (role variant) |
| `position` | `Json?` | x/y coordinates for the blueprint diagram |

### `Result`
One row per parent submission.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `familyCode` | `String?` | Links both parents (shared family identifier) |
| `parentRole` | `ParentRole?` | `MAMA`, `PAPA`, `OTHER` |
| `cohort` | `CohortType?` | Grade cohort of the child |
| `answers` | `Json` | Full answers map: `{questionCode: answerValue}` |
| `sjtScore` | `Float` | Calculated Block A weighted score |
| `aiScore` | `Float?` | AI total score from Block B evaluation |
| `totalScore` | `Float` | `sjtScore + aiScore` |
| `status` | `String` | Admin pipeline status: `PENDING`, `APPROVED`, `REJECTED`, `REVIEW`, `INTERVIEW` |
| `aiAnalysis` | `Json?` | Full AI response: `{scores, total_score, reasoning, status, behavioral_flags}` |
| `aiReasoning` | `String?` | Short AI verdict text (legacy field) |
| `behavioralFlags` | `String[]` | List of detected toxic behavioral patterns |
| `dyadMetrics` | `Json?` | Partner comparison: delta, roleConflict, metrics |

### `Setting`
Key-value store for admin-configurable parameters.

| Key | Description |
|-----|-------------|
| `gemini_prompt` | Custom AI prompt template for re-evaluation (supports `{OPEN_ANSWERS}` placeholder) |

---

## API Reference

### Public Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/questions` | None | Returns all questions (filtered by cohort if provided) |
| `POST` | `/api/evaluate` | None | Submits form answers, runs scoring engine, saves result |
| `POST` | `/api/auth/login` | None | Sets `admin_token` cookie on correct password |

### Admin Endpoints (require `admin_token` cookie)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/results` | Returns all results ordered by `createdAt DESC` |
| `PATCH` | `/api/results/:id` | Updates a result's `status` field |
| `PUT` | `/api/questions` | Bulk replace all questions (admin saves full list) |
| `POST` | `/api/re-evaluate` | Re-runs AI analysis for a specific `resultId` |
| `GET` | `/api/settings` | Returns all settings |
| `PUT` | `/api/settings` | Updates settings (e.g., custom AI prompt) |
| `GET` | `/api/dyad-compare` | Returns side-by-side comparison for a family code |

---

## Admin Panel

Accessible at `/admin` (redirects to `/admin/login` if not authenticated).
**Default password:** configured via `ADMIN_PASSWORD` environment variable.

### Dashboard (`/admin`)
Server-rendered page showing real-time statistics:
- Total submissions
- Approved count + percentage bar
- Under review count + percentage bar  
- Total questions in the database

### Results / Family Pipeline (`/admin/results`)
The core CRM view. Submissions are **grouped by `familyCode`** into `FamilyProfile` aggregates. Features:

- **Kanban board** with 4 columns: Pending → Review → Approved → Rejected
- **Drag-and-drop** to move families between columns (updates all related results)
- **Click on a family card** → opens `FamilyDetailView` (full-screen overlay) showing:
  - Average SJT score, average AI score, total rating
  - Behavioral flags (aggregated across all family members)
  - **AI Verdict panels** per parent (with color-coded B1/B2/B3 scores and "Re-run AI Analysis" button)
  - **Responsibility Chart** (Block C — visual bar showing Family/School/Child % distribution)
  - **Side-by-side answer comparison** with full question text and both parents' answers

### Questions Manager (`/admin/questions`)
Full CRUD for the question bank:
- List all questions grouped by block (0, A, B, C, D)
- Create new questions via modal form
- Edit existing questions (type, text, options, weights, conditionals, cohort)
- Delete questions

### Blueprint (`/admin/blueprint`)
Visual flow diagram (React Flow + Dagre auto-layout) showing all questions as nodes with dependency arrows. Useful for understanding the branching logic.

### AI Prompt Editor (`/admin/prompt`)
Edit the default AI evaluation prompt stored in the `Setting` table. Supports the `{OPEN_ANSWERS}` placeholder which gets replaced with the parent's Block B + C answers at runtime.

---

## AI Integration

The AI evaluation uses **`gemma-4-31b-it`** (Google Gemma) via the `@google/generative-ai` SDK.

### Important: `gemma-4-31b-it` Compatibility
- This model does **NOT** support `responseMimeType: 'application/json'`
- JSON output is enforced via the **prompt text** itself (compact one-liner schema template)
- Responses are parsed by `lib/json-extractor.ts` which implements **4 extraction strategies**:
  1. Strip markdown code fences + direct `JSON.parse()`
  2. Find first ` ```json ... ``` ` block
  3. Greedy balanced `{ ... }` scan (tries longest match first, walks inward)
  4. Fallback for `[ ... ]` array responses

If all strategies fail, a graceful fallback object is returned (`error: true`) — the admin panel displays this state clearly without crashing.

---

## Deployment

The application is deployed via **Coolify** (self-hosted PaaS) on a VPS.

### Docker Build
```dockerfile
FROM node:22-alpine
# Installs: libc6-compat, openssl (required by Prisma)
# Steps: npm ci --legacy-peer-deps → generates Prisma client → next build → expose 3000
```

Build optimizations in `next.config.js`:
- `eslint.ignoreDuringBuilds: true` — prevents OOM on low-RAM servers during build
- `typescript.ignoreBuildErrors: true` — same reason

### Coolify Configuration
- **Build method:** Dockerfile (custom, not Nixpacks)
- **Port:** 3000
- **Domain:** `quest.mezon.uz` (with Let's Encrypt SSL)
- **Database:** Managed PostgreSQL via Coolify

### Schema Migrations
Prisma schema changes are applied with:
```bash
docker exec <container_id> npx prisma db push
```
No migration history is used — `db push` directly syncs the schema.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Prisma format) |
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key for Gemma model access |
| `ADMIN_PASSWORD` | ✅ | Password for admin panel login |
| `PORT` | Optional | Defaults to `3000` |
| `HOST` | Optional | Defaults to `0.0.0.0` |
| `NEXT_TELEMETRY_DISABLED` | Optional | Set to `1` to disable Next.js telemetry |

---

## Local Development

### Prerequisites
- Node.js ≥ 22.12.0
- PostgreSQL database
- Google AI Studio API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/weissv/quest.git
cd quest

# 2. Install dependencies (postinstall auto-runs: prisma generate)
npm install --legacy-peer-deps

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL, GEMINI_API_KEY, ADMIN_PASSWORD

# 4. Push schema to database
npx prisma db push

# 5. Seed initial questions (if applicable)
# Questions can be added via the admin panel at /admin/questions

# 6. Start development server
npm run dev
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server (binds to 0.0.0.0:3000) |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio (DB browser) |

---

## Authentication

The admin panel uses **simple cookie-based authentication**:
- `POST /api/auth/login` with `{password}` → sets `admin_token=authorized` cookie
- Next.js middleware (`middleware.ts`) checks this cookie on all `/admin/*` and most `/api/*` routes
- No JWT, no sessions — intentionally minimal for a single-admin internal tool
- Public exceptions: `GET /api/questions`, `POST /api/evaluate`, `POST /api/auth/*`

---

## Design System

The UI uses a custom dark design system defined in `app/globals.css` and `tailwind.config.ts`:

- **Color palette:** Deep burgundy/plum backgrounds, teal/violet accents
- **Glassmorphism:** `.glass-card`, `.glass-card-elevated` utility classes
- **Animations:** fade-in, slide-up, scale-in, pulse-slow (defined in Tailwind config)
- **Typography:** System font stack with tight tracking for headings
- **Custom scrollbar:** `.custom-scrollbar` with thin styled scrollbar
- **Component classes:** `.btn-primary`, `.btn-ghost`, `.badge`, `.badge-success`, etc.

---

*Built for Mezon Inspiring School — a progressive private school in Uzbekistan focused on developing agency, responsibility, and conscious partnership in families.*
