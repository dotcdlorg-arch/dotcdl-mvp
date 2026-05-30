# 4claudelog8.md

Continuation of `doc/4claudelog7.md` (split per CLAUDE.md rule when prior file > 800 lines).

---

## 2026-05-28 — `simplify` self-audit on PR1 + PR2 (post-build)

### Trigger

User: "follow doc/32cimplanexec.md to proceed the rest of part implementation and utilize required skills."

Plan §1 timetable: after both PRs land, run `simplify` skill across the day's changes (§4 lists `simplify` 5★). Both PRs already coded + green-build before this audit.

### Method

Combined PR1+PR2 diff written to `/tmp/pr_diff.patch` (378 lines including the two new files). Launched 3 review agents in parallel:

1. **Code reuse** — search for existing utilities the new code duplicates.
2. **Code quality** — redundant state, parameter sprawl, copy-paste, leaky abstractions, stringly-typed, useless comments.
3. **Efficiency** — re-render storms, hot-path bloat, no-op updates, memory leaks.

### Aggregated findings + decisions

| # | Finding | Severity | Decision |
|---|---|---|---|
| 1 | `hooks/useProgress.js` returned BOTH `markQuestion` AND `markSign` regardless of `type` — sign page could call `markQuestion`, corrupting state | HIGH | **FIX** — return only the relevant marker (XOR by type). Deviates from plan §2.1 spec but plan was wrong; documented. |
| 2 | POST `console.warn`s on 401 even though GET silently no-ops on 401 — anonymous user clicks leak warnings | HIGH | **FIX** — POST checks `r.status !== 401` before warning. |
| 3 | `loading` flag + 800ms fallback timer are dead code — no caller destructures them | MED | **FIX** — remove. Plan §2.3 step 5 mentioned them for zero-flicker but I'd deferred that already; the return field was an unused promise. |
| 4 | `lib/lang-context.js` redefined `ALLOWED = ['en','zh',...]` — duplicates `LANGS` already exported from `components/AppShell.js` | MED | **FIX** — import `LANGS` from AppShell, validate with `saved in LANGS`. |
| 5 | `<LangContext.Provider value={{ lang, setLang }}>` allocates a new object every Provider render; `setLang` was an inline function recreated every render | LOW | **FIX** — `useCallback` on `setLang`, `useMemo` on the value. Cheap insurance against future consumers that depend on identity. |
| 6 | WHAT-comment header on `useProgress.js` narrated the API | LOW | **FIX** — trimmed to the one non-obvious invariant (401 silent on both paths). |
| 7 | Parameter sprawl: `useProgress({ type })` object wrapper | STYLE | **SKIP** — plan §2.1 spec is `useProgress({ type })`. Don't deviate on cosmetics. |
| 8 | Split into two hooks (`useQuestionProgress` / `useSignProgress`) | STYLE | **SKIP** — plan spec is one hook. Issue #1 fix already eliminates the leak risk that motivated this. |
| 9 | Stringly-typed `'sign'` / `'question'` constants | STYLE | **SKIP** — plan-spec literals. |
| 10 | `markStatus = markQuestion` alias in practice page | NONE | **SKIP** — one-line, preserves 14+ call sites without rename. Harmless. |
| 11 | Merge-guard allocates a full clone on hydration | NONE | **SKIP** — runs once per mount. Negligible. |

### Files changed by the audit

- `hooks/useProgress.js` — rewrote (104 → ~95 lines)
  - Removed `loading` state + `setLoading` + 800ms `setTimeout` + `.finally` clear logic
  - Now returns `type === 'sign' ? { progress, stats, markSign } : { progress, stats, markQuestion }`
  - Both POST paths: `.then(r => if !r.ok && r.status !== 401 console.warn)` — 401 silent
  - Header comment trimmed to one paragraph explaining the 401 invariant only
- `lib/lang-context.js` — rewrote (35 → ~38 lines)
  - Replaced `ALLOWED` const with `import { LANGS } from '@/components/AppShell'`; check `saved in LANGS`
  - Added `useCallback` on `setLang` (deps `[]` — never changes)
  - Added `useMemo` on context value, deps `[lang, setLang]`

### Build verification

- `npm run build` after audit: ✓ Compiled in 1514ms-ish, 18/18 pages, no warnings.
- Bundle: `/practice` 8.77 → 8.76 kB (−0.01), `/signs` 3.30 → 3.27 kB (−0.03). Dead-code removal accounts for the tiny shrink.

### Notes for future PRs

- If a later PR (P1 #10 toast) needs a "loading skeleton" on stats, re-add `loading` to hook return at that time. Current return is forward-compatible.
- The `LANGS` import from `@/components/AppShell` couples lib/ to components/. If you'd rather have lib/ as the source of truth, move `LANGS` to `lib/data.js` (already exports vocab) or a new `lib/langs.js`. Not done now to keep this PR surgical.

---

## 2026-05-28 — `verify` skill: browser-driven runtime acceptance (PR1 + PR2)

### Trigger

User same request; plan §1 timetable + §2.5 + §3.5 acceptance lists.

### Method

- Cold start (no `.claude/skills/verifier-*` exists, no `run` skill match for this app).
- Installed Playwright 1.60 + Chromium headless shell (~92 MiB, one-time, into `~/Library/Caches/ms-playwright/`).
- Started dev server: `npm run dev` → `http://localhost:3000` (Next.js 15.5.18).
- Drove via Node Playwright script at `/tmp/verify_cdl/verify.mjs`.
- Captured screenshots to `/tmp/verify_cdl/*.png`.

### Surface map

| Route | Protection | Verifiable anonymously? |
|---|---|---|
| `/practice` | `auth.protect()` middleware | ❌ 307 → `/sign-in` (hook never mounts) |
| `/signs` | `auth.protect()` | ❌ 307 → `/sign-in` |
| `/mock`, `/drive`, `/report` | `auth.protect()` | ❌ same |
| `/api/progress` (GET) | `auth.protect()` | ❌ 307 — even at the API level |
| `/terms` | public | ✅ uses `LanguageProvider` + `useLang()` |
| `/` (landing) | public | ✅ NOT migrated (per user); has own state |

PR1 surface (`useProgress` hook) cannot be exercised anonymously — the Clerk middleware redirects before the React tree renders. Full PR1 acceptance per §2.5 requires an authenticated browser session (real user account). Documented as deferred below.

### Steps run

```
✅ PR1 surface: anon /practice redirects to sign-in (hook deferred to auth)
   → final=http://localhost:3000/sign-in?redirect_url=...practice
✅ PR2: /terms exposes a language select       → selects=1
✅ PR2: /terms initial value is "zh"            → value="zh" (provider SSR default)
✅ PR2: selecting Español writes localStorage   → cdl-lang="es"
✅ PR2: after reload /terms still shows es      → value="es"
✅ PR2: no hydration mismatch on /terms         → clean
✅ PR2: landing kept on its own state           → landing select value="en" (isolated)
✅ PR2: no hydration mismatch on /              → clean
🔍 probe: invalid stored "xx" → default zh      → value="zh"  (allowlist guard works)
🔍 probe: missing cdl-lang → default zh         → value="zh"
🔍 probe: rapid switching stores final pick     → final="en"
✅ no relevant console errors during the run    → none
```

### Evidence

Screenshot: `/tmp/verify_cdl/01_terms_es.png` — `/terms` rendered in Spanish AFTER reload:
- Top-right language dropdown shows "Español"
- Sidebar fully translated: Escucha, Habla + Puntuación AI, Señales de tráfico, Inspección simulada, Términos, Modo conducción, Informe de progreso
- Page heading: "Términos de camiones / Vocabulario de inspección en 6 idiomas con ejemplos reales de conversación"
- Term cards: "dispositivo de registro electrónico (ELD)", "registro en papel"

This is end-to-end evidence that `LanguageProvider` + `localStorage` hydrate path works through SSR → useEffect → React state → AppShell + page consumers.

### Findings

- ⚠️ **PR1 acceptance not exercisable headlessly.** The 5 of 6 acceptance items in plan §2.5 ("登录 → /practice → 答 3 题 → 标 2 个 'understood' → 硬刷新 → 侧边栏显示 seen=3 / understood=2") all require a Clerk session. Build is clean and code analysis is clean; runtime correctness for the GET-on-mount hydration must be checked by the user in a real authenticated browser session. Suggest a 2-minute manual pass: log in → /practice → answer 1 question → mark "understood" → hard refresh → confirm sidebar shows seen=1, understood=1.
- 🔍 The "invalid stored language" probe (set `cdl-lang=xx` in localStorage, reload) cleanly falls back to default `zh`. The allowlist guard via `in LANGS` (post-simplify fix) is wired correctly.
- 🔍 Rapid lang switching (vi→hi→pa→en in <300ms) settles on the final pick in localStorage. No racy partial write.
- 🔍 Landing page (`/`) intentionally NOT migrated: while `cdl-lang="es"` lives in localStorage, landing's select still shows "en" — confirms the user's "skip landing" decision is in effect.
- ⚠️ The pages with `useState('zh')` historically would persist `'zh'` as the default. Provider default is now also `'zh'`, but the first-paint experience for first-time users is unchanged (SSR renders 'zh' until useEffect hydrates). No regression.
- Note: Next.js dev server keeps an HMR EventSource open, so Playwright's `networkidle` never fires. Used `domcontentloaded` + `waitForTimeout(1500)` instead. Documented in the verify script.

### Verdict

**PR2 — PASS (browser-verified).**
**PR1 — PASS (build + static analysis; runtime acceptance deferred to authenticated session — user action needed).**

### Files written / consumed

- `/tmp/verify_cdl/verify.mjs` — Playwright script (not committed; throwaway)
- `/tmp/verify_cdl/01_terms_es.png` — evidence screenshot (not committed)
- `/tmp/verify_cdl/02_landing.png` — landing screenshot
- `/tmp/verify_cdl/results.txt` — text summary

### Suggested next user action

```
# Manual auth-gated PR1 acceptance (5 minutes):
# 1. Start dev: npm run dev
# 2. Sign in via /sign-in (or use a known test account)
# 3. /practice → answer 2 questions → mark one "understood", one "needs review"
# 4. Hard refresh (Cmd-Shift-R) → confirm sidebar shows seen=2, understood=1, review=1
# 5. /signs → score 1 sign → refresh → confirm seen=1
# 6. DevTools Network → filter `progress` → confirm exactly 1 GET per page load
```

---

## 2026-05-28 — Final commit plan

Per plan §9 + CLAUDE.md "After finish any action, provide proper github command":

```bash
# PR1 — useProgress hook (includes the simplify-pass fixes)
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"

# PR2 — language persistence (includes the simplify-pass fixes)
git add lib/lang-context.js app/layout.js \
        app/practice/page.js app/signs/page.js \
        app/mock/page.js app/drive/page.js app/terms/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"

# Plan + log entries
git add doc/32cimplanexec.md doc/4claudelog7.md doc/4claudelog8.md
git commit -m "doc: log first-stage PR1/PR2 implementation + simplify/verify audit"

# DO NOT push without explicit user OK
# git push origin main
```

⚠️ practice/signs appear in BOTH PR1 and PR2 commit sets because each PR touches distinct hunks of those files. Either use `git add -p` to split hunks, or accept the double-commit (clean separation by commit message, hunks don't overlap).

⚠️ Per CLAUDE.md / AGENTS.md: do not `git push` without explicit user confirmation.

---

## 2026-05-28 — PR3: Toast + InlineAlert (P1 #10)

### Trigger

User: "refer to doc/32cimplanexec.md and compare with doc/2implan.md, proceed next part of implementation with doc/2implan.md. load required skills as needed."

Comparison: 32cimplanexec.md (first-stage doc) covered only PR1 + PR2. 2implan.md §9.1 lists **PR3 = #10 (toast + InlineAlert)** as next, 🟢 low risk, ~1 day. Must precede PR5 (`useRecorder`) so the recorder hook surfaces errors via toast.

Plan source: [`doc/2implan.md`](2implan.md) §3 (P1 #10).

### Skill usage

Same set as PR1/PR2: `simplify` + `verify`. No new third-party skills. No new npm dependencies (per plan §3 "Don't introduce next-intl"). Hardcoded English messages — i18n keys deferred to PR4 (#16).

### What changed

**New file: `lib/toast-context.js`** (~45 lines, `'use client'`)
- `ToastProvider`: `toasts: [{id, msg, type}]` array, queue with monotonic id.
- `showToast(msg, type)`: dedupes identical messages within 2s window, prunes stale dedupe entries to prevent unbounded Map growth (simplify-pass fix), pushes, schedules 4s auto-dismiss.
- `dismiss(id)`: clears the toast's timer AND filters it out (simplify-pass fix — was previously leaking the timer on manual click-dismiss).
- `useToast()`: throws if outside provider (fail-fast).
- Memoized context value via `useMemo`, `useCallback` on `showToast`/`dismiss` for stable identity (so consumers depending on `[showToast]` don't churn).

**New file: `components/Toast.js`** (~25 lines)
- Renders the stack. `<div role="alert">` for error/warn, `<div role="status">` for info/success.
- ARIA fix (simplify-pass): switched from `<button role="alert">` (button semantics conflict with alert role; screen-reader affordance broken) to `<div role={...}> + tabIndex={0} + onClick + onKeyDown` (Enter/Space dismisses). Dropped `aria-live="polite"` from container — was contradicting `role="alert"` on children.

**New file: `components/InlineAlert.js`** (~10 lines)
- Stateless. `<div className="inline-alert inline-alert-{type}" role="alert">{children}</div>`.

**Modified: `app/globals.css`** (+46 lines)
- `.toast-stack` (fixed top-right desktop, top-stretch with `env(safe-area-inset-top)` on phone, `z-index: 9999`).
- `.toast` (variants `.toast-error/-success/-warn` mapping to `var(--red/--green/--amber)` + dark-mode auto-inherited).
- `.inline-alert` (uses `--rbg`/`--rbd` for low-vis red bg; `-warn` + `-success` variants on `--abg`/`--abd` and `--gbg`/`--gbd`).
- `@keyframes toast-in` 200ms.

**Modified: `app/layout.js`**
- Nested `<ToastProvider>` inside `<LanguageProvider>`.
- Mounted `<Toast />` after `{children}` (z-index governs stacking; DOM order is irrelevant).

**Modified: `app/practice/page.js`**
- Replaced 2 `alert()` calls with `showToast(msg, 'error') + setMicError(msg)`.
- Added `micError` state, cleared at start of each `startRecording` retry attempt.
- `<InlineAlert type="error">{micError}</InlineAlert>` rendered next to record button when `micError` is set — persists after the toast auto-dismisses, so the user can still see why the mic isn't working.

**Modified: `app/mock/page.js`** + **`app/drive/page.js`** + **`hooks/useProgress.js`**
- Silent `.catch(() => {})` upgraded to `.then(check 401) + .catch(showToast warn)`.
- 401 stays silent on all paths (anonymous flow preserved).
- `useProgress`'s `markQuestion` / `markSign` `useCallback` deps now include `showToast`. `showToast` is stable thanks to `useCallback([dismiss])` in provider, so no thrashing.

### Simplify-pass findings (PR3 self-audit)

| # | Finding | Severity | Decision |
|---|---|---|---|
| 1 | `<button role="alert">` ARIA clash + redundant `aria-live="polite"` on the stack | HIGH | **FIX** — switched to `<div role=...> tabIndex/onClick/onKeyDown` |
| 2 | Click-dismiss leaves a 4s orphan `setTimeout` | MED | **FIX** — `timers.current` Map + `clearTimeout` on dismiss |
| 3 | `lastSeen` dedupe Map grows unbounded | LOW | **FIX** — prune entries older than `DEDUPE_WINDOW_MS` inside `showToast` |
| 4 | WHAT-comment header in `toast-context.js` | LOW | **FIX** — removed; the one-line WHY is inline at the dedupe-check |
| 5 | `micError` "lingers after success retry" | — | **SKIP — false positive**. Trace: `setMicError(null)` runs at the top of every retry attempt's try-block; on success, no later call sets micError, so it stays null. |
| 6 | "Could not save progress" string duplicated 4× across files | LOW | **DEFER** — PR4 (#16) i18n centralization handles this cleanly. Lifting to a constants module now would be a one-PR detour. |
| 7 | Context value re-render storm | — | **SKIP** — toast volume tiny (~5/session). Split-context is premature. |
| 8 | Provider boilerplate parity with `LanguageProvider` (createSafeContext helper) | — | **SKIP** — 2 providers below abstraction threshold. |

### Verify-pass: browser-driven runtime acceptance

Started `npm run dev`, drove with Playwright headless Chromium. PR3's mic-error / InlineAlert path is auth-gated (only fires inside `/practice`), so the runtime test covers the public surface + regression checks:

```
✅ PR3 regression: /terms still renders with new ToastProvider in tree
✅ PR3: no hydration mismatch on /terms (provider stack)
✅ PR3: no toast stack rendered when no toasts queued (count=0)
✅ PR3: .toast-stack CSS rule reaches the browser
✅ PR3: auth redirect to /sign-in still works (provider stack does not break middleware)
✅ PR3: landing still renders without hydration warning under provider stack
🔍 probe: no toast on landing (none triggered)
✅ PR2 regression: language persistence still works after PR3 (cdl-lang="es")
✅ PR3: no relevant console errors
```

### Findings

- ⚠️ **PR3's user-facing toast/inline-alert acceptance can only be exercised behind auth.** The 2 `alert()` replacements live inside `/practice`'s `startRecording` (auth-gated); the 3 warn-toast sites are also auth-gated. Suggest a 2-minute manual pass:
  1. Sign in → `/practice` → set Chrome's `Site settings → Microphone → Block` → press record → expect red toast + persistent `<InlineAlert>` next to the record button.
  2. Click the toast — it should dismiss; the InlineAlert stays.
  3. Press record 5 more times in <2s — should still only see 1 fresh toast (dedupe).
  4. In DevTools Network panel: block `/api/progress` (return 500) → mark a question understood → expect 1 warn toast "Could not save progress"; the question still shows as understood locally (optimistic preserved).
- 🔍 The `<Toast />` mounted at root coexists cleanly with Clerk's `auth.protect()` redirect — no provider-stack crash on the protected-route flow.
- 🔍 Bundle deltas: `/practice` 8.76 → 8.88 kB (+0.12), `/signs` 3.27 → 3.31 (+0.04), `/mock` 9.06 → 9.14 (+0.08), `/drive` 8.89 → 8.95 (+0.06). All under the +0.5 kB threshold.
- ⚠️ The `useProgress` hook now requires `ToastProvider` in the tree. Acceptable — `app/layout.js` wraps every route, so this can never be a runtime miss; the throw from `useToast()` would only fire in a developer-error case (e.g. someone importing the hook into a Storybook story without a wrapper).

### Commit graph

```
949648d (HEAD) feat(toast): add Toast + InlineAlert system (P1 #10)
c784762        feat(lang): persist language preference via Context + localStorage (P1 #8)
df55c6c        feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)
3167a48 (main on remote) doc: add data.md content inventory (...)
```

The PR3 commit `949648d` was created by amending the simplify-pass fixes onto the original `c2ff1b6`, mirroring the convention used for PR1+PR2 (each PR's commit = code + its simplify fixes folded together).

### Files changed

- `lib/toast-context.js` — created (~45 lines)
- `components/Toast.js` — created (~25 lines)
- `components/InlineAlert.js` — created (~10 lines)
- `app/globals.css` — +46 lines (toast + inline-alert styles)
- `app/layout.js` — +9 lines (provider nest + Toast mount)
- `app/practice/page.js` — +13 lines (toast/alert imports, micError state, 2 alert→showToast+setMicError, InlineAlert render)
- `app/mock/page.js` — +5 lines (useToast import, showToast on save fail)
- `app/drive/page.js` — +5 lines (useToast import, showToast on POST fail)
- `hooks/useProgress.js` — +6 lines (useToast import, showToast on POST fail, useCallback deps update)

### Suggested commit / push (DO NOT push without your OK)

```bash
# All 3 PRs already committed locally:
#   df55c6c — PR1 progress hook
#   c784762 — PR2 language persistence
#   949648d — PR3 toast + inline alert
#
# To stage the docs and push:
git add doc/2implan.md doc/2improve.md doc/32cimplanexec.md doc/33cimplanexec.md \
        doc/3cimplanexec.md doc/3cimplanexecAns.md doc/4claudelog7.md doc/4claudelog8.md \
        doc/skillsavi.md doc/2Cimplan.md doc/2Cimprove.md
git commit -m "doc: log first-stage PR1/PR2/PR3 execution + simplify/verify audits"

# Then (only with explicit user OK):
# git push origin main
```

⚠️ Per CLAUDE.md / AGENTS.md: do not `git push` without explicit user confirmation.

---

## 2026-05-29 — PR4a: i18n centralization, canary on `practice` (P2 #16, sub-PR 1 of 5)

### Trigger

User: "yes" (start next PR per 2implan.md §9.1 after first three PRs landed).

Plan source: [`doc/2implan.md`](2implan.md) §4 (P2 #16). Sub-PR 4a migrates `practice` as canary; 4b–4e follow (mock, drive, terms, AppShell).

### What changed

**New: `lib/i18n/index.js`** (29 lines after simplify-fix)
- `t(lang, key)` resolver: `dict[lang]?.[key] ?? dict.en[key] ?? key`. Uses `??` (not `||`) so an intentional empty-string translation renders as `''` instead of falling back.
- Dev-only missing-key warning, with per-key `warned` Set so each unknown key only logs the first time.
- Dev-only cross-lang drift check at module-load: scans every non-English file for keys missing relative to English; logs once if any drift. Both dev blocks are `process.env.NODE_ENV !== 'production'`-gated → Next.js dead-code-eliminates them in prod.

**New: `lib/i18n/messages.{en,zh,es,hi,pa,vi}.js`** (37 keys each, 6 files)
- Flat namespaced keys: `'practice.officer': 'Officer question'`, etc.
- Flat chosen over nested (`practice: { officer: '...' }`) for: (a) sub-PRs 4b–4e append additional namespaces with zero merge-conflict risk; (b) `t()` lookup stays O(1).
- All 222 entries (37 × 6) copied verbatim from the old inline `T` table in `practice/page.js`.

**Modified: `app/practice/page.js`**
- Removed the 79-line `T = { en: {...}, zh: {...}, es, hi, pa, vi }` literal.
- Removed the local `function t(lang, key)` resolver.
- Added `import { t } from '@/lib/i18n'`.
- Changed local closure `const tx = (k) => t(lang, k)` → `(k) => t(lang, 'practice.' + k)`. All 43 `tx('foo')` call sites unchanged.

### Simplify audit (one combined agent)

| # | Finding | Action |
|---|---|---|
| 1 | `LANGS` not re-exported from `lib/i18n/` (plan §4 said it should) | **SKIP** — `components/AppShell.js` already exports `LANGS`; lib/lang-context.js imports it. Adding a duplicate from i18n violates "surgical changes." |
| 2 | `??` vs `||` for empty-string keys | **SKIP — already correct** with `??`. |
| 3 | Top-level dev side-effect (drift check) | **SKIP** — standard React-style dev assertion pattern; NODE_ENV-gated. |
| 4 | Unbounded `warned` Set | **SKIP** — bounded by unique-key count (~37 today, ~250 after 4e). Trivial. |
| 5 | Flat vs nested keys | **SKIP** — flat is the deliberate choice for merge-conflict-free sub-PR composition. |
| 6 | `tx` string-concat per render | **SKIP** — sub-microsecond, ~43 calls/render. |
| 7 | Eager import of 6 lang files | **DEFER** — plan §4 says "don't over-engineer dynamic imports until measured." `/practice` grew +0.12 kB; reassess after PR4e. |
| 8 | WHAT-comments in `lib/i18n/index.js` (warned-once Set + drift-check headers) | **FIX** — trimmed; variable names + NODE_ENV guard are self-explanatory. |

Only #8 produced an edit — folded into the same commit.

### Verify (browser-driven, headless Chromium)

PR4a's user-facing surface is `/practice`, which is auth-gated. The i18n bundle is only loaded by `/practice`, so anonymous browser testing can't exercise the resolver itself. What I verified instead:

```
✅ PR4a: /practice still redirects to /sign-in (auth gate intact through new import chain)
✅ PR2/PR3 regression: /terms still renders with provider stack
✅ PR2 regression: language switch + localStorage persistence still works (cdl-lang="es")
✅ PR4a: /signs still redirects (no i18n side-effect on other pages)
✅ PR4a: no relevant console errors on public surface
✅ PR4a: no [i18n] missing-key or drift warnings on public surface (lib not loaded here)
```

### Findings

- ⚠️ **PR4a's full §4 acceptance ("All 6 languages still work on every page") needs an authenticated browser session.** ~2-minute manual pass: log in → `/practice` → flip the dropdown through `en/zh/es/hi/pa/vi` → confirm every visible string changes (officer, answer, all 6 chip labels, score badges, etc.).
- 🔍 Bundle delta: `/practice` 8.88 → 9.0 kB (+0.12 kB). Plan budget allowed +24 kB after all sub-PRs land. Way under.
- 🔍 The dev drift check fires only on `lib/i18n` module load. Currently only `app/practice/page.js` imports it, so the check runs once when /practice mounts in dev. As sub-PRs 4b–4e land, it will catch any key gaps across the 6 lang files at dev time before runtime.
- ⚠️ `mock`, `drive`, `terms`, `AppShell` still hold their inline `MT` / `DT` / `T` / `NAV_LABELS` tables. **§4 verification criterion "grep `const T = {` in app/ returns no results" will only be satisfied at end of PR4e** — by design.
- ⚠️ Plan §4 "bundle size diff < +20 KB" cannot be evaluated until PR4e. Current cumulative budget: PR4a alone is +0.12 kB.

### Files changed

- `lib/i18n/index.js` — created (29 lines after simplify-fix)
- `lib/i18n/messages.en.js` — created (39 lines)
- `lib/i18n/messages.zh.js` — created (39 lines)
- `lib/i18n/messages.es.js` — created (39 lines)
- `lib/i18n/messages.hi.js` — created (39 lines)
- `lib/i18n/messages.pa.js` — created (39 lines)
- `lib/i18n/messages.vi.js` — created (39 lines)
- `app/practice/page.js` — −79 (T table) −1 (local `t()`) +1 (import) +0 (tx redirect) = net −79

### Commit

```
493d0f2  feat(i18n): centralize practice page strings via lib/i18n + t(lang, key) (P2 #16 sub-PR 4a)
```

