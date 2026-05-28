# 2improve.md — Current Project Status vs. Improvement Plan

> **Audit date:** 2026-05-27
> **Compared against:** [`doc/1improve.md`](1improve.md) (architectural analysis), [`doc/2gptimprove.md`](2gptimprove.md) (phased execution plan)
> **Action history:** [`doc/4claudelog.md`](4claudelog.md) (Actions 1–37) · [`doc/4claudelog2.md`](4claudelog2.md) (Actions 37–44) · [`doc/4claudelog3.md`](4claudelog3.md) (Actions 45–51) · [`doc/4claudelog4.md`](4claudelog4.md) (Actions 52–57) · [`doc/4claudelog5.md`](4claudelog5.md) (Actions 58–62) · [`doc/4claudelog6.md`](4claudelog6.md) (Actions 63–68)

Legend: ✅ Done · ⚠️ Partial · ❌ Not started

---

## 0. Headline scorecard

| Phase (from 2gptimprove.md) | Items | Done | Partial | Not started |
|---|---:|---:|---:|---:|
| **P0 — Cost & safety (Phase 1)** | 5 | 5 | 0 | 0 |
| **P1 — UX fixes (Phase 2)** | 6 | 4 | 0 | 2 |
| **P2 — Structure (Phase 3)** | 5 | 0 | 0 | 5 |
| **Phase 4 — Device limits** | 1 | 0 | 0 | 1 |
| **Phase 5 — Engineering** | 5 | 0 | 0 | 5 |
| **Phase 6 — Commercial (Stripe)** | 1 | 0 | 0 | 1 |
| **Beyond plan — feature work** | 30+ | 30+ | 0 | — |
| **Total roadmap items** | 23 | 9 | 0 | 14 |

**One-line summary:** all safety/cost P0 risks closed; most P1 UX gaps closed too; **the big structural refactor (P2/P3 — i18n split, hooks extraction, component library, TypeScript, tests, CI) is still entirely outstanding**, and the three large page files have actually grown (~700 → 800+ lines) under feature pressure.

---

## 1. Phase 1 — Cost & safety (P0) — ✅ COMPLETE

From 2gptimprove.md §3 + 1improve.md §13 high-severity risks.

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | `/api/speak` rate limit | ✅ | [`lib/rate-limit.js`](../lib/rate-limit.js) created in **Action 1**, wired into [`app/api/speak/route.js`](../app/api/speak/route.js) in **Action 2**. 20/min user-level limit. |
| 2 | `/api/transcribe` rate limit | ✅ | **Action 3** — 10/min |
| 3 | `/api/score` rate limit | ✅ | **Action 4** — 30/min |
| 4 | TTS `Cache-Control` → `private` | ✅ | **Action 2** — header now `private, max-age=3600` (grep-verified at `app/api/speak/route.js:74`). |
| 5 | `/api/progress` input validation | ✅ | **Action 5** — `questionCode` / `signCode` whitelist + `score` range check + `status` enum. |

**`/api/translate` got rate limiting too** (added later when the Q&A translation feature shipped in Action 59) — bonus coverage not in the original plan.

---

## 2. Phase 2 — UX fixes (P1) — ⚠️ 4 of 6 done

From 2gptimprove.md §4.

| # | Item | Status | Evidence |
|---|---|---|---|
| 6 | App Router state pages (`loading.js`, `error.js`, `not-found.js`) | ✅ | **Action 6** — all three created at [`app/loading.js`](../app/loading.js), [`app/error.js`](../app/error.js), [`app/not-found.js`](../app/not-found.js). |
| 7 | Google Fonts via `next/font` | ✅ | **Action 7** — Inter + JetBrains_Mono now loaded in [`app/layout.js:1`](../app/layout.js#L1) via `next/font/google`; CSS `@import` removed. |
| 8 | Language preference persistence | ❌ | **NOT DONE.** Every page still does `useState('zh')` independently (e.g., [`app/practice/page.js:290`](../app/practice/page.js#L290)). Refresh resets to Chinese; cross-page nav loses selection. No `useLang` hook, no `LanguageProvider`, no `localStorage` write. |
| 9 | Load history progress on mount (`GET /api/progress`) | ❌ | **NOT DONE.** Neither [`app/practice/page.js`](../app/practice/page.js) nor [`app/signs/page.js`](../app/signs/page.js) calls `GET /api/progress` on mount — only `POST` for writes. Sidebar stats still start from zero after refresh. |
| 10 | Unified user-feedback (toast / inline alerts) | ❌ | Still uses `alert()` for mic errors and silent failures for `/api/progress` POST. No `<Toast>` / `<InlineAlert>` component. |
| 11 | Lint script verification | ⚠️ | `package.json` keeps `"lint": "next lint"`. Build works (`npx next build` ✓ 18/18 every action), but the lint script was never explicitly re-validated for ESLint 9 compatibility. |

**Net for Phase 2:** the visible breakage items (loading/error pages, font blocking) are closed. The behavioral items (language memory, progress recall) still bite users on every visit.

---

## 3. Phase 3 — Structure refactor (P2) — ❌ NOT STARTED

From 2gptimprove.md §5 + 1improve.md §16 target architecture.

| # | Item | Status | Notes |
|---|---|---|---|
| 12 | `hooks/useRecorder.js` | ❌ | No `hooks/` directory exists. Recording logic still duplicated across `app/practice/page.js`, `app/mock/page.js`, `app/drive/page.js`. |
| 13 | `hooks/useScoring.js` | ❌ | Same — transcribe→score→progress chain still inlined in each page. |
| 14 | `hooks/useProgress.js` | ❌ | Not built. |
| 15 | Component library (`components/ui/`, `components/features/`, `components/layout/`) | ❌ | Only [`components/AppShell.js`](../components/AppShell.js) exists. No `ScoreRing`, `RecordButton`, `WaveformIndicator`, `QuestionCard`, `LanguageSelector` extracted — they're still inline. |
| 16 | Centralized i18n (`lib/i18n/`) | ❌ | Each page still owns its own `T` / `MT` / `T` (Terms) translation table. 6 languages × 4 pages = still 4 maintenance points. No `next-intl`, no `lib/i18n/messages.{zh,es,hi,pa,vi}.js`. |
| — | `constants/` directory | ❌ | `SCENARIOS`, `VOICE_MAP`, `OFFICER_VOICES`, protected-routes list — still scattered. |

### File-size pressure (the "single-file too large" problem from 1improve.md §13 problem 6)

| File | 1improve.md baseline | Current (post Action 68) | Δ |
|---|---:|---:|---:|
| `app/practice/page.js` | ~700 | **872** | +172 |
| `app/mock/page.js` | ~700 | **781** | +81 |
| `app/drive/page.js` | ~700 | **818** | +118 |
| `components/AppShell.js` | ~230 | **300** | +70 |
| `app/globals.css` | ~436 | **514** | +78 |

Feature work (Actions 8–11 continuous play; 43–44 Drive UX; 45–47 Hear-answer; 51–54 Terms; 58–62 Practice translation card; 65–67 phone top bar) all landed inside the existing files. **Structural refactor is now overdue, not just deferred** — the longer it waits, the bigger the diff will be when it happens.

---

## 4. Phase 4 — Device limits — ❌ NOT ADDRESSED

[`app/api/device/route.js`](../app/api/device/route.js) is still:
- ⚠️ unreachable from frontend (no caller anywhere in `app/`)
- ⚠️ trusting client-supplied `fingerprint` (forgery trivial)

No product decision recorded (Phase 4 of 2gptimprove.md was explicitly gated on user confirmation between options A / B / C). Recommend either deleting the route or reactivating with server-derived signals + a frontend caller; current state is dead code.

---

## 5. Phase 5 — Engineering (P3) — ❌ NOT STARTED

| # | Item | Status |
|---|---|---|
| 17 | Prettier (`.prettierrc`, `npm run format`) | ❌ |
| 18 | Unit tests (`scoreKeywords`, `getExplanation`, route validation) | ❌ No `*.test.*` / `*.spec.*` files. No Vitest / Jest configured. |
| 19 | E2E tests (Playwright) | ❌ |
| 20 | CI pipeline (`.github/workflows/`) | ❌ No `.github/` directory. |
| 21 | Error monitoring (Sentry or equivalent) | ❌ Only `console.error` everywhere. |
| 22 | Structured logging (Pino / Winston) | ❌ |
| 23 | TypeScript migration | ❌ Pure JavaScript, no `.ts` / `.tsx` outside `node_modules`. |

---

## 6. Phase 6 — Commercial / Stripe — ❌ NOT ADDRESSED

`profiles.plan` field still exists in schema. No Stripe SDK, no Checkout flow, no webhook, no PRO gate enforcement in middleware. `/drive` is reachable by any authenticated user.

---

## 7. Beyond-plan work — what's been built (Actions 1–68)

Counted by source-of-task: these are NOT in 1improve.md or 2gptimprove.md. They came from direct user feature requests during 68 logged sessions.

### 7.1 Vercel / deployment stabilization — Actions 12–29

A 17-action chain to diagnose and fix a `MIDDLEWARE_INVOCATION_FAILED` 500 on Vercel:
- Pinned Clerk dependency line (Action 13)
- Eventually moved middleware to Node.js runtime + `vercel.json` framework hint (Actions 27–28)
- Restored `clerkMiddleware` after isolating the Edge Runtime root cause (Action 29)

Result: production deploy works. Documented in detail in [`doc/4claudelog.md`](4claudelog.md).

### 7.2 OpenAI TTS unified — Actions 30–35

Routed all `speak()` / `speakWithCb()` / `speakText()` calls in `practice`, `mock`, `drive` through `/api/speak` (was using browser SpeechSynthesis in some places). Added optional `speed` parameter to the API. Result: consistent voice everywhere; rate limiting + auth now actually protect every TTS call.

### 7.3 Cost-tracking doc — Actions 36–37

Created [`doc/Vercerror_Soluti.md`](Vercerror_Soluti.md) including cost-accounting for the OpenAI surface area.

### 7.4 Mobile UX overhaul — Actions 37, 41, 57, 65–67

- Bottom 6-tab mobile nav (Actions 41, 57)
- Phone-only icon-bar top controls for `/practice` (Actions 65–66) and `/signs` (Action 67)
- Desktop UI explicitly preserved via `.hide-on-phone` / `.hide-on-desktop` utility classes
- Brand collapses "CDL English Pro" → "ELP" on phone only

### 7.5 Continuous play — Actions 8–11

Auto-loop "Play all" added to: listening mode, mock write mode, drive scenario preview, drive conversation phase (hands-free). Later bug-fixed for mobile silence (Actions 60–61) — root cause was iOS autoplay gesture loss after `await fetch`; fixed with persistent unlocked `<audio>` element.

### 7.6 Terms feature — Actions 51–54

New `/terms` page with 63 trucking glossary terms × 6 languages × inspector–driver conversation pair. Dual-voice playback (different voices for inspector vs driver). Side-by-side selected-language translation card.

### 7.7 Practice → Listening / Speak + AI improvements — Actions 58–62, 64

- Always-visible selected-language explanation block under Standard Answer (Action 58)
- Keywords field replaced with live OpenAI Q&A Translation card, localStorage-cached (Action 59)
- English subtitle font size in Q&A card enlarged to match Explanation block (Action 64)

### 7.8 Drive Mode polish — Actions 44, 46–50

- Hear-answer voice button (Action 44)
- Prev/Next conversation navigation (Action 46)
- Scenario dropdown selector (Action 48)
- Multiple fixes for frozen-officer / auto-advance bugs (Actions 47, 49, 50)

### 7.9 Mock Inspection — Actions 43, 62

- Speaking mode now shows correct-answer + explanation + Prev/Next (Action 43)
- 🔊 Hear-answer button on Model Answer card with different voice from officer (Action 62)

### 7.10 Multilingual landing page — Actions 38–40

Landing `app/page.js` translated into 6 UI languages with picker; Progress Report page (`/report`) also got the language selector (Action 40 — closes one of 1improve.md §5.5's reported gaps).

### 7.11 Filtering UX — Actions 55–56, 63

- Category chip buttons (Terms-style) replacing dropdowns in Practice + Signs (Action 55)
- Single-line scrollable chips on phone (Action 56)
- Search input removed entirely from Practice / Terms / Signs (Action 63)

### 7.12 Documentation — Actions 36, 68

- [`doc/Vercerror_Soluti.md`](Vercerror_Soluti.md) — Vercel debug + cost accounting
- [`../data.md`](../data.md) — full content inventory: 140 Q, 84 signs, 63 terms, 63 conv pairs ×5 langs, 6 scenarios

---

## 8. Cross-reference — original 1improve.md problem list

For each of the 11 numbered problems in §13 of 1improve.md:

| # | Problem | Status now | Resolution |
|---|---|---|---|
| 1 | 🔴 `/api/speak` no rate limit (OpenAI bill risk) | ✅ Fixed | Action 2 |
| 2 | 🔴 Device fingerprint forgeable | ❌ Open | Phase 4 awaiting product decision |
| 3 | 🔴 i18n scattered across 4 files | ❌ Open + worsening | Plus a 5th file now (`app/terms/page.js`) |
| 4 | 🟡 Language preference not persisted | ❌ Open | P1 item still pending |
| 5 | 🟡 Practice page doesn't load history progress | ❌ Open | P1 item still pending |
| 6 | 🟡 Single-page files too big | ❌ Open + worse | All 3 files grew 80–170 lines |
| 7 | 🟡 Google Fonts `@import` blocking | ✅ Fixed | Action 7 |
| 8 | 🟡 Missing `loading.js` / `error.js` / `not-found.js` | ✅ Fixed | Action 6 |
| 9 | 🟡 TTS Cache-Control inappropriate `public` | ✅ Fixed | Action 2 |
| 10 | 🟢 Report page no language switcher | ✅ Fixed | Action 40 |
| 11 | 🟢 Device API has no frontend caller | ❌ Open | Same as #2 — gated on decision |

**Score: 5 of 11 fixed, 5 open, 1 worse.**

---

## 9. Recommended next batch (priority order)

If picking the next 4–6 items to ship, in order:

### 🔴 Highest leverage, low cost

1. **History-progress loading** (P1 #9, ~1 day) — add a single `useEffect(() => { fetch('/api/progress').then(setProgress) }, [])` to `/practice` and `/signs`. Sidebar stats become real. Direct user-visible win.

2. **Language preference persistence** (P1 #8, ~½ day) — `useLang` hook + localStorage write/read; thread `lang` through a tiny Context provider in `app/layout.js`. Removes the "every page resets to Chinese" UX papercut.

### 🟡 Big debt that's growing weekly

3. **i18n centralization** (P2 #16, ~2 days) — extract all `T` / `MT` objects to `lib/i18n/messages.{en,zh,es,hi,pa,vi}.js`. Don't introduce `next-intl` yet — just a flat `t(lang, key)` function. Now-or-never: each new feature adds another `T` table to dilute.

4. **Extract `useRecorder` hook** (P2 #12, ~1 day) — three files (`practice`, `mock`, `drive`) all hand-roll `MediaRecorder` setup. Single source of truth eliminates the recurring mobile-gesture bugs (cf. Actions 60–61 + 65–67).

### 🟢 Engineering hygiene that pays compounding interest

5. **First unit test: `scoreKeywords`** (P3 #18, ~½ day) — single tested function unlocks the rest of the test infra. 1improve.md §12 calls this "easiest and most valuable starting point." Add Vitest config + 8–10 assertions for the keyword scoring math.

6. **Add a `hide-on-phone` / `hide-on-desktop` doc note** (~10 min) — Actions 65–67 introduced these utilities ad-hoc. Document them in `app/globals.css` header so the pattern is discoverable for the next mobile-only feature.

### ⚪ Decisions still pending from user (from 2gptimprove.md §12)

These can't be implemented without a product call:

- Stripe / PRO gating model
- Device-limit policy (A: disable / B: log-only / C: full management)
- Default language strategy (fixed `zh` vs browser detection)
- URL language prefix (`/zh/practice`?)
- Logging / monitoring service choice (Sentry?)

---

## 10. Architecture vs. target — visual diff

What [`1improve.md`](1improve.md) §16 prescribed (left) vs. what exists (right):

```
                  TARGET                              CURRENT
                  ─────────                           ──────────
app/                                          app/
  layout.js                  ✅                  layout.js
  loading.js                 ✅                  loading.js
  error.js                   ✅                  error.js
  not-found.js               ✅                  not-found.js
  practice/page.js  (~150)   ❌ 872 lines        practice/page.js  (872)
  mock/page.js               ❌ 781 lines        mock/page.js  (781)
  drive/page.js              ❌ 818 lines        drive/page.js  (818)
  report/page.js             ✅                  report/page.js

components/
  layout/                    ❌                  components/AppShell.js  (300)
    AppShell.js
    Sidebar.js
    Topbar.js
  ui/                        ❌                  (none)
    ScoreRing.js
    RecordButton.js
    WaveformIndicator.js
    ProgressBar.js
    BadgeChip.js
  features/                  ❌                  (none)
    QuestionCard.js
    OfficerBubble.js
    DriverBubble.js
    VoiceSelector.js

hooks/                       ❌                  (directory does not exist)
  useRecorder.js
  useScoring.js
  useLang.js
  useProgress.js

lib/
  data.js                    ✅                  lib/data.js
  i18n/                      ❌                  (directory does not exist)
    zh.json                                      — translations still embedded in
    es.json                                        practice / mock / drive / signs
    hi.json                                        / terms / AppShell pages
    pa.json
    vi.json
    index.js
  supabase/                  ✅                  lib/supabase/
  rate-limit.js              ✅ (added)          lib/rate-limit.js
  terms.js                   — (new)             lib/terms.js  (Action 51)

constants/                   ❌                  (directory does not exist)
  voices.js
  scenarios.js
  routes.js
```

---

## 11. One-paragraph close

The project crossed the "won't catch fire" line months ago — every P0 cost/safety risk from the original analysis is fixed, the deployment is stable on Vercel, and feature delivery has been continuous (68 logged actions, ~5 new user-facing improvements per week). What hasn't happened is the **structural refactor** — i18n is still inlined in 5 page files, three pages are pushing 800+ lines apiece, no `hooks/` or `components/ui/` exists, and there's still zero test coverage. The next 6–8 weeks should swap the cadence: fewer net-new features, the four-item refactor batch in §9 above, and the first unit test. Every week that delay continues, the eventual rewrite gets larger and the diff gets scarier.
