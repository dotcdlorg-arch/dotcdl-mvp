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


