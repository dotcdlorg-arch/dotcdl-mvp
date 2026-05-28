# 4claudelog7.md

Continues from `doc/4claudelog6.md` (closed at 1248 lines, past the
800-line rollover threshold defined in `CLAUDE.md`).

---

## Action 64 — Download all 4★ and 5★ skills to `skills/` folder and append a Skill Usage Manual to `CLAUDE.md`

**Files added (new directories, each a git clone of an upstream repo):**
- `skills/anthropic-skills/` — Anthropic official 17 skills (5★)
- `skills/vercel-agent-skills/` — Vercel Labs (4★)
- `skills/next-skills/` — Vercel Labs / Next.js skills (4★)
- `skills/openai-skills/` — OpenAI Codex skills incl. Playwright (4★)
- `skills/callstack-agent-skills/` — Callstack Incubator (4★)
- `skills/trailofbits-skills/` — Trail of Bits (4★) — kept for completeness but flagged as non-applicable

**Files changed:**
- `CLAUDE.md` — appended a new "Skill Usage Manual" section (post the
  "If any new technical action..." paragraph). It documents the
  downloaded inventory and codifies a **lazy-load rule** — skills must
  only be loaded when the current task triggers them, never auto-loaded
  at session start.

**Why:**
User requested: "referring doc/skillsavi.md, download all the 4star and
above skills to skills folder, and read all the skill manual for how to
utlize the skills that corespoding to the project task. Create the skill
usage manual append to CLAUDE.md. make sure to mark down that only load
the skills whenever is needed."

The `doc/skillsavi.md` document (created in Action 63) already classified
each skill by reliability tier (1★–5★) and project relevance. This
action operationalizes those ratings by physically downloading the
recommended skills and writing a manual that prevents context-window
bloat from auto-loading them.

### What changed

#### 1. Approval flow (per CLAUDE.md project rule)

CLAUDE.md mandates: "before apply new skills, give the source of the
skills and percentage of trustworthy to me for confirming and verifying.
You need to get the approval before apply."

Sequence followed:
1. Read `doc/skillsavi.md §10` to extract the 4★+ list with sources.
2. Posted summary of planned downloads (split by 5★ Anthropic-relevant,
   4★ community, and skipped-because-not-file-based) with trust ratings.
3. Used `AskUserQuestion` to gate the download with three scope options
   (relevant-only, Anthropic-only-safer, all-17 + Tier 4).
4. User answered "download all 4 stars and 5 stars rating skills."
5. Proceeded with the broader scope.

#### 2. Repo location discovery

The initial repo paths suggested in `skillsavi.md` (e.g.,
`vercel-labs/next-best-practices` as a top-level repo) were wrong —
those skills are subfolders within larger collection repos. Verified
correct paths via `WebSearch`:

| Original guess (404) | Actual repo | Skill subfolder |
|---|---|---|
| `vercel-labs/next-best-practices` | `vercel-labs/next-skills` | `skills/next-best-practices/` |
| `vercel-labs/react-best-practices` | `vercel-labs/agent-skills` | `skills/react-best-practices/` |
| `vercel-labs/composition-patterns` | `vercel-labs/agent-skills` | `skills/composition-patterns/` |
| `openai/playwright` | `openai/skills` | `skills/.curated/playwright/` and `playwright-interactive/` |
| `trailofbits/testing-handbook-skills` | `trailofbits/skills` | `plugins/testing-handbook-skills/` |
| `callstackincubator/github` | `callstackincubator/agent-skills` | `skills/github/` and `github-actions/` |

#### 3. Clone operations (parallel)

Used `git clone --depth 1` for shallow clones (saves disk, no history
needed). All six repos cloned in parallel. Total `skills/` footprint:
~55 MB.

```
skills/anthropic-skills          14M  (17 official skills)
skills/callstack-agent-skills    17M  (github, github-actions + RN skills)
skills/next-skills              316K  (next-best-practices, next-cache-components, next-upgrade)
skills/openai-skills            7.7M  (.curated/ has ~40 skills incl. playwright)
skills/trailofbits-skills       7.8M  (38 security plugins, C/C++ focused)
skills/vercel-agent-skills      9.4M  (composition-patterns, react-best-practices + 5 others)
```

#### 4. SKILL.md manual reading

Read the first 40 lines of each relevant SKILL.md to determine the
trigger condition / "when to load" criteria for each:

- **frontend-design** (5★): triggers on "build web components, pages,
  artifacts, posters, or applications." ⚠️ Default style suggestions
  lean Tailwind — must override with CSS-variable instructions for this
  project.
- **webapp-testing** (5★): Playwright wrapper with `with_server.py`
  lifecycle manager. Uses "reconnaissance-then-action" pattern (screenshot
  → identify selectors → act). Direct fit for §4.3 P3 #19 (E2E testing).
- **skill-creator** (5★): iterative skill authoring with evals. Use only
  if writing a CDL-specific custom skill.
- **mcp-builder** (5★): four-phase MCP server development guide. Rare —
  only needed if Stripe/Sentry MCP insufficient.
- **claude-api** (5★): Anthropic SDK integration. **Not currently used
  by this project** — skip until LLM features added.
- **next-best-practices** (4★, Vercel): RSC boundaries, async params/
  cookies/headers, route handlers, image optimization. Triggers on any
  Next.js writing/reviewing task.
- **react-best-practices** (4★, Vercel): 70 perf rules in 8 priority
  categories (waterfalls, bundle, server-side, client fetch, re-render,
  rendering, JS perf, advanced). Triggers on React perf review.
- **composition-patterns** (4★, Vercel): boolean-prop sprawl mitigation,
  compound components, lifted state, render props, React 19 APIs. Direct
  fit for §2.4 P2 #15 (component library extraction).
- **playwright** (4★, OpenAI): CLI-only Playwright via wrapper script.
  Secondary to Anthropic `webapp-testing`.
- **playwright-interactive** (4★, OpenAI): persistent stateful browser
  for QA flows.
- **github** (4★, Callstack): `gh` CLI patterns, stacked PR merges with
  rebase chain. Triggers on PR / merge workflow tasks.
- **github-actions** (4★, Callstack): GitHub Actions workflow patterns.
  Triggers on CI pipeline tasks (§4.4 P3 #20).
- **trailofbits/testing-handbook-skills** (4★): all 38 plugins are
  C/C++/security focused (AFL++, libfuzzer, address-sanitizer,
  constant-time analysis, Semgrep). **Not applicable to this Next.js
  project** — flagged as such in manual.

#### 5. CLAUDE.md skill-usage manual structure

Appended a new top-level section "Skill Usage Manual" at end of CLAUDE.md
with five subsections:

1. **Downloaded Skill Inventory** — five tables (5.1 Anthropic, 5.2
   Vercel, 5.3 OpenAI, 5.4 Callstack, 5.5 Trail of Bits) listing every
   downloaded skill with trigger condition and relative path. Non-
   applicable skills marked ❌ or ⚪.
2. **Skill Selection Decision Tree** — 8-step task classifier that
   routes a task to the correct skill (or no skill at all).
3. **Trust Tiers** — recap pointer back to `doc/skillsavi.md §10`.
4. **Hard Rules** — no auto-load, max one skill per task, always
   translate to project idiom (CSS variables, plain JS, no Tailwind),
   `git pull` to refresh, optional `.gitignore` entry.
5. **Lazy-load rule** — bold callout at top of the entire section
   stating skills are reference material on disk, not always-on context,
   and that loading every SKILL.md by default bloats context window.

#### 6. Not changed

- `doc/skillsavi.md` — kept as the source-of-truth rating document.
  CLAUDE.md manual references it but doesn't duplicate the rating tables.
- All earlier `doc/4claudelog*.md` files — unchanged.
- No code touched. Doc + on-disk skill clones only.

### Verification

- All six repos cloned successfully (`ls skills/` shows all expected
  subfolders).
- Each project-relevant SKILL.md verified to exist and contain valid
  frontmatter (name, description) by `head -40`.
- CLAUDE.md re-read after edit to confirm manual appended in correct
  location (after the existing rule paragraph, not inserted in middle).

### Caveats / open items

- **Disk footprint:** ~55 MB of vendored skill content. CLAUDE.md raises
  the `.gitignore` option but does not enforce it — left as a user
  decision.
- **Trail of Bits non-applicability:** kept downloaded for completeness
  per "all 4★+" instruction, but the manual explicitly tells future
  Claude not to load any of its sub-skills unless the project gains a
  native/C component.
- **Skill freshness:** clones use `--depth 1`, so a `git pull` is
  required to pick up upstream changes. Manual mentions this.

### Suggested commit

```
git add CLAUDE.md doc/4claudelog7.md
# Optional: also commit the skills tree if you want vendored skills
# in the repo. Otherwise add `skills/` to .gitignore first.
git commit -m "doc(CLAUDE.md): add Skill Usage Manual for downloaded 4★+ skills with lazy-load rule; download Anthropic 17 + Vercel + OpenAI + Callstack + Trail of Bits to skills/"
git push origin main
```

If choosing NOT to commit the `skills/` tree:

```
echo "skills/" >> .gitignore
git add .gitignore CLAUDE.md doc/4claudelog7.md
git commit -m "doc(CLAUDE.md): add Skill Usage Manual; ignore vendored skills/ tree"
git push origin main
```

---

## Action 65 — Use Plan agent to produce detailed implementation plan for 8 open refactor items; write to `doc/2implan.md`

**Files created:**
- `doc/2implan.md` — full implementation plan, ~10 sections + cross-cutting recommendations + critical-files index + effort table.

**Files changed:**
- `doc/4claudelog7.md` — this log entry.

**Why:**
User requested: "referring doc/2improve.md, 用 Plan agent 在每次重构前先出方案, put detail plan at doc/2implan.md."

Per `doc/skillsavi.md` §0.3 + §9, the `Plan` agent is the project's
designated tool for designing implementation strategies before any
refactor begins. The 8 open items in `doc/2improve.md` (P1 #8–#10
and P2 #12–#16) had no concrete implementation plans — each was
described in 1–2 sentences in the audit. Coding without a plan
risks the exact "边写边想" (writing while thinking) failure mode
that `CLAUDE.md` §1 ("Think Before Coding") forbids.

### What the Plan agent did

Invoked via `Agent` tool with `subagent_type: "Plan"` (read-only
research subagent). Provided as context:

- `doc/2improve.md` audit findings
- `CLAUDE.md` behavioral guidelines (Surgical Changes, Simplicity
  First, Goal-Driven Execution)
- `AGENTS.md` additional rules reference
- File-size pressure notes from §3 of `2improve.md` (practice 872,
  mock 781, drive 818, AppShell 300 lines)
- **Critical project constraints** explicitly stated:
  - Plain JavaScript only (no TypeScript in scope)
  - No Tailwind, no CSS Modules, no styled-components — pure CSS
    variables in `app/globals.css`
  - iOS gesture preservation requirement (Actions 60–61, 65–67)
  - Optimistic UI must survive any `useProgress` refactor
  - `scoreKeywords()` local fallback must survive `useScoring`
    refactor

### Plan structure (8 items + cross-cutting)

For each item the Plan agent produced:
- **Goal** (one sentence)
- **Files to create / modify** with exact paths
- **Step-by-step plan** (numbered, each step has a verifiable check)
- **Risks / pitfalls** specific to this project's prior bugs
- **Verification criteria** (manual or automated)
- **Estimated LoC** (added / removed / net)

### Items planned

**Batch 1 — P1 highest leverage:**

1. **P1 #9 — History progress loading on mount** (~½–1 day)
   - Add `GET /api/progress` on `/practice` + `/signs` mount
   - Merge-not-overwrite to protect optimistic writes
2. **P1 #8 — Language preference persistence** (~½ day)
   - `lib/lang-context.js` (LanguageProvider + useLang)
   - localStorage + SSR hydration trap mitigation
3. **P1 #10 — Unified user feedback (toast + inline alert)** (~1 day)
   - `lib/toast-context.js` + `components/Toast.js` +
     `components/InlineAlert.js`
   - ~30 lines of CSS appended to `app/globals.css`
   - Dedupe within 2s window; iOS safe-area handling

**Batch 2 — P2 structural refactor:**

4. **P2 #16 — i18n centralization (lightweight)** (~2 days, 5 sub-PRs)
   - 6 × `lib/i18n/messages.{lang}.js` + 1 × `lib/i18n/index.js`
   - Flat key prefix per page (`practice.`, `mock.`, `drive.`,
     `terms.`, `nav.`)
   - Dev-only missing-key warnings; production silent
5. **P2 #12 — `useRecorder` hook** (~1 day) **[highest iOS risk]**
   - `hooks/useRecorder.js` + `lib/audio-unlock.js`
   - Synchronous `unlockAudio()` BEFORE `await getUserMedia`
     (Actions 60–61 lesson)
   - Stream cleanup on unmount
6. **P2 #13 — `useScoring` hook** (~1 day)
   - `hooks/useScoring.js`
   - Preserves `scoreKeywords()` fallback when `/api/score` fails
7. **P2 #14 — `useProgress` hook (bundle with #1)** (~½ day on top of #1)
   - `hooks/useProgress.js`
   - Optimistic UI semantics preserved
8. **P2 #15 — Component library split** (~3–5 days, 5 sub-PRs)
   - Phase A: `ScoreRing`, `ProgressBar`, `WaveformIndicator`,
     `BadgeChip` (leaf UI, zero deps)
   - Phase B: `RecordButton`, `LanguageSelector` (uses Phase A)
   - Phase C: `QuestionCard` (big practice extraction), then
     `OfficerBubble`, `DriverBubble`, `VoiceSelector` (drive)
   - Phase D (deferred / optional): `Sidebar`, `Topbar`,
     `MobileTabs` from `AppShell`

### Cross-cutting recommendations (§9 of plan doc)

**PR sequencing (final order):**

1. PR 1 → ITEMS #14 + #9 bundled
2. PR 2 → ITEM #8 (lang persistence)
3. PR 3 → ITEM #10 (toast system)
4. PRs 4a–4e → ITEM #16 (i18n, 5 sub-PRs)
5. PR 5 → ITEM #12 (useRecorder) **[needs iPhone Safari test]**
6. PR 6 → ITEM #13 (useScoring)
7. PRs 7.1–7.5 → ITEM #15 (component library)

**Bundling rules:**
- BUNDLE #14 + #9 (avoids duplicate scaffolding)
- DO NOT bundle #12 + #13 (iOS regression risk in #12 needs
  isolation)
- DO NOT bundle #16 + #15 (would create 1000-line diff; #16 must
  ship first so #15's components can call `t(lang, key)`)

**Verification gates between PRs:**
- `npx next build` clean
- Sign-in/answer/reload smoke test
- iPhone Safari gesture test (post-#5)
- 6-language render test (post-#16)
- `/api/score` block fallback test (post-#13)
- Toast dedupe test (post-#10)

**Rollback strategy:**
- Every PR is `git revert`-able independently
- No database migration in any PR
- No public API removed by any PR

**Total estimated effort:** ~10.5 days, or ~9.5 days if Phase D
(layout split) is deferred.

### Not changed

- `doc/2improve.md` — kept as audit source. Plan references it but
  doesn't duplicate findings.
- `CLAUDE.md` — Skill Usage Manual (Action 64) referenced for
  lazy-load rule but no edits.
- No code touched. Plan document only.

### Suggested commit

```
git add doc/2implan.md doc/4claudelog7.md
git commit -m "doc: add doc/2implan.md — detailed implementation plan for 8 open refactor items (P1 #8-10 + P2 #12-16); planned via Plan agent per CLAUDE.md 'Think Before Coding'"
git push origin main
```

---

## Action — 2026-05-27 — Today's execution schedule (Chinese)

### Goal

User asked: referencing `doc/2implan.md`, produce a schedule of what we
can accomplish *today*, leveraging suitable skills from
`doc/skillsavi.md`. Output to be written in Chinese to a new file
`doc/3cimplanexec.md`.

### What was done

1. Read full `doc/2implan.md` (451 lines) — the 8-item plan covering
   P1 #8–#10 + P2 #12–#16, with §11 effort table.
2. Read full `doc/skillsavi.md` (823 lines) — skill inventory with
   reliability ratings in §10.
3. Cross-referenced 2implan.md §11 (effort + risk table) against
   skillsavi.md §6 (recommended skill bundles) and §10.8
   (recommended-install order).
4. Selected for today: **PR2 (#8 language persistence, 0.5d, low risk)
   + PR1 (#14 + #9 bundled progress hook + GET-on-mount, 1.0d, low
   risk)**. Rationale:
   - both items are low-risk per 2implan.md §11
   - both are user-visible quick wins per 2implan.md §9.1
   - skillsavi.md §6.1 explicitly bundles "lang persistence + history
     progress load" as the first batch
   - explicitly excluded high-risk items (#12 useRecorder iOS
     regression, #16 i18n 2-day volume, #15 component split needs #16
     first)
5. Created `doc/3cimplanexec.md` (Chinese, 9 sections) covering:
   - §0 task overview table
   - §1 hourly timetable
   - §2 T1 (PR2 lang persistence) step-by-step with file paths, risks,
     commit message
   - §3 T2 (PR1 progress hook) step-by-step with optimistic-update
     guards and verification gates
   - §4 T3 optional reconnaissance for tomorrow's PR3 (#10 toast)
   - §5 skill/agent inventory used today, all 5★ Anthropic-official
     only, no third-party deps
   - §6 acceptance checklist
   - §7 risk register
   - §8 explicit "not in today's scope" list
   - §9 one-sentence summary

### Files changed

- `doc/3cimplanexec.md` — created, ~220 lines, Chinese
- `doc/4claudelog7.md` — appended this action entry

### Files NOT changed

- No code touched. Planning document only.
- `doc/2implan.md` and `doc/skillsavi.md` — read-only references.

### Suggested commit

```
git add doc/3cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/3cimplanexec.md — today's execution schedule (Chinese) for PR2 (#8) + PR1 (#14+#9), referencing 2implan.md + skillsavi.md"
git push origin main
```

---

## Action — 2026-05-27 — Sequence audit answer (Chinese)

### Goal

User asked: "are we following doc/2implan.md suggest sequence". Append
answer in Chinese to `doc/3cimplanexecAns.md`, create as needed.

### What was done

1. Re-read `doc/2implan.md` §9.1 (lines 374–390) to confirm the
   official PR sequence: **PR1 = #14+#9 bundled, PR2 = #8**.
2. Compared against `doc/3cimplanexec.md` §1 timetable: T1 (morning) =
   PR2 (#8), T2 (afternoon) = PR1 (#14+#9). Discovered the **execution
   order is reversed** vs. §9.1.
3. Created `doc/3cimplanexecAns.md` (Chinese, 7 sections):
   - §1 direct answer: NOT fully following — order is swapped
   - §2 side-by-side table of every dimension (PR choice ✅, bundling
     ✅, exclusion of high-risk items ✅, **execution order ❌**, commit
     independence ✅, verification gates ✅)
   - §3 honest reason for the swap (just "warmup quick win + deep
     afternoon", not document-backed)
   - §4 impact assessment: technical=none (independent PRs),
     process=mild (PR1 was tagged "critical-path user-visible win" in
     §9.1, so swap puts the lower-priority item first), comm=medium
     (cognitive friction between two docs)
   - §5 two correction options:
     - **Option A (recommended):** swap timetable back to match §9.1
     - **Option B:** keep current order but add an explicit "deviation
       note" in 3cimplanexec.md §1
   - §6 recommendation: Option A, citing CLAUDE.md §1 "Don't pick
     silently" and asymmetric risk (PR1 harder than PR2, do harder
     first while fresh)
   - §7 one-sentence summary

### Files changed

- `doc/3cimplanexecAns.md` — created, Chinese, ~150 lines
- `doc/4claudelog7.md` — appended this action entry

### Files NOT changed

- `doc/3cimplanexec.md` — not yet modified; user needs to choose
  Option A vs B first
- No code touched.

### Suggested commit

```
git add doc/3cimplanexecAns.md doc/4claudelog7.md
git commit -m "doc: add doc/3cimplanexecAns.md — sequence audit answer (Chinese); flags T1/T2 order swap vs 2implan.md §9.1, recommends Option A (swap back)"
git push origin main
```

---

## Action — 2026-05-27 — Create doc/32cimplanexec.md (corrected first-stage schedule, Chinese)

### Goal

User asked: referring to `doc/2implan.md` and following its sequence,
steps, and suggestion, produce a schedule for the first part we can
accomplish, utilizing suitable skills from `doc/skillsavi.md`. Output
in Chinese to `doc/32cimplanexec.md` (create if not exist).

### What was done

1. Re-read `doc/2implan.md` §9.1 (lines 374–390) PR sequencing +
   §11 (lines 433–448) effort table.
2. Re-read `doc/skillsavi.md` §6.1 (first-batch recommended skills)
   + §10 (reliability ratings).
3. Re-read prior `doc/3cimplanexec.md` and `doc/3cimplanexecAns.md`
   to identify the T1/T2 order issue (prior plan inverted §9.1's
   PR1/PR2 order).
4. Created NEW file `doc/32cimplanexec.md` (~280 lines, Chinese, 10 sections):
   - §0 scope: "first part" = PR1 (#14+#9 bundled) + PR2 (#8), 1.5 days, all 🟢 low risk
   - §1 timetable: morning = PR1, afternoon = PR2 (corrected order)
   - §2 PR1 detail: useProgress hook design, 6 numbered impl steps,
     risk table, 6-item acceptance checklist, commit command
   - §3 PR2 detail: LanguageProvider design, 5 impl steps, SSR
     hydration guidance, risk table, 7-item acceptance checklist,
     commit command
   - §4 skill usage table: cites skillsavi.md §10 ratings; explicitly
     marks which skills are NOT used today and why
   - §5 full acceptance checklist (code / process / user value)
   - §6 risk-prediction table with mitigations
   - §7 explicit out-of-scope list (PR3 through Stripe)
   - §8 diff vs old `3cimplanexec.md` (clear comparison row by row)
   - §9 Github commands (commit + push, with explicit "do not push
     without user consent" warning per CLAUDE.md/AGENTS.md)
   - §10 one-sentence summary
5. Key corrections vs `3cimplanexec.md`:
   - Execution order swapped back: PR1 first (was T2), PR2 second
     (was T1) — matches 2implan.md §9.1 "PR1 = #14+#9 critical-path
     user-visible win" recommendation
   - Rationale documented (asymmetric difficulty + asymmetric user
     value) per `3cimplanexecAns.md` §6 Option A
6. No code touched. Pure planning document.

### Files changed

- `doc/32cimplanexec.md` — created, ~280 lines, Chinese
- `doc/4claudelog7.md` — appended this action entry

### Files NOT changed

- `doc/3cimplanexec.md` — left intact for historical reference
- `doc/2implan.md` / `doc/skillsavi.md` / `doc/3cimplanexecAns.md` — read-only
- No source code touched

### Suggested commit

```
git add doc/32cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/32cimplanexec.md — first-stage execution schedule (Chinese) aligned with 2implan.md §9.1 order (PR1 #14+#9 first, then PR2 #8)"
git push origin main
```

---

## Action — 2026-05-28 — Create doc/33cimplanexec.md (Phase 6 Stripe payment plan via Plan agent, Chinese)

### Goal

User asked: call the Plan agent to make a plan for payment function
referring to `doc/1improve.md`, `doc/2improve.md`, and
`doc/2gptimprove.md`. Append info to `doc/33cimplanexec.md` with
correct implementation sequence. Create file as needed.

### What was done

1. Verified the target file `doc/33cimplanexec.md` did not exist; the
   three source docs (1improve.md, 2improve.md, 2gptimprove.md) all
   exist in `doc/`.
2. Spawned the **Plan agent** (subagent_type: Plan) with a
   self-contained brief covering:
   - Source docs to read (1improve.md §14.3, 2improve.md §6, 2gptimprove.md §8/§12)
   - skillsavi.md §10.6 correction: official Stripe MCP / @stripe/mcp / @stripe/agent-toolkit (5★) preferred over wrsmith108/stripe-mcp-skill (1★)
   - Project constraints: no TypeScript, no Tailwind, no next-intl, CSS variables only, Stripe Checkout hosted (PCI scope avoidance), webhook idempotency mandatory, server-side gating only
   - Required output sections (§0–§11) modeled on doc/32cimplanexec.md
   - Explicit instruction to extract unresolved product questions verbatim from source docs and NOT pick answers on behalf of the user
3. Plan agent returned a complete ~280-line Chinese plan structured as 11 sections + an appendix:
   - §0 scope + 8 unresolved product decisions (Q1–Q8) verbatim from source docs + temporary assumptions A1–A6 for self-consistency
   - §1 architecture: data-flow ASCII timing diagram, profiles field design (+4 columns), stripe_events idempotency table, route inventory
   - §2 Stripe official tooling (mcp.stripe.com / @stripe/mcp / @stripe/agent-toolkit / stripe/ai / stripe npm) all 5★; explicit anti-recommendation of wrsmith108/stripe-mcp-skill (1★)
   - §3 PR-by-PR sequence: **PR1→PR2→PR3→PR4→PR5→PR6→PR7→PR8** (8 PRs, ~4.75 days). Each PR has goal / files / numbered steps with verification / risks / acceptance / rollback / LoC / commit
   - §4 SQL migrations (profiles ALTER + stripe_events DDL + RLS policies)
   - §5 webhook idempotency (event_id dedup table, NOT upsert; business UPDATE first, then dedup INSERT to avoid Stripe-retry deadlock)
   - §6 three-layer server-side defense (middleware + page guard + future API guard); explicit anti-pattern list
   - §7 Stripe CLI + test card matrix + 10 E2E test cases (T1–T10)
   - §8 risk warning table (security / product / ops / engineering)
   - §9 explicit out-of-scope list (refund automation, dunning, tax, multi-currency, etc.)
   - §10 per-PR git commands ready to copy
   - §11 one-sentence summary
   - Appendix: critical files for implementation
4. Wrote the full plan verbatim to `doc/33cimplanexec.md` (~880 lines after rendering tables and code blocks).
5. No source code touched. Pure planning document.

### Key design decisions captured (for future reference)

- **Order rationale**: PR1 (SDK scaffold) → PR2 (DB migration) is the
  only valid prefix; PR3 (UI + Checkout) must precede PR4 (gating) so
  users have a place to upgrade BEFORE they're blocked; PR5 (webhook)
  must follow PR1+PR2 but can theoretically precede PR4 — Plan agent
  put it after PR4 so the gating UI can be visually tested with manual
  Supabase plan flips before the webhook automates it.
- **Stripe Checkout hosted page** (not Elements) — keeps project OUT
  of PCI-DSS scope.
- **Idempotency model**: event_id dedup table (`stripe_events`), with
  business UPDATE first then INSERT dedup. The reverse order would
  cause Stripe-retry deadlock if business fails.
- **Server-side gating only**: three-layer defense (middleware + page
  + future API); never trust client-side `plan` reads.
- **Explicit Stripe tooling correction**: skillsavi.md §10.6 already
  retracts the §5.1 recommendation of wrsmith108/stripe-mcp-skill
  (1★); this plan locks in official Stripe MCP (`mcp.stripe.com` or
  `@stripe/mcp`) as 5★ replacement.

### Files changed

- `doc/33cimplanexec.md` — created, ~880 lines, Chinese
- `doc/4claudelog7.md` — appended this action entry

### Files NOT changed

- `doc/1improve.md` / `doc/2improve.md` / `doc/2gptimprove.md` — read-only references
- `doc/skillsavi.md` / `doc/2implan.md` / `doc/32cimplanexec.md` — read-only templates
- No source code touched

### Suggested commit

```
git add doc/33cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/33cimplanexec.md — Phase 6 (Stripe monetization) PR-by-PR plan (Chinese, via Plan agent)"
git push origin main
```

---

## 2026-05-28 — PR1: `useProgress` hook + GET-on-mount hydration (P1 #14 + #9)

### Trigger

User: "follow doc/32cimplanexec.md to proceed the first part implementation and utilize required skills."

Plan source: [`doc/32cimplanexec.md`](32cimplanexec.md) §2 (PR1). "First part" defined in §0 as PR1 + PR2 (1.5 days). Started with PR1 per §1 timetable.

### Baseline

- `git status` — clean working tree on relevant source files; only new doc/skill files untracked.
- `npm run build` — passed (Compiled in 1092ms, 18/18 static pages generated, no warnings).
- No `hooks/` directory existed; created it.

### What changed

**New file: `hooks/useProgress.js`** (110 lines, `'use client'`)
- Signature: `useProgress({ type })` where `type ∈ 'question' | 'sign'`
- Returns: `{ progress, stats, loading, markQuestion, markSign }`
- Mount-time effect: `GET /api/progress` with `credentials: 'same-origin'`.
  - 401 → silent no-op (anonymous flow unbroken)
  - 5xx / network error → `console.warn`, no toast (toast belongs to PR3)
  - 800ms timeout safety: even if fetch never resolves, `loading` flips to `false`
- Server shape → keyed-by-code shape:
  - questions: `{ status, score, transcript, viewCount: 1 }`
  - signs: `{ score }`
- Race guard: when GET resolves AFTER a user click already wrote to local state, the local value wins (merge prefers `prev` over server snapshot per key).
- `markQuestion(code, status, score, transcript)`:
  - Step 1: `setProgress(prev => ...)` — local-first (preserves optimistic UX)
  - Step 2: POST `/api/progress` (catch logs only)
- `markSign(code, score, answer)`:
  - Step 1: `setProgress(prev => ({ ...prev, [code]: { score } }))`
  - Step 2: POST `/api/progress` with `type: 'sign'`
- `stats`: `useMemo`'d, branches on `type` (questions get `avgScore`, signs don't), `total` intentionally NOT included so the hook stays pure (page supplies `total`).

**Modified: `app/practice/page.js`**
- Added: `import { useProgress } from '@/hooks/useProgress'`
- Removed: top-level `saveProgress` helper function (now lives in hook).
- Removed: `const [progress, setProgress] = useState({})`.
- Removed: local `stats` computation block (10 lines).
- Removed: local `markStatus` `useCallback` (12 lines).
- Removed: `useCallback` import (no longer used after the markStatus removal).
- Added: `const { progress, stats: hookStats, markQuestion } = useProgress({ type: 'question' })`.
- Added: `const stats = { ...hookStats, total: QUESTIONS.length }` (page supplies total).
- Added: `const markStatus = markQuestion` (alias — preserves 14+ existing call sites without rename).
- Net change: ~25 lines removed, ~6 added → −19 lines.

**Modified: `app/signs/page.js`**
- Added: `import { useProgress } from '@/hooks/useProgress'`
- Removed: `const [progress, setProgress] = useState({})`.
- Removed: local `setProgress` + manual POST inside `checkAnswer` (replaced by `markSign(...)`).
- Removed: local `stats` computation block.
- Added: `const { progress, stats: hookStats, markSign } = useProgress({ type: 'sign' })`.
- Added: `const stats = { ...hookStats, total: SIGNS.length }`.
- Updated rendering (lines 158–160): `progress[code]` (was raw number) → `progress[code]?.score` (new shape).
  - Old: `progress[sign.sign_code] != null && <span ...>{progress[sign.sign_code]}/100</span>`
  - New: `progress[sign.sign_code]?.score != null && <span ...>{progress[sign.sign_code].score}/100</span>`

**Not touched (per plan §2.3 step 4):**
- `app/drive/page.js` — drive only POSTs progress, no display. Deferred to a later PR.
- `components/AppShell.js` — stats prop shape unchanged (still `{ seen, total, understood, review, avgScore? }`).

### Risk decisions made during implementation

| Risk | Decision |
|---|---|
| Zero-flicker guard for stats during `loading` | NOT applied in PR1. Existing UX already shows `0/total` on first paint; hydrate-and-update flicker is short (<200ms). Added `loading` to hook return so future PR can opt-in. Trade-off documented per CLAUDE.md §2 (minimum code). |
| Optimistic update preserved? | YES. Verified: `setProgress` runs synchronously in `markQuestion` BEFORE `fetch(...)` line; no `await fetch` anywhere in the write path. |
| Race: GET overwrites a fast user click | Handled via merge guard: `prev` keys override the server `next` map in the post-GET `setProgress`. |
| signs shape change | All 3 read sites (lines 158–160) updated in one pass. `grep "progress\["` confirms no stale raw-number reads remain. |
| Hook line count | 110 lines — under the 130-line budget from plan §2.4. |

### Build verification

- `npm run build` after PR1: ✓ Compiled in 1209ms, 18/18 pages.
- Bundle deltas: `/practice` 8.32 → 8.77 kB (+0.45), `/signs` 2.66 → 3.29 kB (+0.63). Acceptable.
- No new warnings, no type errors.

### Acceptance items (deferred to browser verification)

Plan §2.5 acceptance is browser-driven (real DB, real auth, DevTools Network throttling). Build + static analysis pass; runtime verification requires the user to log in and exercise the flow per §2.5.

### Files changed

- `hooks/useProgress.js` — created (+110 lines)
- `app/practice/page.js` — modified (−19 net)
- `app/signs/page.js` — modified (−2 net)

### Suggested commit

```
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"
```

---

## 2026-05-28 — PR2: `LanguageProvider` + `localStorage` persistence (P1 #8)

### Trigger

Same user request, continuing per plan §1 timetable (PR1 morning → PR2 afternoon).

Plan source: [`doc/32cimplanexec.md`](32cimplanexec.md) §3.

### What changed

**New file: `lib/lang-context.js`** (35 lines, `'use client'`)
- Exports `LanguageProvider` and `useLang()`.
- SSR-safe pattern: `useState('zh')` initializes on the server AND first client render (no hydration mismatch). `useEffect` hydrates from `localStorage` after mount.
- Comment in source explicitly warns future devs not to "fix" this by reading localStorage in the useState initializer.
- `setLang` writes both React state and `localStorage.setItem` inside a `try/catch` (Safari private mode tolerance).
- `localStorage` value is validated against allowlist `['en','zh','es','hi','pa','vi']` before applying.
- `useLang()` throws if used outside the provider (fail-fast, per CLAUDE.md §1 — surface bugs, don't hide).

**Modified: `app/layout.js`** (Server Component)
- Added: `import { LanguageProvider } from '@/lib/lang-context'`
- Wrapped `{children}` inside `<body>` with `<LanguageProvider>` (Client Component nests inside Server Component layout — standard Next.js 13+ App Router pattern).

**Migrated 5 pages from `useState('zh')` to `useLang()`:**
- `app/practice/page.js` — added `useLang` import, replaced state line
- `app/signs/page.js` — added `useLang` import, replaced state line
- `app/mock/page.js` — added `useLang` import, replaced state line
- `app/drive/page.js` — added `useLang` import, replaced state line
- `app/terms/page.js` — added `useLang` import, replaced state line

### Deviation from plan: `app/page.js` (landing) NOT migrated

Plan §3.3 listed 6 pages including landing. Landing's existing default is `useState('en')` — built for English-speaking first-time visitors arriving via Google/SEO. Provider default is `'zh'` per plan. Migrating landing would:
- Show first-time English visitors a Chinese landing page (SEO/onboarding regression).
- Conflict with the "marketing copy in user's expected language" intent.

User confirmed via in-flow question: **"Skip landing in this PR"**. Landing keeps its local `useState('en')`. Once a signed-in user picks a language on a study page, persistence works across all migrated pages.

### Risk decisions

| Risk | Decision |
|---|---|
| SSR hydration mismatch | Default `'zh'` on server AND first client paint; useEffect-only localStorage read. Explicit source comment. |
| Safari private mode `localStorage.setItem` throws | Both reads and writes wrapped in `try/catch`. |
| Provider not in tree → `useLang()` throws | Intentional. App layout wraps every route, so any throw would be a developer bug, not a user-facing crash. |
| `useState('zh')` residues | `grep -rn "useState('zh')" app/` returned 0 lines after migration. |

### Build verification

- `npm run build` after PR2: ✓ Compiled in 1514ms, 18/18 pages.
- Bundle deltas (vs. PR1): essentially flat (+0.00–0.01 kB per page from context consumer). `/practice` 8.77, `/signs` 3.30, `/mock` 9.06, `/drive` 8.89, `/terms` 28.7 kB.
- No hydration warnings emitted by the build (full runtime confirmation requires browser).

### Acceptance items (deferred to browser verification)

Plan §3.5 acceptance is browser-driven (localStorage inspection, hydration warnings in DevTools console). Runtime verification requires the user to switch language on a study page and refresh.

### Files changed

- `lib/lang-context.js` — created (+35 lines)
- `app/layout.js` — modified (+2 lines)
- `app/practice/page.js` — modified (+1 import, −1+1 state line)
- `app/signs/page.js` — modified (+1 import, −1+1 state line)
- `app/mock/page.js` — modified (+1 import, −1+1 state line)
- `app/drive/page.js` — modified (+1 import, −1+1 state line)
- `app/terms/page.js` — modified (+1 import, −1+1 state line)
- `app/page.js` — UNCHANGED (per user decision above)

### Suggested commit

```
git add lib/lang-context.js app/layout.js \
        app/practice/page.js app/signs/page.js \
        app/mock/page.js app/drive/page.js app/terms/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"
```

> Note: `app/page.js` (landing) intentionally excluded from this commit per user decision — keeps English-default landing for SEO. See action log above for rationale.

---

## 2026-05-28 — Suggested combined push sequence (per plan §9)

```
# 1. PR1 — useProgress hook
git add hooks/useProgress.js app/practice/page.js app/signs/page.js
git commit -m "feat(progress): add useProgress hook with GET-on-mount hydration (P1 #14 + #9)"

# 2. PR2 — language persistence
git add lib/lang-context.js app/layout.js \
        app/mock/page.js app/drive/page.js app/terms/page.js
# (practice/signs already staged in PR1 commit; their PR2 hunks are part of THIS commit
#  via second `git add` — both files get a second commit with the lang change. Safe because
#  the two PRs touch distinct hunks.)
git add app/practice/page.js app/signs/page.js
git commit -m "feat(lang): persist language preference via Context + localStorage (P1 #8)"

# 3. Plan + log
git add doc/32cimplanexec.md doc/4claudelog7.md
git commit -m "doc: add doc/32cimplanexec.md — first-stage execution schedule + log entries"

# 4. Push (DO NOT run without explicit user confirmation)
# git push origin main
```

⚠️ Per CLAUDE.md / AGENTS.md: do not `git push` without explicit user OK.

