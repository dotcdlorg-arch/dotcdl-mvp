# AGENTS.md — CDL English Pro

> AI coding agent context file. Loaded automatically by Claude Code, Cursor, Copilot Workspace, and any agent that respects AGENTS.md / CLAUDE.md.
> IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any Next.js or project-specific tasks.

---

## Project Identity

- **Name**: CDL English Pro
- **Version**: 2.1.0
- **Purpose**: AI-powered English proficiency training platform for CDL (Commercial Driver's License) truck drivers. Helps non-native English speakers pass DOT/FMCSA roadside English Language Proficiency (ELP) checks.
- **Disclaimer**: Training only. Not affiliated with DOT, FMCSA, CVSA, or any government agency.

---

## Stack — Read Before Writing Any Code

```
Next.js      15.5.18   App Router · NO Pages Router · NO Server Actions
React        19        Functional components only · no class components
JavaScript   ES2022    NO TypeScript · NO JSX files with .tsx extension
CSS          Custom    globals.css CSS Variables · NO Tailwind · NO CSS Modules
Auth         @clerk/nextjs ^6.12.4  (Clerk Core 3 — auth() is async)
Database     Supabase  PostgreSQL · service role key server-side only
AI / STT     OpenAI    Whisper (transcribe) · GPT-4o-mini (score) · TTS-1 (speak)
Webhook      svix      ^1.61.0
Path alias   @/        maps to project root (jsconfig.json)
```

---

## Critical API Rules — Do Not Get These Wrong

### Clerk v6 (Core 3) — Server-Side

```js
// CORRECT — auth() is an async function, must be awaited
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()

// CORRECT — middleware uses auth.protect() directly (NOT auth().protect())
import { clerkMiddleware } from '@clerk/nextjs/server'
export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()  // auth is the object here, not a function
})

// CORRECT — headers() is async in Next.js 15
import { headers } from 'next/headers'
const headerPayload = await headers()

// WRONG — do not use this pattern (Clerk v4 style, breaks in v6)
const { userId } = auth()               // missing await
await auth().protect()                  // wrong in middleware context
```

### Supabase — Two Separate Clients

```js
// SERVER (API routes, Server Components) — uses SERVICE ROLE KEY
import { createServerClient } from '@/lib/supabase/server'
const db = createServerClient()

// CLIENT (browser components) — uses ANON KEY
import { createClient } from '@/lib/supabase/client'
const db = createClient()

// NEVER use SUPABASE_SERVICE_ROLE_KEY on the client side
// NEVER use createBrowserClient in API routes
```

### Next.js 15 Async APIs

```js
// These are ALL async in Next.js 15 — always await them
const headerPayload = await headers()
const cookieStore  = await cookies()
const params       = await props.params        // in page components
const searchParams = await props.searchParams  // in page components
```

### API Route Response Pattern

```js
// CORRECT — use Response.json() (not NextResponse.json)
return Response.json({ ok: true, data })
return Response.json({ error: 'Unauthorized' }, { status: 401 })

// Audio response (speak route)
return new Response(audioBuffer, {
  headers: {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'private, max-age=3600',  // private, NOT public
  }
})
```

---

## Project File Map

```
cdl_pro/
├── app/
│   ├── layout.js              Root layout — ClerkProvider wraps everything
│   ├── page.js                Landing page — Server Component, public
│   ├── globals.css            Design system — CSS vars, dark mode, utility classes
│   ├── practice/page.js       'use client' — text/listen/speak modes via ?mode=
│   ├── signs/page.js          'use client' — traffic sign flashcards
│   ├── mock/page.js           'use client' — 19-item mock inspection (write+speak)
│   ├── drive/page.js          'use client' — voice conversation with AI officer
│   ├── report/page.js         Server Component — pulls Supabase data server-side
│   ├── sign-in/[[...sign-in]]/page.js   Clerk catch-all
│   ├── sign-up/[[...sign-up]]/page.js   Clerk catch-all
│   └── api/
│       ├── speak/route.js     POST — OpenAI TTS-1 → returns MP3 audio
│       ├── transcribe/route.js POST — OpenAI Whisper → returns { text }
│       ├── score/route.js     POST — keyword score + GPT-4o-mini semantic score
│       ├── progress/route.js  GET (history) / POST (upsert) — Supabase
│       ├── mock/route.js      GET (history) / POST (save result) — Supabase
│       ├── device/route.js    POST — device fingerprint limit (max 2 devices)
│       └── webhooks/clerk/route.js  POST — Svix-verified Clerk events
├── components/
│   └── AppShell.js            'use client' — sidebar nav, topbar, lang switcher
├── lib/
│   ├── data.js                Exports QUESTIONS, SIGNS, SCENARIOS, scoreKeywords()
│   └── supabase/
│       ├── server.js          createServerClient() — service role
│       └── client.js          createClient() — anon key, browser only
├── data/
│   ├── questions.json         140 Q&A items, 16 fields including 5-lang explanations
│   └── signs.json             84 traffic signs, 15 fields
├── public/signs/              84 PNG images named PDF_SIGN_001.png … PDF_SIGN_084.png
├── middleware.js              Clerk route protection
├── jsconfig.json              @/* path alias → ./
├── next.config.mjs
├── package.json
└── .env.example               All required env vars documented
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=          # public, safe in browser
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # public, safe in browser
SUPABASE_SERVICE_ROLE_KEY=         # SECRET — server only, never expose to client

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= # public
CLERK_SECRET_KEY=                  # SECRET — server only
CLERK_WEBHOOK_SECRET=              # SECRET — webhook validation
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/practice
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/practice

# OpenAI
OPENAI_API_KEY=                    # SECRET — server only

# Site
NEXT_PUBLIC_SITE_URL=              # e.g. https://dotcdl.org
```

---

## Database Schema (Supabase Tables)

```sql
-- User profiles (synced from Clerk via webhook)
profiles (
  id text PRIMARY KEY,      -- Clerk userId
  email text,
  language text,            -- 'zh' | 'es' | 'hi' | 'pa' | 'vi'
  plan text,                -- 'free' | 'pro'
  created_at timestamptz
)

-- Per-question progress
question_progress (
  id uuid PRIMARY KEY,
  user_id text,             -- Clerk userId
  question_code text,       -- e.g. 'Q001'
  status text,              -- 'viewed' | 'understood' | 'needs_review'
  last_score int,           -- 0-100
  last_transcript text,
  updated_at timestamptz,
  UNIQUE(user_id, question_code)
)

-- Per-sign progress
sign_progress (
  id uuid PRIMARY KEY,
  user_id text,
  sign_code text,           -- e.g. 'PDF_SIGN_001'
  score int,
  answer text,
  updated_at timestamptz,
  UNIQUE(user_id, sign_code)
)

-- Mock inspection results
mock_results (
  id uuid PRIMARY KEY,
  user_id text,
  score int,
  total_items int,
  details jsonb,
  created_at timestamptz
)

-- Device fingerprint tracking (anti-sharing, max 2 per user)
device_sessions (
  id uuid PRIMARY KEY,
  user_id text,
  fingerprint text,
  user_agent text,
  risk_score int,
  created_at timestamptz
)
```

---

## Data Structures

### Question (questions.json)

```js
{
  question_code: "Q001",           // unique ID
  category: "Basic Identity / Documents",  // one of 5 categories
  difficulty: "Beginner",          // 'Beginner' | 'Intermediate' | 'Mock Test'
  officer_question_en: "...",      // what the officer asks in English
  simple_driver_answer_en: "...",  // model answer in English
  required_keywords: ["cdl", "class a", "license"],  // scoring keywords
  acceptable_variations: [...],
  common_mistakes: [...],
  explanation_zh: "...",           // native language explanations (5 langs)
  explanation_es: "...",
  explanation_hi: "...",
  explanation_pa: "...",
  explanation_vi: "...",
  training_modes: ["text", "listen", "speak"],
  final_test_language: "English",
  review_status: "approved"
}
```

### Sign (signs.json)

```js
{
  sign_code: "PDF_SIGN_001",       // matches /public/signs/PDF_SIGN_001.png
  name: "Stop Sign",
  category: "Regulatory",
  meaning: "...",
  action: "...",
  keywords: ["stop", "complete stop", "intersection"],
  image_path: "/signs/PDF_SIGN_001.png",
  explanation_zh: "...",           // 5 language explanations
  explanation_es: "...",
  explanation_hi: "...",
  explanation_pa: "...",
  explanation_vi: "..."
}
```

### ScoreResult (from /api/score)

```js
{
  score: 75,                       // 0-100 combined score
  feedback: "...",                 // feedback in user's language
  wordScores: [                    // per-word pronunciation scores
    { word: "license", score: 90 },
    { word: "registration", score: 60 }
  ]
}
```

---

## Scoring System — Two-Layer Architecture

```
Layer 1 — Local keyword score (always runs, zero API cost):
  scoreKeywords(userAnswer, keywords) → 0-100
  Logic: 20pts if answer has real words + up to 80pts for keyword hits
  Located in: lib/data.js

Layer 2 — GPT-4o-mini semantic score (runs only if OPENAI_API_KEY set):
  Returns semantic_score (0-40) + feedback + word_scores
  Final score = min(100, keywordScore + semanticScore)
  Falls back gracefully to keyword score on any API failure

Do not change this architecture — it is intentional for cost control.
```

---

## i18n System

**Five supported languages**: `zh` (Chinese) · `es` (Spanish) · `hi` (Hindi) · `pa` (Punjabi) · `vi` (Vietnamese)

**Current implementation** (distributed — known tech debt):
- `AppShell.js` → `NAV_LABELS` object with 5 language keys
- `practice/page.js` → `const T = { zh: {...}, es: {...}, ... }`
- `drive/page.js` → `const DT = { zh: {...}, es: {...}, ... }`
- `mock/page.js` → `const MT = { zh: {...}, es: {...}, ... }`

**Access pattern**:
```js
// Each page defines its own lookup function
function t(lang, key) {
  const table = T[lang] || T.zh          // fallback to Chinese
  return table[key] !== undefined ? table[key] : (T.zh[key] || key)
}
```

**Rule**: Final practice/test answers must always be in English. The UI and explanations use the user's native language, but the answer field is English-only.

---

## Officer Voice Profiles (Drive Mode)

Eight voice profiles mapped to OpenAI TTS voices:

```js
const VOICE_MAP = {
  north_m: 'onyx',    // Northern US, Male   — deep authoritative
  south_m: 'echo',    // Southern US, Male   — warm, slower rate 0.88
  east_m:  'fable',   // Eastern US, Male    — clear, rate 0.97
  west_m:  'alloy',   // Western US, Male    — neutral, rate 1.00
  north_f: 'shimmer', // Northern US, Female — clear, rate 0.95
  south_f: 'nova',    // Southern US, Female — warm, rate 0.88
  east_f:  'shimmer', // Eastern US, Female  — clear, rate 0.97
  west_f:  'nova',    // Western US, Female  — warm, rate 1.00
}
```

Audio is streamed from `/api/speak`, cached 1h with `Cache-Control: private`.
Always include graceful fallback to `window.speechSynthesis` when API fails.

---

## Protected Routes (middleware.js)

These routes require Clerk authentication:

```
/practice(.*)
/signs(.*)
/mock(.*)
/report(.*)
/drive(.*)
/api/progress(.*)
/api/score(.*)
/api/transcribe(.*)
/api/mock(.*)
/api/device(.*)
/api/conversation(.*)
/api/pronunciation(.*)
```

Public routes: `/` (landing page), `/sign-in`, `/sign-up`, `/api/webhooks/clerk`

---

## CSS Design System (globals.css)

Key CSS variables — always use these, never hardcode colors:

```css
--bg / --bg2 / --bg3 / --bg4   /* background layers */
--ink / --ink2 / --muted        /* text colors */
--line / --line2                /* borders */
--brand / --brand-dark / --brand-light / --brand-text  /* blue primary */
--green / --gbg / --gbd         /* success */
--red / --rbg / --rbd           /* danger */
--amber / --abg / --abd         /* warning */
--purple / --pbg / --pbd        /* premium */
--teal / --tbg / --tbd          /* info */
--r: 14px                       /* border-radius large */
--rs: 9px                       /* border-radius small */
--topbar-h: 62px
--sidebar-w: 252px
--font: 'Inter', -apple-system, ...
--mono: 'JetBrains Mono', monospace
```

Key utility classes: `.card`, `.btn`, `.btn-primary`, `.btn-drive`, `.btn-sm`, `.btn-lg`, `.badge`, `.badge-green`, `.badge-amber`, `.badge-red`, `.badge-blue`, `.bar`, `.bar-fill`, `.nav-btn`, `.nav-btn.active`, `.msg`, `.msg.officer`, `.msg.driver`, `.conv-thread`, `.score-ring`, `.waveform`, `.rec-zone.recording`

Dark mode: Automatically applied via `@media(prefers-color-scheme:dark)` — all variables are overridden, no manual class toggling needed.

---

## Common Patterns — Copy These

### API Route Template

```js
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  let body
  try { body = await req.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { field } = body
  if (!field?.trim()) return Response.json({ error: 'Missing field' }, { status: 400 })

  const db = createServerClient()
  const { data, error } = await db.from('table_name')
    .upsert({ user_id: userId, field }, { onConflict: 'user_id,field' })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, data })
}
```

### Server Component with Auth

```js
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServerClient()
  const [{ data: tableA }, { data: tableB }] = await Promise.all([
    db.from('table_a').select('*').eq('user_id', userId),
    db.from('table_b').select('*').eq('user_id', userId),
  ])

  return <div>...</div>
}
```

### Client Component with Recording

```js
'use client'
import { useState, useRef } from 'react'

export default function RecordingComponent() {
  const [recState, setRecState] = useState('idle') // idle | listening | processing
  const mrRef = useRef(null)

  async function startListening() {
    if (!navigator.mediaDevices?.getUserMedia) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
    })
    const chunks = []
    mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data)
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setRecState('processing')
      const blob = new Blob(chunks, { type: mr.mimeType })
      const fd = new FormData()
      fd.append('audio', blob, 'recording.webm')
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const { text } = await res.json()
      // handle text...
      setRecState('idle')
    }
    mr.start()
    mrRef.current = mr
    setRecState('listening')
  }

  function stopListening() {
    if (mrRef.current?.state !== 'inactive') mrRef.current?.stop()
  }
}
```

### Adding a New Page

```js
// 1. Create app/[feature]/page.js
'use client'  // if interactive

import AppShell from '@/components/AppShell'
import { useState } from 'react'

export default function FeaturePage() {
  const [lang, setLang] = useState('zh')
  return (
    <AppShell lang={lang} setLang={setLang}>
      {/* page content */}
    </AppShell>
  )
}

// 2. Add to middleware.js isProtected if auth required:
// '/feature(.*)'

// 3. Add to AppShell.js NAV array:
// { href: '/feature', icon: '🎯', labelKey: 'feature' }

// 4. Add labelKey to NAV_LABELS in AppShell.js for all 5 languages
```

---

## Known Issues & Active Tech Debt

These are documented problems — fix them if working in the area, don't introduce more:

| Priority | Issue | Location |
|----------|-------|----------|
| 🔴 HIGH | `/api/speak` has NO rate limiting — can rack up OpenAI bills | `app/api/speak/route.js` |
| 🔴 HIGH | i18n is split across 4 files with inconsistent key naming | All page files |
| 🟡 MED | `lang` state resets on page navigation (not persisted) | All pages |
| 🟡 MED | Practice page doesn't load historical progress on mount | `app/practice/page.js` |
| 🟡 MED | `app/globals.css` uses `@import` for Google Fonts (blocks render) | `app/globals.css` line 1 |
| 🟡 MED | Missing `loading.js`, `error.js`, `not-found.js` | `app/` root |
| 🟡 MED | `/api/device` fingerprint comes from client body — easily spoofed | `app/api/device/route.js` |
| 🟡 MED | `Cache-Control: public` on TTS audio should be `private` | `app/api/speak/route.js` |
| 🟢 LOW | `app/report/page.js` has no language switcher | `app/report/page.js` |
| 🟢 LOW | Frontend never calls `/api/device` — feature not activated | `app/api/device/route.js` |

---

## What Does NOT Exist Yet — Don't Assume It Does

- ❌ No TypeScript (`.ts` / `.tsx` files) — keep everything `.js`
- ❌ No Tailwind — use CSS variables from globals.css
- ❌ No Redux, Zustand, Jotai, or any state management library
- ❌ No React Query or SWR — fetch directly
- ❌ No Stripe or payment integration
- ❌ No admin dashboard or `/admin` route
- ❌ No `loading.js`, `error.js`, `not-found.js` (planned, not yet created)
- ❌ No `hooks/` directory (recordings logic is inline in each page)
- ❌ No `lib/i18n/` directory (translations are inline in each page)
- ❌ No `constants/` directory (OFFICER_VOICES and SCENARIOS are in page files)
- ❌ No unit tests, E2E tests, or CI/CD
- ❌ No Prettier config
- ❌ No Server Actions — all mutations go through `fetch('/api/...')`

---

## Next.js 15 Docs Index

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any Next.js tasks. When writing code that uses Next.js APIs, consult the docs rather than relying on training data — Next.js 15 has breaking changes from v14.

To set up version-matched docs for this project (Next.js 15.5.18):

```bash
npx @next/codemod@canary agents-md
```

This downloads matching docs to `.next-docs/` and injects a compressed index here. Until then, key Next.js 15 API facts are inline below:

**App Router fundamentals**:
- All components in `app/` are Server Components by default
- Add `'use client'` at top of file to make it a Client Component
- Server Components can `await` directly — no `useEffect` needed for initial data
- Client Components cannot use `async/await` at the component level

**Route Handlers** (`app/api/.../route.js`):
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Use `Response.json()` — not `NextResponse.json()`
- Access request body: `const body = await req.json()`
- Access form data: `const formData = await req.formData()`

**Middleware** (`middleware.js`):
- Must use `export const config = { matcher: [...] }` to define which routes it runs on
- Clerk middleware: `auth` parameter in `clerkMiddleware` is the auth object, use `auth.protect()` directly

**Images**: Use `next/image` `<Image>` component for all images. Always provide `width` and `height` props.

**Fonts**: Use `next/font/google` in `layout.js`, NOT `@import` in CSS files.

**Metadata**: Export `metadata` or `generateMetadata` from Server Components only.

---

## Agent Workflow Instructions

Before writing any code in this project:

1. **Explore project structure first** — understand which file you need to modify
2. **Check this file** for the correct API patterns (especially Clerk v6 and Next.js 15)
3. **Check existing similar files** — e.g. if adding a new API route, read an existing one like `app/api/score/route.js` first
4. **Do not introduce new dependencies** without confirming they're needed — the dependency list is intentionally minimal
5. **Match the existing style** — CSS variables not hardcoded colors, `Response.json()` not `NextResponse`, `async/await` not `.then()`
6. **Do not add TypeScript** — this project is JavaScript only
7. **Do not add Tailwind** — use CSS variables and existing utility classes from `globals.css`
8. **Do not create Server Actions** — use Route Handlers (`app/api/`)
9. **Run `npm run build` mentally** — check that you haven't broken any imports or used client APIs in server components

When adding new API routes, always include:
- `await auth()` check at the top
- Input validation before DB calls
- Try/catch or error check on DB operations
- Consistent `Response.json({ ok, data, error })` shape

---

*Last updated: May 2026 · Next.js 15.5.18 · Clerk v6 · Supabase · OpenAI*
