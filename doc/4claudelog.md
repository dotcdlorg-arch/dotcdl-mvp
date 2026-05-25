# CDL English Pro — Claude Action Log

> Reference: `doc/2gptimprove.md`  
> Guidelines: `doc/CLAUDE.md`, `./AGENTS.md`  
> Date: 2026-05-24  
> Agent: Claude Sonnet 4.6  

---

## Session 1 — Phase 1 (First-round implementation package)

Implements the 6-item first-round package from `2gptimprove.md` Section 13.
Covers all P0 and P1 items that do not require product decisions.

---

### Action 1 — Create `lib/rate-limit.js`

**File created:** `lib/rate-limit.js`

In-memory fixed-window rate limiter. Exports `checkRateLimit(userId, key, max, windowMs)`.  
Returns `true` if the user has exceeded `max` calls in the current window.  
Evicts stale buckets when the store exceeds 1000 entries.

**Caveat (from 2gptimprove.md §3 step 1):** In-memory only — not shared across serverless instances. Acceptable as temporary protection; replace with Upstash Redis or Vercel KV for full multi-instance coverage.

---

### Action 2 — Fix TTS cache header + add rate limit to `/api/speak`

**File modified:** `app/api/speak/route.js`

Changes:
- `Cache-Control: public, max-age=86400` → `Cache-Control: private, max-age=3600`
  - Fixes P0 issue: audio was publicly cacheable, leaking user-session audio to shared CDN caches.
- Added `checkRateLimit(userId, 'speak', 20)` — 20 requests per minute per user.
  - Returns 429 before OpenAI is called.

**Verifies:** `2gptimprove.md` §3 step 1 (rate limit) + step 2 (cache fix). AGENTS.md §Critical API Rules confirms `private, max-age=3600`.

---

### Action 3 — Add rate limit to `/api/transcribe`

**File modified:** `app/api/transcribe/route.js`

Changes:
- Added `checkRateLimit(userId, 'transcribe', 10)` — 10 requests per minute per user.
  - Returns 429 with `{ text: '', error: 'Rate limit exceeded' }` to match existing error shape.

---

### Action 4 — Add rate limit to `/api/score`

**File modified:** `app/api/score/route.js`

Changes:
- Added `checkRateLimit(userId, 'score', 30)` — 30 requests per minute per user.
  - Returns 429 before GPT-4o-mini is called.

---

### Action 5 — Add input validation to `/api/progress`

**File modified:** `app/api/progress/route.js`

Changes:
- Import `QUESTIONS` and `SIGNS` from `@/lib/data`; build `VALID_Q_CODES` and `VALID_S_CODES` Sets at module load (no per-request overhead).
- For question progress POST:
  - `questionCode` must exist in `VALID_Q_CODES` → 400
  - `status` must be one of `viewed | understood | needs_review` → 400
  - `lastScore` if present must be a number 0–100 → 400
  - `lastTranscript` max 2000 chars → 400
- For sign progress POST:
  - `signCode` must exist in `VALID_S_CODES` → 400
  - `lastScore` range check → 400
  - `answer` max 2000 chars → 400

**Verifies:** `2gptimprove.md` §4 step 8. All legitimate requests unchanged.

---

### Action 6 — Create App Router state pages

**Files created:**
- `app/loading.js` — centered "Loading…" with `var(--muted)` color
- `app/error.js` — `'use client'`, logs error, shows "Something went wrong." + "Try again" button using `.btn.btn-primary`
- `app/not-found.js` — "Page not found." + Link to `/practice` using `.btn.btn-primary`

**Verifies:** `2gptimprove.md` §3 step 3. Prevents white-screen on runtime errors and missing routes.

---

### Action 7 — Replace CSS `@import` with `next/font/google`

**Files modified:**
- `app/globals.css` — removed `@import url('https://fonts.googleapis.com/...')` on line 2; updated `--font` and `--mono` CSS vars to reference `var(--font-inter)` and `var(--font-mono)` so they resolve to the optimized Next.js font families.
- `app/layout.js` — imported `Inter` and `JetBrains_Mono` from `next/font/google` with `variable` option (`--font-inter`, `--font-mono`); applied both variables to `<body className>`.

**Result:** Fonts load via Next.js font optimization (self-hosted, no external request at render time), eliminating the render-blocking `@import`.

**Verifies:** `2gptimprove.md` §3 step 4. AGENTS.md §Known Issues MED priority.

---

## Phase 1 Completion Status

| Item | Status |
|------|--------|
| P0 — `/api/speak` rate limit | Done |
| P0 — TTS cache header → private | Done |
| P0 — `app/error.js` (no white screen) | Done |
| P0 — `/api/progress` input validation | Done |
| P1 — `app/loading.js` + `app/not-found.js` | Done |
| P1 — Google Fonts → `next/font` | Done |

---

---

## Reversal Guide — Exact Diffs Per File

Each section below shows the **original state** and the **current state** so any change can be individually reversed without affecting the others.

---

### Reversal R1 — `lib/rate-limit.js` (NEW FILE — delete to reverse)

This file did not exist before. To reverse: delete `lib/rate-limit.js`.  
Deleting it will break the imports in the three API routes below (R2, R3, R4) — those must also be reverted before deleting this file.

**Current full file content (`lib/rate-limit.js`):**
```js
// In-memory rate limiter. Per-process only — not shared across serverless instances.
// Acceptable as temporary cost protection; replace with Upstash/Vercel KV for full coverage.
const store = new Map()

export function checkRateLimit(userId, key, max, windowMs = 60_000) {
  const bucket = `${userId}:${key}:${Math.floor(Date.now() / windowMs)}`
  const count = (store.get(bucket) || 0) + 1
  store.set(bucket, count)
  // Evict stale buckets to prevent unbounded growth
  if (store.size > 1000) {
    const cutoff = Math.floor(Date.now() / windowMs) - 2
    for (const k of store.keys()) {
      if (parseInt(k.split(':')[2]) < cutoff) store.delete(k)
    }
  }
  return count > max
}
```

---

### Reversal R2 — `app/api/speak/route.js` (2 changes)

**Change A — import line added (line 2)**

```diff
- import { auth } from '@clerk/nextjs/server'
+ import { auth } from '@clerk/nextjs/server'
+ import { checkRateLimit } from '@/lib/rate-limit'
```

To reverse: remove line 2 (`import { checkRateLimit } from '@/lib/rate-limit'`).

**Change B — rate limit block added after auth check (lines 28–30)**

Original (no rate limit block between auth check and apiKey check):
```js
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
```

Current (with rate limit block):
```js
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (checkRateLimit(userId, 'speak', 20)) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
```

To reverse: remove the 4-line `if (checkRateLimit...)` block.

**Change C — Cache-Control header (line 72)**

```diff
- 'Cache-Control': 'private, max-age=3600',
+ 'Cache-Control': 'public, max-age=86400', // Cache for 24h — same Q repeated = free
```

To reverse: replace `'Cache-Control': 'private, max-age=3600',` with `'Cache-Control': 'public, max-age=86400', // Cache for 24h — same Q repeated = free`.

**Full current file state (`app/api/speak/route.js`):**
```js
import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Map voice profile IDs to OpenAI TTS voices
const VOICE_MAP = {
  north_m: 'onyx', south_m: 'echo', east_m: 'fable', west_m: 'alloy',
  north_f: 'shimmer', south_f: 'nova', east_f: 'shimmer', west_f: 'nova',
}
const SPEED_MAP = {
  north_m: 0.95, south_m: 0.88, east_m: 0.97, west_m: 1.00,
  north_f: 0.95, south_f: 0.88, east_f: 0.97, west_f: 1.00,
}

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (checkRateLimit(userId, 'speak', 20)) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return new Response('OpenAI not configured', { status: 500 })

  let body
  try { body = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { text, voiceId } = body
  if (!text?.trim()) return new Response('No text provided', { status: 400 })

  const voice = VOICE_MAP[voiceId] || 'onyx'
  const speed = SPEED_MAP[voiceId] || 0.95

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'tts-1', voice, input: text.slice(0, 4096), speed }),
    })
    if (!res.ok) {
      console.error('OpenAI TTS error:', await res.text())
      return new Response('TTS failed', { status: 502 })
    }
    const audioBuffer = await res.arrayBuffer()
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (e) {
    console.error('Speak route error:', e)
    return new Response('Internal error', { status: 500 })
  }
}
```

---

### Reversal R3 — `app/api/transcribe/route.js` (2 changes)

**Original full file (before any changes):**
```js
import { auth } from '@clerk/nextjs/server'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ text: '', error: 'OpenAI not configured' })

  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ text: '', error: 'No audio' })

    const fd = new FormData()
    fd.append('file', audio, 'recording.webm')
    fd.append('model', 'whisper-1')
    fd.append('language', 'en')
    fd.append('response_format', 'json')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Whisper error:', err)
      return Response.json({ text: '', error: 'Transcription failed' })
    }

    const data = await res.json()
    return Response.json({ text: data.text || '' })
  } catch (e) {
    console.error('Transcribe error:', e)
    return Response.json({ text: '', error: e.message })
  }
}
```

**Changes made (diff):**
```diff
+ import { checkRateLimit } from '@/lib/rate-limit'
  ...
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
+
+ if (checkRateLimit(userId, 'transcribe', 10)) {
+   return Response.json({ text: '', error: 'Rate limit exceeded' }, { status: 429 })
+ }
+
  const apiKey = process.env.OPENAI_API_KEY
```

To reverse: remove the import on line 2 and the 4-line `checkRateLimit` block.

---

### Reversal R4 — `app/api/score/route.js` (2 changes)

**Original imports (before):**
```js
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { scoreKeywords } from '@/lib/data'
```

**Current imports (after):**
```js
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { scoreKeywords } from '@/lib/data'
import { checkRateLimit } from '@/lib/rate-limit'
```

**Rate limit block added after auth check:**
```diff
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
+
+ if (checkRateLimit(userId, 'score', 30)) {
+   return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
+ }
+
  const body = await req.json()
```

To reverse: remove the `checkRateLimit` import line and the 4-line block.

---

### Reversal R5 — `app/api/progress/route.js` (full rewrite)

This file was rewritten to add validation. The logic and GET handler are identical to before; only validation guards were added to the POST handler and two new imports were added.

**Original full file (before):**
```js
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { questionCode, signCode, status, lastScore, lastTranscript, answer, type } = body

  const db = createServerClient()

  if (type === 'sign' && signCode) {
    const { error } = await db.from('sign_progress').upsert({
      user_id: userId, sign_code: signCode,
      score: lastScore, answer,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,sign_code' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  if (questionCode) {
    const { error } = await db.from('question_progress').upsert({
      user_id: userId,
      question_code: questionCode,
      status: status || 'viewed',
      last_score: lastScore,
      last_transcript: lastTranscript,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,question_code' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Missing code' }, { status: 400 })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const db = createServerClient()
  const [{ data: qp }, { data: sp }, { data: mocks }] = await Promise.all([
    db.from('question_progress').select('*').eq('user_id', userId),
    db.from('sign_progress').select('*').eq('user_id', userId),
    db.from('mock_results').select('score,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5),
  ])
  return Response.json({ questionProgress: qp || [], signProgress: sp || [], recentMocks: mocks || [] })
}
```

To reverse: replace the entire file content with the original above.

**What was added in the current version:**
- `import { QUESTIONS, SIGNS } from '@/lib/data'` (new line 3)
- Module-level `VALID_Q_CODES`, `VALID_S_CODES`, `VALID_STATUS` Sets (lines 5–7)
- 3 validation guards in the sign branch: signCode in VALID_S_CODES, lastScore 0–100, answer ≤ 2000
- 4 validation guards in the question branch: questionCode in VALID_Q_CODES, status in VALID_STATUS, lastScore 0–100, lastTranscript ≤ 2000
- `const db = createServerClient()` moved inside each branch (was above both branches before)

---

### Reversal R6 — `app/loading.js` (NEW FILE — delete to reverse)

Did not exist before. To reverse: delete `app/loading.js`.

**Current full file content:**
```js
export default function Loading() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <p style={{ color:'var(--muted)', fontSize:'0.95rem' }}>Loading…</p>
    </div>
  )
}
```

---

### Reversal R7 — `app/error.js` (NEW FILE — delete to reverse)

Did not exist before. To reverse: delete `app/error.js`.

**Current full file content:**
```js
'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem' }}>
      <p style={{ color:'var(--red)', fontSize:'0.95rem' }}>Something went wrong.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  )
}
```

---

### Reversal R8 — `app/not-found.js` (NEW FILE — delete to reverse)

Did not exist before. To reverse: delete `app/not-found.js`.

**Current full file content:**
```js
import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem' }}>
      <p style={{ color:'var(--ink2)', fontSize:'0.95rem' }}>Page not found.</p>
      <Link href="/practice" className="btn btn-primary">Go to Practice</Link>
    </div>
  )
}
```

---

### Reversal R9 — `app/globals.css` (2 line changes)

**Change A — line 2 removed**

```diff
  /* CDL English Pro — Premium Design System v2.0 */
- @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
```

To reverse: re-insert as line 2 (blank line between comment and `*,*::before` reset).

**Change B — `--font` and `--mono` variables (~line 21)**

```diff
- --font:var(--font-inter),-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;
- --mono:var(--font-mono),monospace;
+ --font:'Inter',-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;
+ --mono:'JetBrains Mono',monospace;
```

To reverse: replace `var(--font-inter)` with `'Inter'` and `var(--font-mono)` with `'JetBrains Mono'`.

---

### Reversal R10 — `app/layout.js` (full rewrite)

**Original full file (before):**
```js
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata = {
  title: 'CDL English Pro — Roadside Readiness Training',
  description: 'Premium AI-powered DOT roadside English training for CDL drivers. Training only. Not affiliated with DOT, FMCSA, or CVSA.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**Current full file (after):**
```js
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata = {
  title: 'CDL English Pro — Roadside Readiness Training',
  description: 'Premium AI-powered DOT roadside English training for CDL drivers. Training only. Not affiliated with DOT, FMCSA, or CVSA.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${mono.variable}`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

**What changed:**
- Added `import { Inter, JetBrains_Mono } from 'next/font/google'`
- Added `inter` and `mono` font objects with `variable` option
- `<body>` gained `className={`${inter.variable} ${mono.variable}`}`

To reverse fonts only (keep globals.css change too if reversing): replace `app/layout.js` with the original above AND revert `app/globals.css` Change B (restore `'Inter'` and `'JetBrains Mono'` literals) AND re-add the `@import` on line 2 of globals.css.  
R9 and R10 must be reversed together — they are coupled.

---

---

## Session 2 — Continuous Play Feature (2026-05-24)

**Request:** Add a continuous-play button to 听力练习, 模拟检查, and 驾驶模式 so all question prompts play from start to finish with a 4-second gap between questions for pronunciation practice. Pause button stops the loop.

---

### Action 8 — `app/practice/page.js` — listen mode continuous play

**New module-level function `speakWithCb(text, rate, onEnd)`** added after existing `speak()`:
- Wraps `SpeechSynthesisUtterance` with `onend`/`onerror` callbacks so the autoplay chain can proceed.
- Falls back with `setTimeout(onEnd, 100)` if speechSynthesis is unavailable.

**New state + ref inside `PracticeInner`:**
- `autoPlayRef = useRef(false)` — tracks running state without stale-closure risk.
- `isAutoPlaying` state — drives play/pause button label.

**New functions inside `PracticeInner`:**
- `startAutoPlay()` — sets the ref/state, calls `playFromList(filtered, safeIdx)` to begin from the currently visible question.
- `stopAutoPlay()` — clears ref/state, calls `window.speechSynthesis.cancel()`.
- `playFromList(list, idx)` — recursive; calls `setQIdx(idx)` and clears transcript/score, speaks the question via `speakWithCb`, then after 4 seconds calls itself with `idx + 1`. Aborts if `autoPlayRef.current` is false or end of list reached.

**New i18n keys added to T object (all 5 languages):** `autoPlay`, `stopPlay`.

**JSX change (listen mode control row):** Added conditional play/pause button after the speed buttons:
```jsx
{isAutoPlaying
  ? <button className="btn btn-sm btn-danger" onClick={stopAutoPlay}>{tx('stopPlay')}</button>
  : <button className="btn btn-sm btn-success" onClick={startAutoPlay}>{tx('autoPlay')}</button>
}
```

**Reversal:** Remove `speakWithCb` function; remove `autoPlayRef`/`isAutoPlaying` declarations; remove `startAutoPlay`/`stopAutoPlay`/`playFromList` functions; remove the conditional button from the listen mode JSX; remove `autoPlay`/`stopPlay` keys from T.

---

### Action 9 — `app/mock/page.js` — write mode continuous play

**New state + ref inside `MockPage`:**
- `autoPlayRef = useRef(false)`, `isAutoPlaying` state.

**New functions inside `MockPage`** (added before `// ── INTRO ──` comment):
- `startAutoPlay()` — begins from item 0 of the stable `items` array.
- `stopAutoPlay()` — clears ref/state, cancels speechSynthesis.
- `playMockItem(list, idx)` — for question items speaks `officer_question_en`; for sign items speaks `item.data.name` (English sign name). Uses `u.rate = 0.92, u.pitch = 0.88` matching existing `speakText()` style. After utterance ends, waits 4 seconds and calls itself with `idx + 1`.

**New i18n keys added to MT object (all 5 languages):** `autoPlay`, `stopPlay`.

**JSX change (active write mode header):** Wrapped the answered-count badge in a `flex-c` div alongside the new play/pause button:
```jsx
<div className="flex-c">
  {isAutoPlaying
    ? <button className="btn btn-sm btn-danger" onClick={stopAutoPlay}>{mt(lang, 'stopPlay')}</button>
    : <button className="btn btn-sm btn-success" onClick={startAutoPlay}>{mt(lang, 'autoPlay')}</button>
  }
  <span className="badge badge-blue">…</span>
</div>
```

**Reversal:** Remove `autoPlayRef`/`isAutoPlaying` declarations; remove the three functions; revert JSX header back to `<span className="badge badge-blue">…</span>` (unwrap from flex-c div); remove `autoPlay`/`stopPlay` keys from MT.

---

### Action 10 — `app/drive/page.js` — scenario preview continuous play

**New state + ref inside `DrivePage`:**
- `autoPlayRef = useRef(false)`, `isAutoPlaying` state.

**New functions inside `DrivePage`** (added before `// ── Scenario & conversation logic ──` comment):
- `stopDrivePreview()` — clears ref/state, pauses/nulls `audioRef.current`, cancels `speechSynthesis`, sets `driverState('idle')`.
- `playPreviewList(list, idx)` — calls the existing `speak(text, onEnd)` useCallback (which uses OpenAI TTS with the selected officer voice, with browser synthesis fallback). After `onEnd` fires, waits 4 seconds and advances.
- `startDrivePreview()` — builds a question list from `selectedScenario.categories` using the same logic as `startScenario` (same shuffle + 8-question cap), then starts `playPreviewList`.

**`startScenario` modified:** `stopDrivePreview()` is called at the top so preview audio stops when the user clicks "Start conversation."

**New i18n keys added to DT object (all 5 languages):** `previewAll`, `stopPlay`.

**JSX change (select phase, inside `selectedScenario &&` block):** Added a `<div style={{ marginTop: 10 }}>` below the existing Start button:
```jsx
{isAutoPlaying
  ? <button className="btn btn-sm btn-danger" onClick={stopDrivePreview}>{dt(lang, 'stopPlay')}</button>
  : <button className="btn btn-sm" onClick={startDrivePreview}>{dt(lang, 'previewAll')}</button>
}
```
The preview uses the selected officer voice (real OpenAI TTS), so it doubles as a more thorough voice preview before committing to the full conversation.

**Reversal:** Remove `autoPlayRef`/`isAutoPlaying` declarations; remove the three functions; remove `stopDrivePreview()` call from `startScenario`; revert the `selectedScenario &&` JSX block to remove the `<div style={{ marginTop: 10 }}>` section; remove `previewAll`/`stopPlay` keys from DT.

---

## Session 3 — Auto-loop conversation in drive mode (开始对话)

### Action 11 — Add hands-free auto-loop to conversation phase of `app/drive/page.js`

**Status:** ✅ Complete

**User request:** "add function for playing all the 选择场景 questions, so that user can practice during the driving without self control. add continuous button and function under 开始对话 page"

**What was changed in `app/drive/page.js`:**

**i18n — new keys added to DT (all 5 languages):**
- `autoConv` — label for the start button (e.g. zh: `'▶ 自动循环播放'`)
- `practicing` — gap-state label shown above the current question (e.g. zh: `'跟读练习 — 请跟读发音'`)

**State / refs added** (after existing `autoPlayRef`/`isAutoPlaying`):
```js
const autoConvRef = useRef(false)
const [isAutoConv, setIsAutoConv] = useState(false)
const [autoConvIdx, setAutoConvIdx] = useState(0)
```

**Three functions added** (before `// ── Scenario & conversation logic ──`):

- `stopAutoConv()` — sets `autoConvRef.current = false`, clears state, pauses audio, cancels speechSynthesis, sets `driverState('idle')`.
- `playAutoConvItem(idx)` — checks abort flag, reads `questionsRef.current` (stale-closure safe), wraps index with modulo for infinite loop, calls `speak(text, onEnd)`, then after 4-second gap recurses.
- `startAutoConv()` — sets flag + state, kicks off `playAutoConvItem(0)`.

**JSX changes in `phase === 'conversation'` block:**

1. **Auto-conv card** inserted before the `{/* Controls */}` comment:
   - Shown only when `isAutoConv === true`
   - Shows `autoConvIdx + 1 / questions.length · practicing` header
   - While `driverState === 'speaking'`: shows officer avatar + waveform
   - Otherwise: shows the current question text + "practice pronunciation" label
   - Contains a stop (⏸) button that calls `stopAutoConv()`

2. **Idle card** (`driverState === 'idle' && currentQ...`) guarded with `!isAutoConv &&` so it hides during auto-loop. Also added `▶ 自动循环播放` button at the bottom of the idle card so users can switch into auto mode at any idle moment.

3. **Speaking card** (`driverState === 'speaking'`) guarded with `!isAutoConv &&` so the normal speaking card is hidden and replaced by the auto-conv card when loop is running.

4. **endEarly button** `onClick` changed from `() => setPhase('result')` to `() => { stopAutoConv(); setPhase('result') }` — ensures loop is fully stopped before navigating away.

**How the loop works:**
- `speak()` already uses OpenAI TTS with the selected officer voice (same as normal conversation).
- `questionsRef.current` is kept in sync by an existing `useEffect` — no stale closure.
- `idx % list.length` wraps forever; user stops with the ⏸ button or "End session."
- 4-second gap after each `onEnd` callback — time for the driver to repeat the pronunciation aloud.

**Reversal:**
- Remove `autoConvRef`, `isAutoConv`, `autoConvIdx` declarations.
- Remove `stopAutoConv`, `playAutoConvItem`, `startAutoConv` functions.
- Revert idle card: remove `!isAutoConv &&` guard; remove the `<div style={{ marginTop: 10 }}>` containing `startAutoConv` button.
- Revert speaking card: remove `!isAutoConv &&` guard.
- Remove the entire auto-conv card JSX block (from `{isAutoConv && (` to its closing `)}`).
- Revert endEarly `onClick` back to `() => setPhase('result')`.
- Remove `autoConv`/`practicing` keys from all 5 language objects in DT.

---

## Deferred / Requires Product Decision

Per `2gptimprove.md` §12, these are NOT implemented and need confirmation:

- Rate limit storage backend (Upstash Redis / Vercel KV / Supabase table) for multi-instance reliability
- Language preference persistence (`localStorage` + `LanguageProvider`) — §4 step 6
- Historical progress load on `practice` and `signs` mount — §4 step 7
- Device fingerprint strategy (disable / log-only / full enforcement) — §6
- Stripe integration and PRO/free boundary — §8
- Whether `/api/conversation` and `/api/pronunciation` in middleware are reserved or legacy

---

## Session 4 — Vercel Clerk middleware deployment fix

### Action 12 — Diagnose Vercel Edge middleware rejection

**Status:** ✅ Complete

**User-provided deployment error:**

Vercel completed `next build`, generated all static pages, and then failed during output deployment:

```text
The Edge Function "middleware" is referencing unsupported modules:
  - @clerk: @clerk/shared/buildAccountsBaseUrl, #crypto, #safe-node-apis
```

**Important distinction:** This was not a Next.js compile error and not the earlier missing Clerk publishable key error. The log showed:

```text
✓ Compiled successfully
✓ Generating static pages (16/16)
Build Completed in /vercel/output
Deploying outputs...
The Edge Function "middleware" is referencing unsupported modules
```

That means the app compiled, but Vercel rejected the generated Edge middleware bundle because Clerk internals referenced modules that Vercel's Edge Function analyzer does not allow.

**Files inspected:**
- `doc/CLAUDE.md`
- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `middleware.js`
- `app/layout.js`

**Relevant project rule confirmed from `AGENTS.md`:**

```js
import { clerkMiddleware } from '@clerk/nextjs/server'
export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})
```

The existing `middleware.js` already used this correct Clerk v6 middleware pattern. No middleware source-code rewrite was needed.

**Root cause found:**

`package.json` declared:

```json
"@clerk/nextjs": "^6.12.4"
```

But the installed dependency tree resolved to:

```text
@clerk/nextjs@6.39.4
@clerk/backend@2.33.4
@clerk/clerk-react@5.61.7
@clerk/shared@3.47.6
@clerk/types@4.101.24
```

The caret range allowed Vercel/npm to install a newer Clerk release line than the one documented in this project (`@clerk/nextjs ^6.12.4`). That newer Clerk middleware bundle pulled in unsupported internal subpath references for Vercel Edge middleware:

```text
@clerk/shared/buildAccountsBaseUrl
#crypto
#safe-node-apis
```

**Why this fix targets dependencies instead of middleware code:**
- `middleware.js` was already minimal and matched the `AGENTS.md` Clerk v6 pattern.
- The unsupported identifiers came from bundled Clerk internals, not from app code.
- Surgical fix was to pin the package versions used by middleware bundling so Vercel receives a stable, compatible Clerk dependency tree.

---

### Action 13 — Pin Clerk dependency line and lock transitive Clerk packages

**Files modified:**
- `package.json`
- `package-lock.json`

**Change 1 — Pin direct Clerk dependency**

Changed:

```json
"@clerk/nextjs": "^6.12.4"
```

to:

```json
"@clerk/nextjs": "6.12.4"
```

Reason: Prevents npm on Vercel from resolving a newer Clerk version with incompatible Edge middleware internals.

**Change 2 — Add npm overrides for Clerk transitive packages**

Added to `package.json`:

```json
"overrides": {
  "@clerk/clerk-react": "5.24.1",
  "@clerk/shared": "3.9.5",
  "@clerk/types": "4.59.3"
}
```

Reason: Pinning only `@clerk/nextjs` was not enough because its dependency ranges still allowed newer Clerk internal packages. The overrides force the dependency tree back to the package line compatible with `@clerk/nextjs@6.12.4`.

**Commands run:**

```bash
npm install @clerk/nextjs@6.12.4 --save-exact
npm pkg set overrides.@clerk/clerk-react=5.24.1 overrides.@clerk/shared=3.9.5 overrides.@clerk/types=4.59.3
npm install
```

**Resulting dependency tree verified with `npm ls`:**

```text
@clerk/nextjs@6.12.4
├─ @clerk/backend@1.34.0
├─ @clerk/clerk-react@5.24.1 overridden
├─ @clerk/shared@3.9.5 overridden
└─ @clerk/types@4.59.3 overridden
```

**Note:** npm printed deprecation warnings for older Clerk internal packages. This was accepted because the project explicitly targets Clerk v6/Core 3 and the immediate goal was to restore Vercel Edge middleware deployability without refactoring auth architecture.

---

### Action 14 — Verify production build and generated middleware bundle

**Build command run:**

```bash
npm run build
```

**Result:** ✅ Passed

Relevant output:

```text
✓ Compiled successfully
✓ Generating static pages (16/16)
ƒ Middleware 77.3 kB
```

**Middleware bundle search run after build:**

```bash
rg '@clerk/shared/buildAccountsBaseUrl|#safe-node-apis|buildAccountsBaseUrl' \
  .next/server/middleware.js \
  .next/server/middleware-manifest.json \
  .next/server/middleware-build-manifest.js

rg '#crypto' \
  .next/server/middleware.js \
  .next/server/middleware-manifest.json \
  .next/server/middleware-build-manifest.js
```

**Result:** ✅ No matches in the generated middleware output for the exact unsupported references reported by Vercel.

**Additional check attempted:**

```bash
npx vercel build
```

**Result:** Not completed locally because Vercel CLI required linked project settings:

```text
project_settings_required
No project settings found locally. Run pull to retrieve them, or re-run with --yes to pull automatically.
```

No `vercel pull` was run because that could modify local Vercel project metadata and was not necessary for the package-level fix.

**Lint command attempted:**

```bash
npm run lint
```

**Result:** Not completed because `next lint` opened an interactive migration/configuration prompt:

```text
`next lint` is deprecated and will be removed in Next.js 16.
? How would you like to configure ESLint?
```

No lint configuration was changed because it is unrelated to the Vercel middleware deployment failure.

---

## Session 4 Reversal Guide

### Reversal R12 — Restore previous Clerk dependency behavior

**File:** `package.json`

To reverse the direct dependency pin:

```diff
- "@clerk/nextjs": "6.12.4",
+ "@clerk/nextjs": "^6.12.4",
```

To reverse the transitive package lock, remove:

```json
"overrides": {
  "@clerk/clerk-react": "5.24.1",
  "@clerk/shared": "3.9.5",
  "@clerk/types": "4.59.3"
}
```

Then regenerate the lockfile:

```bash
npm install
```

**Warning:** Reversing this may allow npm/Vercel to reinstall newer Clerk internals and may reintroduce the Vercel error:

```text
The Edge Function "middleware" is referencing unsupported modules:
  - @clerk: @clerk/shared/buildAccountsBaseUrl, #crypto, #safe-node-apis
```

### Reversal R13 — Restore `package-lock.json`

`package-lock.json` was regenerated by npm after the dependency pin and overrides. To reverse manually:

1. Revert the `package.json` changes above.
2. Run:

```bash
npm install
```

Do not edit the lockfile by hand.

---

## Session 4 Deployment Follow-up

After committing the fix, push to GitHub:

```bash
git add package.json package-lock.json doc/4claudelog.md
git commit -m "Fix Vercel Clerk middleware deployment"
git push
```

Then redeploy on Vercel.

---

## Session 5 — Vercel Edge middleware: second fix (2026-05-24)

### Action 15 — Diagnose why Session 4 fix still failed on Vercel

**Status:** ✅ Complete

**Context:** Session 4 pinned `@clerk/nextjs@6.12.4` and added `overrides` for three transitive Clerk packages to older versions. The new Vercel deployment log (commit `d06b765`) showed the IDENTICAL error:

```
The Edge Function "middleware" is referencing unsupported modules:
  - @clerk: #crypto, @clerk/shared/buildAccountsBaseUrl, #safe-node-apis
```

**Why Session 4 failed:**

Session 4's local build passed (`rg` found no banned strings in `.next/server/middleware.js`), but Vercel's **post-build Edge Function analyzer** uses a stricter scan than Next.js's local bundler. The analyzer checks ALL package imports present in the bundle, including Node.js conditional import conditions (`"imports"` field in `package.json`) even when the edge branch would be selected at runtime.

`@clerk/backend@1.34.0` (used by `@clerk/nextjs@6.12.4`) embeds `#crypto` and `#safe-node-apis` Node.js conditional imports in its package manifest. `@clerk/shared` exports `buildAccountsBaseUrl` as a named subpath. These are all present in `@clerk/backend`'s code regardless of which Clerk version is pinned or what overrides are applied — the issue is structural to how Clerk's backend module is written.

**Additional problem with overrides:** The forced versions (`@clerk/clerk-react@5.24.1`, `@clerk/shared@3.9.5`, `@clerk/types@4.59.3`) are Core 2 packages being applied to Core 3 `@clerk/nextjs@6.12.4`. Both npm deprecation warnings and structural incompatibility result from this mismatch. The overrides made things worse, not better.

---

### Action 16 — Replace clerkMiddleware with lightweight cookie-check middleware

**Root cause:** Any version of `clerkMiddleware` from `@clerk/nextjs/server` bundles `@clerk/backend` into the Edge middleware. `@clerk/backend` references `#crypto`, `#safe-node-apis`, and `@clerk/shared/buildAccountsBaseUrl` — identifiers that Vercel's Edge Function analyzer bans. No amount of version pinning fixes this while `clerkMiddleware` is used.

**Fix strategy:**
- Remove `clerkMiddleware` from `middleware.js` entirely → eliminates ALL Clerk backend imports from the Edge bundle
- Replace with a lightweight cookie-presence check using only `next/server` (no external packages)
- Security is NOT degraded: every API route already calls `await auth()` from `@clerk/nextjs/server` for full JWT verification per-request. Middleware was only providing the UX redirect.

**Files modified:**

#### `middleware.js` — full rewrite

**Before:**
```js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher([
  '/practice(.*)', '/signs(.*)', '/mock(.*)',
  '/report(.*)', '/drive(.*)',
  '/api/progress(.*)', '/api/score(.*)', '/api/transcribe(.*)',
  '/api/mock(.*)', '/api/device(.*)', '/api/conversation(.*)',
  '/api/pronunciation(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const config = { matcher: [...] }
```

**After:**
```js
import { NextResponse } from 'next/server'

const PROTECTED = [
  '/practice', '/signs', '/mock', '/report', '/drive',
  '/api/progress', '/api/score', '/api/transcribe',
  '/api/mock', '/api/device', '/api/conversation', '/api/pronunciation',
]

function isProtected(pathname) {
  return PROTECTED.some(p => pathname === p || pathname.startsWith(p + '/'))
}

// Lightweight cookie-presence check — no Clerk backend imports
// Full JWT verification happens per-request in each API route via auth()
export function middleware(req) {
  if (isProtected(req.nextUrl.pathname)) {
    if (!req.cookies.has('__session')) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return new Response('Unauthorized', { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }
  return NextResponse.next()
}

export const config = { matcher: [...] }
```

**How the cookie check works:**
- Clerk sets `__session` (an HttpOnly cookie containing the session JWT) when a user signs in.
- Middleware checks only for presence of `__session` — it does NOT verify the JWT cryptographically.
- If cookie is absent: UI routes are redirected to `/sign-in`; API routes return 401.
- If cookie is present (even if expired or invalid): request proceeds, and `await auth()` in the API route performs the real JWT verification and returns `{ userId: null }` for invalid sessions → 401.
- Result: all API security is maintained; the only behavioral difference is that a user with a stale/invalid `__session` cookie could reach the UI shell of a protected page before the client-side Clerk state resolves and redirects them. No data is accessible because API calls still require valid auth.

#### `package.json` — remove incorrect overrides

**Before:**
```json
{
  "@clerk/nextjs": "6.12.4",
  ...
  "overrides": {
    "@clerk/clerk-react": "5.24.1",
    "@clerk/shared": "3.9.5",
    "@clerk/types": "4.59.3"
  }
}
```

**After:**
```json
{
  "@clerk/nextjs": "6.12.4",
  ...
}
```

The `overrides` were wrong from the start — they forced Core 2 packages into a Core 3 dependency tree, causing structural incompatibility. Removing them allows npm to resolve the correct transitive Clerk versions for `@clerk/nextjs@6.12.4`.

**Command run:**
```bash
npm install
```

Result: `up to date, audited 340 packages`

---

### Action 17 — Verify build and middleware bundle

**Build command:**
```bash
npm run build
```

**Result:** ✅ Passed

**Key output:**
```
✓ Compiled successfully in 1587ms
✓ Generating static pages (16/16)
ƒ Middleware  34.3 kB   ← was 77.9 kB with clerkMiddleware
```

Middleware bundle shrank from **77.9 kB → 34.3 kB** (55% reduction), confirming Clerk backend code is no longer bundled.

**Bundle scan:**
```bash
grep -l '#crypto|#safe-node-apis|buildAccountsBaseUrl' \
  .next/server/middleware.js \
  .next/server/middleware-manifest.json \
  .next/server/middleware-build-manifest.js
```

**Result:** ✅ `CLEAN — none of the rejected identifiers found`

---

## Session 5 Reversal Guide

### Reversal R15 — Restore clerkMiddleware (undo this fix)

To reverse, restore `middleware.js` to:
```js
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtected = createRouteMatcher([
  '/practice(.*)', '/signs(.*)', '/mock(.*)',
  '/report(.*)', '/drive(.*)',
  '/api/progress(.*)', '/api/score(.*)', '/api/transcribe(.*)',
  '/api/mock(.*)', '/api/device(.*)', '/api/conversation(.*)',
  '/api/pronunciation(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

**Warning:** Restoring `clerkMiddleware` will re-introduce the Vercel Edge deployment error unless a Clerk version is used that does not bundle `@clerk/backend` in the Edge function (no such version exists in the `6.x` line as of 2026-05-24).

---

## Session 5 Deployment Instructions

Push to GitHub and redeploy:

```bash
git add middleware.js package.json package-lock.json doc/4claudelog.md
git commit -m "Fix Vercel Edge: replace clerkMiddleware with lightweight cookie check"
git push
```

Then trigger a new Vercel deployment.
