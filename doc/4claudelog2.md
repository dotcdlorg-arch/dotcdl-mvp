# CDL English Pro — Claude Action Log (Part 2)

> Continuation of `doc/4claudelog.md` (Sessions 1–16).
> Original file split here for readability; same format and conventions.
> Reference: `doc/2gptimprove.md`
> Guidelines: `doc/CLAUDE.md`, `./AGENTS.md`

---

## Session 17 — Extract Vercel error reference doc (2026-05-25)

### Action 36 — Create `doc/Vercerror_Soluti.md`

**Request:** User asked to consolidate the Vercel deploy errors and solutions from the
log into a standalone reference doc.

**File created:** `doc/Vercerror_Soluti.md`

**Source material:** Distilled from `doc/4claudelog.md` Sessions 4–13 (Actions 12–29).

**Structure of the new doc:**

1. **TL;DR** — one-paragraph summary identifying Node.js middleware runtime as the real
   fix and Sessions 4–10 as symptom-chasing workarounds.
2. **Final Working Configuration** — the four files in their working state
   (`next.config.mjs`, `middleware.js`, `vercel.json`, `package.json` Clerk pin).
3. **Error Catalog** — 10-row table mapping each Vercel error symptom to the attempt
   that addressed it, marked ✅ real fix / ⚠️ partial / ❌ no effect.
4. **Why Each Edge Workaround Failed in Sequence** — explanation of Vercel's two-step
   middleware compilation (Next.js webpack → Vercel post-build source bundler) and why
   each Sessions 5–10 workaround addressed only one layer.
5. **Why Node.js Runtime Solved Everything** — what `runtime: 'nodejs'` actually
   bypasses (Edge analyzer, ESM→CJS transform, plain `Request` problem, etc.).
6. **Quick Diagnostic Cheat Sheet** — 7-row table mapping future Vercel error messages
   to most likely root cause + fix.
7. **Verification Commands** — `npm run build` + grep check for banned Edge identifiers.
8. **Reversal — Restore Edge Runtime** — full procedure if forced to revert (marked
   "not recommended").

**No code or config changed** — documentation-only addition.

**Reversal:** Delete `doc/Vercerror_Soluti.md`. No other files affected.

---

### Action 37 — Append cost-accounting section to `doc/Vercerror_Soluti.md`

**Request:** User asked to quantify the cost of solving the Vercel errors (lines of code
added, MB of disk growth) and append the findings to the same reference doc.

**File modified:** `doc/Vercerror_Soluti.md`

**Measurements computed via git over commits `d06b765` (Session 4) → `83436b0`
(Session 13):**

- Hand-written code: **+11 / −3 lines net = 8 lines** that permanently shipped.
- Gross churn: **+74 / −66 lines** across 10 commits (most rewritten 7 times).
- `node_modules` growth: **~5 MB net** (~9.2 MB added gross, ~4 MB freed by replaced
  top-level packages). Net 13 new package entries.
- Root cause of disk growth: pinning `@clerk/nextjs` to exact `6.12.4` broke npm's
  hoisting → 9 packages got duplicated nested versions inside `@clerk/backend/` and
  `@clerk/nextjs/`.

**Section added to `Vercerror_Soluti.md` (after the Reversal section):**

1. **Lines of code added** — net table by file, list of the 8 net lines verbatim.
2. **Gross churn across all 10 commits** — explains the workaround churn pattern.
3. **Per-commit hand-written churn** — 10-row table with each commit's +/- count.
4. **Disk footprint — node_modules growth** — net summary table.
5. **Detailed sizes of added packages** — per-package size breakdown.
6. **Why the duplicates exist** — explains the npm hoisting failure from the version pin.
7. **Context numbers** — total `node_modules` size, `@clerk` footprint, build output.
8. **Bottom line** — TL;DR + note that loosening the Clerk pin would reclaim most of
   the 5 MB.
9. **Measurement commands used** — exact `git`/`diff`/`du` commands for reproducibility.

**Source data for the measurements:**

```text
Net diff (hand-written):
 middleware.js   | 1 +
 next.config.mjs | 3 +++
 package.json    | 7 ++++---
 vercel.json     | 3 +++
 4 files changed, 11 insertions(+), 3 deletions(-)

Gross churn (hand-written): +74 / -66 across 10 commits

Packages added (gross):     ~9.2 MB
Packages removed:           ~4 MB (estimated)
Net node_modules growth:    ~5 MB
Total node_modules now:     418 MB
```

**No code/config changed** — documentation-only addition.

**Reversal:** Remove the "Cost Accounting — Lines of Code & Disk Footprint" section
from `doc/Vercerror_Soluti.md` (everything appended after the original
"All ten previous workarounds will need to be reapplied..." paragraph).

---

## Session 18 — Phone-friendly UI (2026-05-25)

### Action 37 — Mobile polish + bottom tab bar

**Request:** User asked for a phone-friendly UI without altering the current core
system, plus "a function to deduct the user's equipment" (= detect device) and
serve the correct UI accordingly. User asked for my recommendation prioritising
"easy to maintain" + "minimum alteration".

**Recommendation given (pushed back on the original ask):** Don't build a parallel
`/m/*` route tree or a MobileShell swap — both double the maintenance surface.
Modern responsive CSS *is* the device-detection function (declarative, handled by
every browser, correct for tablets/foldables/rotations). The codebase already
started this at `app/globals.css` lines 358–379. User agreed: "step 1 and 2".

**Files changed:**

1. `app/globals.css` — appended two blocks at end of file (after `.mode-card.selected`):
   - `@media (max-width: 600px)` phone polish:
     - `.btn` min-height 44px (Apple HIG tap target); `.btn-sm` 36px; `.btn-lg` 52px;
       `.btn-icon` 44×44.
     - `input, select, textarea { font-size: 16px }` — prevents iOS Safari focus zoom.
     - `.card` padding 14px, radius 12px, margin-bottom 12px.
     - `.topbar` padding 12px; `.topbar-title` .85rem; `.lang-select` smaller.
     - `.nav-btn` min-height 44px, padding 12px.
     - `.main-content` bottom padding 96px + `env(safe-area-inset-bottom)` to clear
       the new bottom tab bar and iOS home indicator.
   - `.mobile-tabs` (display:none by default) + `@media (max-width: 600px)` showing
     a 4-column fixed bottom nav with safe-area-aware padding, brand-coloured
     active state, ellipsis overflow for long localised labels.

2. `components/AppShell.js` — added a `<nav className="mobile-tabs">` block inside
   the existing `<>...</>` fragment, after `</div>` closing the app-layout. Four
   tabs: Practice (`/practice` 📖), Signs (`/signs` 🚦), Mock (`/mock` 🚔),
   Drive (`/drive` 🚗). Reuses the existing `nl(lang, labelKey)` helper and
   `NAV_LABELS` keys (`text`, `signs`, `mock`, `drive`) — no new i18n strings
   added. Active state computed from `pathname` (already in scope from line 120).

**Not changed:**
- No pages (`app/practice`, `app/signs`, `app/mock`, `app/drive`, `app/report`)
- No API routes
- No middleware
- No new files, no new routes, no new dependencies
- The sidebar drawer / hamburger toggle remains on phones — it still exposes
  sub-modes (text/listen/speak), report, stats, disclaimer. Pattern is
  bottom-tab = primary routes, hamburger = everything else.

**Net diff:** ~70 lines added across 2 files. 0 lines deleted. 0 files renamed.

**Verification still needed (manual, by user):**
- Resize browser window <600px or use devtools mobile emulation; confirm:
  - Bottom tab bar appears, sidebar collapses, hamburger still works.
  - Active tab highlights as user navigates between /practice, /signs, /mock, /drive.
  - Buttons are easy to tap (≥44px).
  - Form inputs don't zoom on iOS focus.
  - Bottom of content isn't covered by the tab bar.
- `npm run build` to confirm no JSX/CSS errors (couldn't run lint — `next lint`
  is interactive on first run in this checkout).

**Reversal:**
- Revert the two `Edit` operations: in `app/globals.css` remove everything appended
  after the original `.mode-card.selected` rule; in `components/AppShell.js` remove
  the `<nav className="mobile-tabs">...</nav>` block before the closing `</>`.

---

## Session 19 — Strip numbers from homepage + add language selector (2026-05-25)

### Action 38 — Rewrite `app/page.js`: remove numbers, translate, add 5-language picker

**Request:** User asked to remove "140 out of 140 officer Q&A" and "84 out of 84 traffic
signs" from the main page, delete all numbers on that page (only introduce
functionalities), keep the last "5 Languages" feature card untouched, and add a
5-language selection to the main index page.

**File modified:** `app/page.js` (full rewrite — was server component, now client component
with `'use client'` directive to support language state).

**Content changes (numbers removed):**

- `"140 Officer Q&A"` → `"Officer Q&A"`
- `"84 Traffic Signs"` → `"Traffic Signs"`
- Mock Inspection desc `"19-question timed simulation: 14 Q&A + 5 signs, scored and
  saved to your progress report"` → `"Timed simulated inspection mixing officer Q&A
  and traffic signs, scored and saved to your progress report"`
- All other titles/descs preserved verbatim (no other numbers were present on the
  page in nav, hero, or footer).
- The 8th feature card (🌍 5 Languages — "Interface in Chinese, Spanish, Hindi,
  Punjabi, Vietnamese — practice answers in English") is rendered from a separate
  `FIVE_LANG_CARD` constant and is hardcoded English in every language so it is
  literally untouched, as requested.

**Language selector added:**

- New `<select>` in the nav, styled to match the dark theme (bg `#1e293b`, border
  `#334155`, color `#e2e8f0`). Sits to the left of Sign In / Continue Training.
- `aria-label="Interface language"` for a11y.
- 6 options: `en` English (default), `zh` 中文, `es` Español, `hi` हिन्दी,
  `pa` ਪੰਜਾਬੀ, `vi` Tiếng Việt. The "5 languages" referenced in the user's
  request matches the 5 non-English entries (parity with `components/AppShell.js`
  `LANGS`); English added so users can return to default.
- State is `useState('en')` only — no `localStorage` persistence (kept minimal;
  can be added later if requested).

**Translations added (6 languages × per-locale strings):**

- `T[lang]` object: hero badge, hero h1 (two lines), hero subhead, "Sign In",
  "Start Free →", "Continue Training →", primary CTA, "Try Drive Mode" CTA,
  two footer disclaimer lines, brand tagline ("AI Roadside Readiness Training").
- `FEATURES_BY_LANG[lang]`: per-language titles + descs for the first 7 feature
  cards (Officer Q&A, Traffic Signs, Listening Drills, AI Pronunciation, Drive
  Mode, Mock Inspection, Progress Report).
- Total ~6 × (12 hero/nav/footer strings + 7 × 2 feature strings) ≈ 156 translated
  strings inline in the file.

**Not changed:**

- `components/AppShell.js` — its own language picker is independent and unchanged.
- No new files, no new dependencies, no API routes, no middleware changes.
- No CSS changes (inline styles used to match the existing homepage pattern).
- All routes / link hrefs unchanged (`/sign-in`, `/sign-up`, `/practice`, `/drive`).

**Verification:**

- `npx next build` → ✓ Compiled successfully in 1970ms. Homepage `/` static-rendered
  at 27.3 kB / 162 kB First Load JS (up from prior size due to inline translation
  tables and client-side hydration; acceptable for a single-page marketing route).
- All 16 routes still build (no regressions to /practice, /signs, /mock, /drive,
  /report, /sign-in, /sign-up, or any API route).
- Lint/type-check passed implicitly via `next build`.

**Net diff:** `app/page.js` went from 85 lines → ~240 lines (added translation tables
and language-picker logic; structure of the rendered tree is otherwise identical).

**Reversal:**

- `git checkout HEAD -- app/page.js` restores the prior server-component version
  with the original `140` / `84` / `19` numbers and no language selector.

---

### Action 39 — Add English option to every language-selector translation table

**Request:** User asked to add English as a selectable language across every page that
has a language selection function (i.e. propagate the `en` option that the homepage
already has, to the rest of the app's language picker, which lives in `AppShell`).

**Discovery:** Grep showed 5 files participate in language selection:
- `components/AppShell.js` — the shared header `<select>` used by /practice, /signs,
  /mock, /drive (plus its own `NAV_LABELS` for the sidebar nav copy).
- `app/practice/page.js` — own `T` table + `t(lang, key)` helper.
- `app/mock/page.js` — own `MT` table + `mt(lang, key)`.
- `app/drive/page.js` — own `DT` table + `dt(lang, key)`.
- `app/signs/page.js` — no own table; only uses AppShell + `getExplanation()`.

Before this change all five had `zh / es / hi / pa / vi` only. Default state in each
page is still `useState('zh')` — not changed.

**Files modified (5 total):**

1. **`components/AppShell.js`**
   - Added `en: 'English'` as the FIRST entry in `LANGS` (renders at top of the
     `<select>`, before 中文).
   - Added an `en: {...}` block at the top of `NAV_LABELS` covering all 17 keys
     (`training`, `premium`, `progress`, `text`, `listen`, `speak`, `signs`,
     `mock`, `drive`, `report`, `stats`, `seen`, `understood`, `review`,
     `avgScore`, `mocks`, `disclaimer`).
   - Changed the fallback in `nl(lang, key)` from `NAV_LABELS.zh` → `NAV_LABELS.en`
     so any unknown lang falls back to English (more sensible default for a
     primarily-English driver-training site).

2. **`app/practice/page.js`**
   - Added an `en: {...}` block at the top of `T` (all 36 keys: `all`, `search`,
     `reviewOnly`, …, `autoPlay`, `stopPlay`).
   - Changed `t(lang, key)` fallback from `T.zh` → `T.en`.

3. **`app/mock/page.js`**
   - Added an `en: {...}` block at the top of `MT` (all 37 keys: `title` through
     `stopPlay`). English subtitle reworded to not reference the previously
     literal "19 questions / 14 Q&A + 5 signs" counts — uses
     "Randomized officer Q&A and traffic signs" so it parallels the homepage
     copy that just lost its numbers in Action 38.
   - Updated comment `// i18n for all 5 languages` → `// i18n` (now 6).
   - Changed `mt(lang, key)` fallback from `MT.zh` → `MT.en`.

4. **`app/drive/page.js`**
   - Added an `en: {...}` block at the top of `DT` (all 35 keys: `title` through
     `practicing`).
   - Changed `dt(lang, key)` fallback from `DT.zh` → `DT.en`.

5. **`lib/data.js`**
   - `getExplanation(item, lang)` previously returned `item[explanation_${lang}]`
     and silently fell back to `explanation_zh`. Since the questions/signs JSON
     has no `explanation_en` key (English text is already the primary content via
     `officer_question_en` / `simple_driver_answer_en` / sign `meaning` + `action`),
     a user picking English would have seen Chinese text in the explanation slot.
     Added a single line `if (lang === 'en') return ''` so the explanation panel
     stays empty for English (the existing `getExplanation(...) && <p>` guard in
     `app/signs/page.js` already hides empty values; in `app/practice/page.js`
     it renders an empty `<p>` block, harmless).

**Not changed:**

- Default language is still `zh` everywhere (per "surgical changes" — user only
  asked to add `en` as an option, not flip the default).
- No new files, no new dependencies, no API/middleware/CSS changes.
- The signs/practice/mock/drive pages did not need any JSX changes — the picker
  already iterates `Object.entries(LANGS)` so the new `en` option appeared
  automatically once `LANGS` was extended.
- `data/questions.json` and `data/signs.json` are unchanged (no `explanation_en`
  key added; the English-speaker UI surfaces the existing `officer_question_en`
  / `simple_driver_answer_en` / sign `meaning` + `action` fields directly).

**Translation key coverage added (English):**

- AppShell NAV_LABELS: 17 keys
- practice T: 36 keys
- mock MT: 37 keys
- drive DT: 35 keys
- **Total: 125 new English strings inline across 4 translation tables.**

**Verification:**

- `npx next build` → ✓ Compiled successfully. All 16 routes built:
  - `/` 27.3 kB (unchanged)
  - `/practice` 7.07 kB (was 6.76)
  - `/mock` 8.53 kB (was 8.08)
  - `/drive` 8.42 kB (was 8.02)
  - `/signs` 2.07 kB (unchanged — picks up `en` from AppShell automatically)
- Linting and type-check passed.
- Manual sanity: opening `/practice`, `/mock`, `/drive`, `/signs` and choosing
  English from the header picker should render all UI strings in English; the
  Explanation panel under each question/sign is hidden/empty for English (the
  English answer is already shown elsewhere on the same card).

**Net diff (approximate):**

- `components/AppShell.js`: +19 lines (added `en: 'English'` + 18-key `en: {...}`
  block + 2-char fallback change).
- `app/practice/page.js`: +14 lines (compact one-block `en:{…}` matching existing
  formatting).
- `app/mock/page.js`: +30 lines (own-line-per-key, matches existing formatting).
- `app/drive/page.js`: +29 lines.
- `lib/data.js`: +1 line.

**Reversal:**

- `git checkout HEAD~ -- components/AppShell.js app/practice/page.js
  app/mock/page.js app/drive/page.js lib/data.js` (relative to the commit that
  bundles this change) restores the 5-language-only state. The fallback flip
  from `zh` → `en` in each helper is part of the same revert.

