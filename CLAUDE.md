# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
follow ./AGENTS.md as guidelines. 
first check doc/4claudelog2.md to find out what was done. 
After any action, append what you did in detail to doc/4claudelog2.md
Check 4claudelog2.md, if content is longer than 800 lines, creaet another file doc/4claudelog3.md and next to doc/4claudelog4.md... keep adding last number of the file name and append the action to that file accordingly. 
After finish any action, provide proper github command to the user
If any new technical action is in place, check offical claude and github repo to seek proper, reliable skills, before apply new skills, give the source of the skills and percentage of trustworthy to me for confirming and verifying. You need to get the approval before apply.

---

# Skill Usage Manual

> **Added:** 2026-05-27 · **Scope:** All 4★ and 5★ skills downloaded to `skills/` per `doc/skillsavi.md` ratings.
>
> **⚠️ LAZY-LOAD RULE — IMPORTANT:**
> **Only load a skill into context when the current task actually needs it.** Skills are reference material on disk, not always-on context. Loading every SKILL.md by default bloats the conversation window and degrades performance. Read a skill's `SKILL.md` *only* when (a) the task description matches the skill's trigger conditions, or (b) the user explicitly invokes it. Otherwise leave it on disk.

## 1. Downloaded Skill Inventory

Skills live under [skills/](skills/). Each subfolder is a git clone of an upstream repo. **Do not auto-load any of them** — consult the table below first to decide if the task requires the skill.

### 1.1 Anthropic Official (5★) — [skills/anthropic-skills/skills/](skills/anthropic-skills/skills/)

| Skill | When to load (trigger) | Path |
|---|---|---|
| **frontend-design** | User asks to build/redesign a component, page, UI; styling/visual polish work; component library extraction (§2.4 of `skillsavi.md`) | `frontend-design/SKILL.md` |
| **webapp-testing** | Writing first E2E test, Playwright-driven verification of `/practice` / `/signs` / `/drive` flows | `webapp-testing/SKILL.md` |
| **skill-creator** | Building a custom skill for this project (e.g., CDL-specific term lookup) | `skill-creator/SKILL.md` |
| **mcp-builder** | Building a custom MCP server (rare — only if Stripe/Sentry MCP insufficient) | `mcp-builder/SKILL.md` |
| **claude-api** | Modifying Anthropic SDK code — **NOT currently used in project**, skip unless adding LLM features | `claude-api/SKILL.md` |
| _algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring, docx, internal-comms, pdf, pptx, slack-gif-creator, theme-factory, web-artifacts-builder, xlsx_ | ❌ Not relevant — do not load | — |

### 1.2 Vercel Labs (4★) — [skills/vercel-agent-skills/skills/](skills/vercel-agent-skills/skills/) and [skills/next-skills/skills/](skills/next-skills/skills/)

| Skill | When to load (trigger) | Path |
|---|---|---|
| **next-best-practices** | Writing/reviewing Next.js code: RSC boundaries, async APIs, route handlers, metadata | `next-skills/skills/next-best-practices/SKILL.md` |
| **react-best-practices** | React perf review, data-fetching waterfalls, bundle-size work, re-render optimization | `vercel-agent-skills/skills/react-best-practices/SKILL.md` |
| **composition-patterns** | §2.4 component library extraction (boolean-prop sprawl, compound components, render props) | `vercel-agent-skills/skills/composition-patterns/SKILL.md` |
| _deploy-to-vercel, react-view-transitions, vercel-cli-with-tokens, vercel-optimize, web-design-guidelines, react-native-skills_ | ⚪ Only load if specifically deploying/optimizing/migrating | — |

### 1.3 OpenAI (4★) — [skills/openai-skills/skills/.curated/](skills/openai-skills/skills/.curated/)

| Skill | When to load (trigger) | Path |
|---|---|---|
| **playwright** | Terminal-driven Playwright automation (CLI wrapper). **Prefer `webapp-testing` first** — only fall back here if CLI-only workflow needed | `playwright/SKILL.md` |
| **playwright-interactive** | Persistent/stateful debugging session (long-lived browser, QA flow) | `playwright-interactive/SKILL.md` |
| _All other `.curated/*` (figma, screenshot, security-*, linear, netlify-deploy, notion-*, jupyter-notebook, aspnet-core, pdf, etc.)_ | ⚪ Load only on exact match | — |

### 1.4 Callstack (4★) — [skills/callstack-agent-skills/skills/](skills/callstack-agent-skills/skills/)

| Skill | When to load (trigger) | Path |
|---|---|---|
| **github** | GitHub workflow tasks: PR creation, stacked PRs, squash-merge, code review automation via `gh` CLI | `github/SKILL.md` |
| **github-actions** | Writing/debugging GitHub Actions workflows (CI pipeline §4.4 of `skillsavi.md`) | `github-actions/SKILL.md` |
| _react-native-best-practices, react-native-brownfield-migration, upgrading-react-native_ | ❌ Not relevant — project is web Next.js, not RN | — |

### 1.5 Trail of Bits (4★) — [skills/trailofbits-skills/plugins/](skills/trailofbits-skills/plugins/)

> **Note:** Downloaded for completeness per "all 4★+" instruction, but Trail of Bits skills target **C/C++ security testing** (AFL++, libfuzzer, address-sanitizer, constant-time analysis). **Not applicable to this Next.js / JavaScript project.** Do not load any subfolders unless the project gains a native/C component.

## 2. Skill Selection Decision Tree

When a new task starts, **before reading any SKILL.md**, classify the task:

1. **Refactor / clean up changed code?** → Use built-in `simplify` (Claude Code CLI), no download needed.
2. **Verify a UI change works?** → Use built-in `verify` or `run` (Claude Code CLI).
3. **Write a Next.js / React feature?** → If a non-obvious convention question arises, *then* load `next-best-practices` or `react-best-practices`.
4. **Component library extraction (P2 #15)?** → Load `composition-patterns` + `frontend-design` (but force CSS-variables prompt, no Tailwind).
5. **First E2E test (P3 #19)?** → Load `webapp-testing` (Anthropic, primary). Only consult OpenAI `playwright` if CLI-only.
6. **GitHub PR / CI workflow?** → Load callstack `github` for `gh` CLI patterns or `github-actions` for workflow YAML.
7. **Anthropic SDK work?** → Load `claude-api` (currently unused in project — skip).
8. **None of the above?** → Don't load a skill. Use the conversation context.

## 3. Trust Tiers (recap from `doc/skillsavi.md §10`)

- **5★** Anthropic official + built-in: use freely.
- **4★** Vercel Labs / OpenAI / Trail of Bits / Callstack: use freely, but prompt explicitly to respect this project's conventions (CSS variables, plain JS, no Tailwind, no TypeScript yet).
- **3★ and below:** not downloaded. Consult `doc/skillsavi.md` if a niche need arises.

## 4. Hard Rules

- **Never auto-load skills at session start.** Wait for a task that triggers one.
- **Never load more than one SKILL.md per task** unless the task genuinely spans multiple domains (e.g., "extract component + write E2E test for it").
- **Always re-state the skill's recommendations in this project's idiom** before applying: e.g., `frontend-design`'s Tailwind defaults must be translated to CSS variables before any code is written.
- **Updating skills:** Run `git -C skills/<repo-name> pull` when a skill's upstream gets a meaningful update. Do not commit the skill contents into this project's commit history (they're git clones with their own `.git`).
- **`.gitignore` for `skills/`:** Consider adding `skills/` to `.gitignore` if the project doesn't want ~55MB of vendored skill content in its tree. (Decision left to user.)
