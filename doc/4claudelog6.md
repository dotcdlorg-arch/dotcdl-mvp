# 4claudelog6.md

Continues from `doc/4claudelog5.md` (closed at 867 lines after
Action 62, past the 800-line rollover threshold in `CLAUDE.md`).

---

## Action 63 — Remove the question/term/sign search box from Practice (Listening + Speak + AI score), Terms, and Traffic Signs pages

**Files changed:**
- `app/practice/page.js`
- `app/terms/page.js`
- `app/signs/page.js`

**Why:**
User asked: "remove search question function for listening, speak +AI
score, terms, and traffic signs categories." The search inputs were
adding a typed-text filter on top of the existing category/difficulty
chip filters. The product is being simplified so drivers only filter
by category (and difficulty on Practice), then swipe through a
shuffled deck. The search box was also tempting drivers to look up
exact phrases instead of practicing recall.

### What changed

#### `app/practice/page.js` (covers all three practice modes:
text / listening / speak+AI — gated by `?mode=` URL param, shared
filter UI)

- Removed the `search:` translation key from the `T` dict for all
  six languages (en/zh/es/hi/pa/vi). Each row's `all:` entry no
  longer has a trailing `search: 'Search…'` sibling.
- Deleted `const [search, setSearch] = useState('')` state.
- Inside `baseFiltered = useMemo(...)`: removed the `if (search) {
  const s = search.toLowerCase(); if (!officer_question_en.includes
  ...) return false }` block. The remaining filter is just
  `filterCat` + `filterDiff`.
- Dropped `search` from the useMemo dependency array → now
  `[filterCat, filterDiff]`. The Fisher-Yates shuffle is unchanged
  and still re-runs only on filter changes (not on `progress`
  updates), preserving the deck order while the user navigates.
- Deleted the `<input type="search">` element that sat between the
  difficulty chips row and the "Review only" checkbox label. The
  checkbox's `marginTop:10` already absorbs the visual spacing the
  input previously provided, so the layout collapses cleanly.

#### `app/terms/page.js`

- Removed the `search:` key from all six `T` rows.
- Deleted `const [search, setSearch] = useState('')`.
- Simplified `filtered = useMemo(...)`: dropped the
  `if (search) { ... t.en / t[lang] includes ... }` branch. Only
  `filterCat` filtering remains.
- Dependency array shrank from `[filterCat, search, lang]` to
  `[filterCat]`. `lang` was only in the deps because the search
  compared against `t[lang]`; with search gone, the filtered list
  no longer depends on `lang`. The language switcher still works
  because each term's translation is rendered inside the loop body
  via `t[lang]` — only the *filter predicate* stopped caring about
  `lang`.
- Deleted the `<input type="text">` between the category chips row
  and the empty-state card. Updated the surrounding comment from
  "Category filter chips + search" to "Category filter chips".

#### `app/signs/page.js`

- Deleted `const [search, setSearch] = useState('')`.
- Simplified the `filtered = useMemo(...)`: removed the
  `if (search && !s.name.toLowerCase().includes(search.toLowerCase()))
  return false` line. Only `filterCat` filtering remains. Fisher-
  Yates shuffle preserved.
- Dependency array shrank from `[filterCat, search]` to
  `[filterCat]`.
- Deleted the `<input type="search">` (placeholder "Search sign
  name…") that sat below the category chip row.
- The `setSearch('')` call inside `onChange` handlers of category
  chips (`setFilterCat(...)`) was *not* present — those handlers
  only reset `idx`, `result`, `answer`. So no orphan `setSearch`
  calls to clean up.

### Not changed

- `useSearchParams` import in `app/practice/page.js` — that reads
  the `?mode=` URL query param (text / listen / speak), unrelated
  to the typed-search input. Left alone.
- Category and difficulty chip filters — kept as is on all three
  pages.
- "Review only" checkbox on Practice — kept (separate filter).
- Translation logic (`t`/`tt`/`mt` resolvers) — untouched.
- Shuffle behavior — Fisher-Yates still runs once per filter change,
  not per render.
- Drive page (`/drive`) and Mock page (`/mock`) — they didn't have a
  search input to begin with (verified by grep); untouched.
- Voice / TTS / scoring / recording flows — completely untouched.
- API routes — none changed.

### Verification

- `grep -n "search\|setSearch"` on the three files: only the
  unrelated `useSearchParams` / `searchParams.get('mode')` lines
  remain in `app/practice/page.js` (URL-param API, not the removed
  text-search state).
- `npx next build` → ✓ 18/18 routes generated. Bundle sizes:
  - `/practice` 8.29 → **8.11 kB** (-180 bytes: input + state +
    filter branch + 6 i18n strings removed)
  - `/signs` 2.59 → **2.46 kB** (-130 bytes)
  - `/terms` 28.9 → **28.7 kB** (-200 bytes)
- No TypeScript / lint errors. No runtime warnings about missing
  keys.

### Reversal

If the user wants the search inputs back:

```
git checkout HEAD~ -- app/practice/page.js app/terms/page.js app/signs/page.js
```

restores the search state, useMemo filters, input elements, and the
six per-language `search:` translation keys for each page.

### Suggested commit

```
git add app/practice/page.js app/terms/page.js app/signs/page.js doc/4claudelog6.md
git commit -m "Remove search-question/term/sign box from Practice (Listening + Speak + AI), Terms, and Signs pages"
git push origin main
```

---

## Action 64 — Enlarge English conversation lines in 问答翻译 (Q&A translation) card to match the selected-language explanation size

**Files changed:**
- `app/practice/page.js`

**Why:**
User: "enlarge the font size to match the same size as selective
language translation for speaking + AI Score/问答翻译 fields." After
clarification (the Q&A translated text was already `.92rem` —
already larger than the `.88rem` explanation body — so the visible
mismatch was the English-original italic subtitles at `.78rem`),
the user confirmed: "match the font size for English conversation
with selective language explanation in 问答翻译 field." So the
target is the English original subtitle lines, brought up to match
the 💬 Explanation card's body size.

### What changed

Two `<div>` style objects inside the Q&A translation card in
`app/practice/page.js`:

- The 👮 Officer question English subtitle (the italic muted line
  showing `q.officer_question_en` directly below the translated
  Chinese/Hindi/etc. version): `fontSize:'.78rem'` → `'.88rem'`,
  added `lineHeight:1.65`.
- The ✅ Answer English subtitle (italic muted line showing
  `q.simple_driver_answer_en` below the translated answer):
  `fontSize:'.78rem'` → `'.88rem'`, added `lineHeight:1.65`.

Both now match the body text of the 💬 selected-language
Explanation block (which uses `fontSize:'.88rem', lineHeight:1.65`)
that lives just above the Q&A translation card on the same screen.

### Not changed

- The translated text (`trans.q`, `trans.a`) — still `.92rem` /
  `lineHeight:1.55`. The user asked specifically about matching the
  English conversation lines, not flattening the whole hierarchy.
- Italic + muted color on the English subtitles — preserved. They
  still read as "the original" relative to the brighter `.ink`
  colored translated text above each.
- The 💬 Explanation block — untouched (it's the reference, not
  the target).
- Other size tokens in the card — `.7rem` UPPERCASE card label,
  `.68rem` per-side sub-labels (👮 Officer / ✅ Answer), `.62rem`
  language pill — all unchanged.
- Listening mode and AI-score mode UI — share the same render path
  (`{lang !== 'en' && ...}`), so the change benefits both modes
  automatically. No mode-specific code touched.

### Verification

- `npx next build` → ✓ 18/18 routes. `/practice` 8.11 kB unchanged
  (style-string churn fits in the same minified chunk).
- The English subtitles now sit at the same line-height and font
  size as the explanation paragraph above, so when a user reads
  💬 explanation → 🌐 Q&A translation back-to-back the secondary
  English lines no longer shrink visually.

### Reversal

`git checkout HEAD~ -- app/practice/page.js` restores the previous
`.78rem` italic subtitles (only practice page changed this
action).

### Suggested commit

```
git add app/practice/page.js doc/4claudelog6.md
git commit -m "Practice: enlarge English subtitle lines in Q&A translation card to .88rem to match selected-language explanation"
git push origin main
```

---

## Action 65 — Phone UI: move Prev/Next, Play Q, Start Recording to top bar as icon-only buttons; rename brand "CDL English Pro" → "ELP"

**Files changed:**
- `components/AppShell.js`
- `app/globals.css`
- `app/practice/page.js`

**Why:**
User: "in phone UI, move previous and next from current location to
top of screen next to name of CDL English pro, and only with symbols
without any text. Change name of CDL English pro, to ELP to make
more room for the symbols. add all other play questions, start
recording to the location, adjust the symbols size to fit into
single line on the top of screen for easy access, control."

The driver-mode is one-handed phone use. The Prev/Next bar and
Play/Record buttons were scattered across the question card,
forcing the user to scroll or thumb-reach. Putting all the
"action" buttons in a fixed top bar (sticky, always-visible)
gives one-tap access without scrolling, mirroring how playback
controls work on a music app.

### What changed

#### `components/AppShell.js`

- Brand title: `CDL English Pro` → `ELP`. Subtitle ("Not affiliated
  with DOT · FMCSA · CVSA") preserved — it auto-hides at ≤820px
  via the existing `.topbar-sub{display:none}` rule.
- New optional prop `topbarActions`. When passed, a new
  `<div className="topbar-page-actions">` slot renders between the
  brand and the right-side `.topbar-actions` (lang select + user
  + menu toggle). Pages not passing the prop render exactly as
  before — backwards compatible with `/drive`, `/mock`, `/signs`,
  `/terms`, `/report`.

#### `app/globals.css`

- New `.topbar-page-actions` flex row: `gap:6px`, `flex:1 1 auto`,
  `justify-content:center`, `overflow:hidden`. Centered so the
  controls feel like a media-player toolbar; clipped so a stray
  extra button can't push the lang selector off-screen.
- New `.tpa-btn`: 38×38 dark slate button, single emoji glyph
  (`font-size:1.05rem`), 8px radius, hover lightens, active scales
  to 0.94 for tactile feel, `:disabled` fades to 35% opacity. No
  text — pure icon target.
- `.tpa-btn.tpa-rec` variant: red (`#dc2626`) for the Stop-recording
  state, so the user sees recording at a glance.
- `@media (max-width: 600px)` block tuned for phone:
  - Topbar gap 12→8, padding 12→10 to claw back horizontal space.
  - `.topbar-brand` gap 10→6; `.topbar-logo` 1.5rem→1.25rem
    (still recognizable but tighter).
  - `.lang-select` shrunk: `padding:4px 6px`, `font-size:.72rem`,
    `max-width:64px`. Native `<select>` will truncate the visible
    label but the dropdown is still tappable.
  - `.tpa-btn` 38px→34px on phone, font 1.05rem→.95rem. With 4
    buttons + 4px gap that's ~152px — fits inside an iPhone 13
    Pro's 390px viewport even with the lang select + avatar
    + menu icon on the right.

#### `app/practice/page.js`

Built a `topbarActions` React fragment in `PracticeInner()` after
the early-return guard for `!q`, before the `<AppShell>` return.
Buttons in left-to-right order:

1. **⏮ Prev** → `goPrev`, disabled when `safeIdx === 0`.
2. **🔊 Play Q** → `unlockAudio(); if (autoPlayRef.current)
   stopAutoPlay(); speak(q.officer_question_en, mode === 'listen'
   ? listenRate : 1)`. The rate honors the Listen-mode speed chip
   selection; in Text/Speak modes it defaults to 1×. Stops any
   in-flight auto-play (same defensive behavior the in-page
   button had).
3. **🎤 Record / ⏹ Stop** (only when `mode === 'speak'`):
   toggles on `isRecording`. When recording, the button paints
   red via the `.tpa-rec` modifier and switches glyph to ⏹.
4. **⏭ Next** → `goNext`, disabled when at last index.

Each button has `aria-label` + `title` resolved through the
existing `tx()` i18n helper so screen readers / hover tooltips
still get the translated text ("Previous", "下一题", "🎤 Start
recording", etc.) — only the visible glyph is symbol-only.

Passed as `<AppShell ... topbarActions={topbarActions}>`. The
no-question early return path (line ~507) does NOT pass it —
correct, since there's no `q` to act on.

##### Removed (moved-to-top duplicates)

- The in-page Prev/Next bar that sat above the question card.
  Replaced with a tiny centered "N / total" position indicator
  so the user still knows where they are in the deck without
  losing the count.
- The 🔊 Play Q button in the listen-mode controls row. Speed
  chips (Slow/Normal/Fast) and the ▶ Play all / ⏸ Pause
  auto-play toggle stayed — those are mode-specific UI, not
  duplicated at the top.
- The standalone 🔊 Play Q button in text mode (post-Standard-
  Answer). Now reachable via the top bar.
- The idle-state Speak-mode rec-zone block (the centered "Tap to
  record your English answer" hint + Start Recording + Play Q).
  The `mode === 'speak'` section now only renders the rec-zone
  **while recording** (red dot + "Recording…" + waveform) — pure
  status display, no controls. The top-bar 🎤/⏹ button is the
  only recording trigger.

### Not changed

- Mock / Signs / Terms / Drive / Report / Home pages — they don't
  pass `topbarActions`, so their topbar shows ELP + lang + user
  + menu exactly as before.
- AppShell's mobile bottom tab bar (the 6-icon nav at the screen
  foot) — untouched. Navigation between pages is unchanged.
- Score result UI, textarea, "AI score" submit button, "Clear"
  button, pronunciation word-level breakdown, Q&A translation
  card, explanation card — all intact in-page.
- Officer-question text rendering, language selector, category /
  difficulty chips, Review-only toggle, badges — all preserved.
- `speak()`, `unlockAudio()`, `startRecording`, `stopRecording`,
  `goPrev`, `goNext` — implementations untouched; only the call
  sites changed.

### Why icon-only (with `title` + `aria-label`)

Per user request "only with symbols without any text" and "fit
into single line." A `<button>` with just an emoji renders the
glyph as accessible text (it's part of the button's content) —
so screen readers announce "Previous" because of `aria-label`,
and sighted-but-uncertain users get a tooltip on hover.
On touch devices there's no hover, but the four icons (⏮ 🔊 🎤
⏭) are universally familiar from audio/video transports.

### Verification

- `npx next build` → ✓ 18/18 routes. `/practice` 8.11 → **8.12 kB**
  (+10 bytes net: topbarActions JSX added, in-page Prev/Next bar +
  Play Q buttons + idle rec-zone removed). No type / lint errors.
- Manual visual check (Chrome devtools at 390px viewport):
  - ELP brand, ⏮ 🔊 ⏭ in listen/text mode, ⏮ 🔊 🎤 ⏭ in speak
    mode, lang select, avatar, ☰ menu — all fit on one row.
  - In speak mode while recording, the 🎤 button turns ⏹ red,
    and the in-page recording status block appears below the
    question.
- Other pages (`/mock`, `/signs`, `/terms`, `/drive`, `/report`)
  load with no console warnings and show the same ELP brand.

### Reversal

If the user wants the in-page controls back:

```
git checkout HEAD~ -- components/AppShell.js app/globals.css app/practice/page.js
```

restores "CDL English Pro" branding, deletes the topbar action
slot, and brings the Prev/Next bar, Play Q buttons, and idle
recording UI back to their original positions.

### Suggested commit

```
git add components/AppShell.js app/globals.css app/practice/page.js doc/4claudelog6.md
git commit -m "Phone UI: move Prev/Next/Play/Record to top bar as icon-only buttons; brand CDL English Pro → ELP"
git push origin main
```

---

## Action 66 — Restore desktop UI to its pre-Action-65 layout; keep Action 65's top-bar icons as phone-only

**Files changed:**
- `app/globals.css`
- `components/AppShell.js`
- `app/practice/page.js`

**Why:**
User: "All the last edit was only apply to phone UI. recover the
computer UI to the original layout before the last edit." Action 65
moved Prev/Next/Play/Record into the top bar and removed the
in-page versions wholesale — that was meant for phone ergonomics
only, but it also stripped the desktop layout the user prefers.

### What changed

#### `app/globals.css` — utility visibility classes + scope-narrow the top-bar action slot

- New `.hide-on-phone` (no-op above 600px, `display:none!important`
  at ≤600px) and `.hide-on-desktop` (`display:none!important` above
  600px, `display:revert!important` at ≤600px). `display:revert`
  restores whatever the element's default/inline display is, so
  flex / block / inline-flex layouts all resume cleanly when the
  class kicks in.
- `.topbar-page-actions` now `display:none` by default and only
  flips to `display:flex` inside the `@media(max-width:600px)`
  query. Effect: the icon-only action row is **invisible on
  desktop**, even when a page passes `topbarActions={...}`. Desktop
  topbars look exactly as they did before Action 65.

#### `components/AppShell.js` — dual brand title

- Replaced the single "ELP" text with two sibling spans inside
  `.topbar-title`:
  - `<span className="hide-on-phone">CDL English Pro</span>` →
    visible on desktop.
  - `<span className="hide-on-desktop">ELP</span>` → visible on
    phone.
- The CSS visibility utilities collapse the other span on each
  breakpoint, so only one renders at a time. No JS / media-query
  hook needed.
- The optional `topbarActions` prop still renders into
  `.topbar-page-actions`. Because that container is now
  display:none on desktop (see above), desktop users never see
  the icon row even though the React tree still contains it. No
  conditional rendering at the page level required.

#### `app/practice/page.js` — restore in-page Prev/Next, Play Q, idle rec-zone for desktop

Each removed-in-Action-65 element is re-added and tagged with
`hide-on-phone`. The phone-specific simplifications from Action 65
are kept and tagged `hide-on-desktop`:

- **Prev/Next bar above the question card**:
  - Desktop (restored, original styling): full `<div>` with
    Prev / "N / total" / Next buttons → marked `hide-on-phone`.
  - Phone (Action 65 simplification): centered "N / total" only →
    marked `hide-on-desktop`.
- **Listen-mode 🔊 Play Q button** (line ~598): restored as the
  first child of the `.flex-c mt-8` row, marked `hide-on-phone`.
  Speed chips and ▶ Play all / ⏸ Pause stay universal — they
  always rendered on both breakpoints.
- **Text-mode 🔊 Play Q button** (line ~617): restored, marked
  `hide-on-phone`.
- **Speak-mode `.rec-zone` block** (line ~720):
  - Full original `isRecording ? recording-UI : idle-UI` ternary
    restored.
  - Recording branch keeps the `.rec-dot` + "Recording…" +
    waveform always (status display still useful on phone), but
    the Stop button inside it is marked `hide-on-phone` (phone
    user taps the top-bar ⏹).
  - Idle branch (the "Tap to record" hint + Start Recording +
    Play Q) renders normally; the **wrapper** rec-zone div gets
    `hide-on-phone` appended to its className when not recording,
    so the dashed-border idle box disappears entirely on phone.
    Without this, an empty rec-zone box would still draw its
    dashed border on phone — ugly.

### Behavior matrix

| Element | Desktop (>600px) | Phone (≤600px) |
|---|---|---|
| Brand title | CDL English Pro | ELP |
| Topbar icon row | hidden | ⏮ 🔊 🎤/⏹ ⏭ shown |
| In-page Prev/Next bar | full bar | only "N / total" indicator |
| Listen Play Q button | shown | hidden (use top bar) |
| Text Play Q button | shown | hidden (use top bar) |
| Speak rec-zone (idle) | full idle UI | not rendered |
| Speak rec-zone (recording) | red dot + waveform + Stop | red dot + waveform only |
| Speak top-bar 🎤/⏹ | hidden | shown (in mode === 'speak') |

### Not changed

- Action 65's `topbarActions` plumbing (AppShell prop, the
  `<>⏮ 🔊 🎤/⏹ ⏭</>` JSX in practice page) — preserved verbatim.
  The CSS visibility flip does the desktop hiding, so no React
  state / page logic changes were needed.
- Phone-specific topbar polish from Action 65 (smaller .topbar
  padding/gap, smaller .topbar-logo, narrower .lang-select, 34×34
  .tpa-btn at ≤600px) — kept. Those rules live inside the existing
  `@media(max-width:600px)` block; they don't affect desktop.
- All Q&A translation, explanation, scoring, transcript, score
  result, badges, chips — untouched.
- Mock / Signs / Terms / Drive / Report — unchanged (they never
  passed `topbarActions`, so they render the same on both
  breakpoints, just with the brand-title toggle).

### Verification

- `npx next build` → ✓ 18/18 routes. `/practice` 8.12 → **8.32 kB**
  (+200 bytes for the duplicated in-page elements + visibility
  class strings). No type / lint errors.
- Desktop check (Chrome devtools at 1280px): topbar reads "CDL
  English Pro · Not affiliated with DOT · FMCSA · CVSA"; no icon
  row between brand and right-side controls; in-page Prev/Next
  bar, Play Q in listen/text modes, full Speak idle rec-zone all
  visible — matches the original layout.
- Phone check (375×667 viewport): topbar reads "ELP" + ⏮ 🔊 🎤
  (in speak mode) ⏭ + lang + avatar + menu; in-page Prev/Next bar
  hidden (only "N / total" centered indicator visible); in-page
  Play Q buttons hidden; idle rec-zone hidden when not recording;
  red-dot status visible when recording.

### Reversal

If the user later wants phone-only OR desktop-only behavior
again, the CSS utility classes are the swing point:

- To revert Action 66 (= apply Action 65 everywhere again):
  remove the `.hide-on-phone` / `.hide-on-desktop` rules and the
  `display:none` default on `.topbar-page-actions`. The in-page
  duplicates can be deleted by removing the elements tagged
  `hide-on-phone` in `app/practice/page.js`.
- To revert all the way (= original pre-65 desktop everywhere):
  ```
  git checkout HEAD~2 -- components/AppShell.js app/globals.css app/practice/page.js
  ```

### Suggested commit

```
git add components/AppShell.js app/globals.css app/practice/page.js doc/4claudelog6.md
git commit -m "Restore desktop UI to original layout; keep Action 65 top-bar icons as phone-only"
git push origin main
```

---

## Action 67 — Phone UI for Traffic Signs: add top-bar icon controls (Prev / Hear answer / Reveal answer / Next); desktop unchanged

**Files changed:**
- `app/signs/page.js`

**Why:**
User: "applied the same edit in phone UI for traffic signs category
with symbols on top of screen for previous, next, hear answer, and
reveal answer. this only apply to phone UI for traffic signs
section." Mirrors the Action-65/66 pattern (top-bar icon row on
phone, original layout on desktop) onto `/signs`.

### What changed

Single file: `app/signs/page.js`.

1. **Built `topbarActions` fragment** inside `SignsPage()` right
   after `scoreColor`. Four `.tpa-btn` icon buttons (the class
   defined in `app/globals.css` during Action 65):
   - **⏮ Prev** → `prev`, disabled at `idx === 0`. Same handler
     the in-page "← Prev" button uses.
   - **🔊 Hear answer** → `speakSignAnswer(\`This sign means
     ${sign.meaning}. As a driver, I should ${sign.action}.\`)`.
     Same string the in-page "🔊 Hear answer" green button uses,
     so audio is identical.
   - **👁 Reveal answer** → `setResult({ score: null, revealed:
     true })`. Same state mutation as the in-page "👁 Reveal
     Answer" button.
   - **⏭ Next** → `next`. The existing `next()` already wraps via
     `(i + 1) % filtered.length`, so it's never disabled (matches
     the in-page "Next Sign →" behavior).
   Each button has `aria-label` + `title` set to the English
   action name (Signs page is English-only for sign content, no
   `tt()` helper).

2. **Passed to AppShell**: `<AppShell ... topbarActions=
   {topbarActions}>` on the main return path. The no-signs early
   return (line 96) does NOT pass it — correct, no sign to
   act on.

3. **In-page Prev/Next bar** (above the textarea): split into
   two siblings.
   - Original `<div>` with "← Prev" / "X% complete" / "Next Sign
     →" → tagged `hide-on-phone`.
   - New `<div className="hide-on-desktop">` showing just the
     centered "X% complete" line, so phone users still see their
     progress without the redundant nav buttons.

4. **Actions row** (under the textarea):
   - "👁 Reveal Answer" button → added `hide-on-phone`. Phone user
     taps the top-bar 👁 instead.
   - "🔊 Hear answer" button → added `hide-on-phone`. Phone user
     taps the top-bar 🔊.
   - "✓ Check Answer" and "Clear" buttons → **kept on both**.
     Check Answer is the primary scoring action (essential
     in-page workflow), and Clear lives next to the textarea
     it's clearing. Not part of the user's "move to top" list.

### Behavior matrix

| Element | Desktop (>600px) | Phone (≤600px) |
|---|---|---|
| Top-bar icon row | hidden (CSS) | ⏮ 🔊 👁 ⏭ shown |
| In-page Prev/Next bar | full bar (← Prev / % / Next Sign →) | only "X% complete" indicator |
| Reveal Answer button | shown (in actions row) | hidden |
| Hear answer button | shown (in actions row) | hidden |
| Check Answer button | shown | shown |
| Clear button | shown | shown |
| Image / name / textarea / score result | shown | shown |

### Not changed

- Category chip filter, sign image rendering, progress bar,
  category badge, score badge — all unchanged.
- The `speakSignAnswer` TTS helper itself — same `north_m` voice,
  same fallback path. Top-bar 🔊 and in-page 🔊 call the same
  function with the same string.
- The "Check Answer" scoring flow (`scoreKeywords` + `/api/progress`
  POST) — untouched.
- The `result` panel (score ring, percentage bar, answer-block
  with Name / Meaning / Driver action / Explanation / Keywords) —
  untouched. Renders identically on both breakpoints.
- AppShell, globals.css, practice page, mock page, terms page —
  none touched. The `topbarActions` plumbing + `.hide-on-phone` /
  `.hide-on-desktop` utility classes were already in place from
  Actions 65–66; this action just wires `/signs` into them.

### Verification

- `npx next build` → ✓ 18/18 routes. `/signs` 2.46 → **2.66 kB**
  (+200 bytes for the topbarActions JSX + 4 icon-button blocks +
  the duplicated progress indicator). No type / lint errors.
- Desktop check (1280px): topbar still shows "CDL English Pro"
  brand with no icon row in the middle (the `.topbar-page-actions`
  container is `display:none` outside the ≤600px query). In-page
  Prev/Next bar visible, Reveal Answer + Hear answer buttons
  visible in the actions row — matches pre-Action-67 layout.
- Phone check (≤600px): topbar shows "ELP" + ⏮ 🔊 👁 ⏭ + lang +
  avatar + ☰. In-page Prev/Next bar hidden (only "X% complete"
  centered shown). Actions row reduced to "✓ Check Answer" +
  "Clear".

### Reversal

`git checkout HEAD~ -- app/signs/page.js` restores the previous
signs-page layout (no top-bar icons, full in-page controls on
both breakpoints).

### Suggested commit

```
git add app/signs/page.js doc/4claudelog6.md
git commit -m "Signs (phone UI only): add top-bar ⏮ 🔊 👁 ⏭ icon controls; desktop layout unchanged"
git push origin main
```

---

## Action 68 — Audit project content data and produce `data.md` summary

**Files changed:**
- `data.md` (new file at project root)

**Why:**
User: "fully check the project database and create a data.md showing
individually each section questionary, terms, conversations and other
related sections amount individually." A static inventory of all
shipped content so the user can see at a glance how many questions /
signs / terms / conversations / scenarios the app carries, broken
down by category, difficulty, language coverage, etc.

### What was audited

Read every static data source the app ships with:

- `data/questions.json` (329 KB) — officer Q&A bank
- `data/signs.json` (97 KB) — traffic-sign bank
- `lib/terms.js` (101 KB) — trucking terms + conversation pairs
- `lib/data.js` — exports, `SCENARIOS`, `Q_CATEGORIES`, etc.
- `app/mock/page.js → buildMock()` — composition logic for Mock
- `public/signs/` — image asset directory (84 PNGs)

Audit was done with `node -e "..."` one-liners (no new scripts
checked in) — required-keyword tallies, category histograms,
per-language coverage checks, training-mode tag counts.

### Key counts surfaced in `data.md`

- **140 questions** across 5 categories (Identity 30, Route/Cargo
  30, HOS/ELD 30, Vehicle 30, Accident 20) and 3 difficulties
  (Beginner 40, Intermediate 56, Mock Test 44). Every Q has
  explanations in all 5 non-English languages → **700 translated
  explanations**.
- **84 traffic signs** across 9 categories (Warning 26 is the
  largest, Regulatory/Hazmat 1 the smallest). 100% have PNG
  assets in `public/signs/`. Every sign has explanations in 5
  languages → **420 translated explanations**.
- **63 trucking terms** across 6 categories (Documents 19,
  Core ELD/HOS 12, HOS Concepts 12, Legal/Medical 12, PC/Yard 5,
  Inspection 3). Every term is fully translated and every term
  carries a 2-line conversation pair (`inspector` + `driver`)
  translated into all 5 languages → **315 translated term names
  + 315 translated conversation pairs (756 lines total across
  all 6 languages)**.
- **6 Drive Mode scenarios** defined in `lib/data.js`
  (`SCENARIOS`).
- **Mock Inspection** assembles 19 items per attempt: 14 Q
  (3-3-3-3-2 by category) + 5 random signs.

### Structure of `data.md`

8 numbered sections:

1. Officer Questions — totals, category, difficulty, grid,
   multilingual coverage, training-mode tags, scoring metadata,
   per-row schema.
2. Traffic Signs — same shape as Q but 9 sign categories.
3. Trucking Terms + Conversations — categories, term-name
   translations, English conversation count, `convTrans` per-lang
   coverage, combined totals, per-row schema.
4. Mock Inspection composition — buildMock plan, 19 items/run.
5. Drive Mode Scenarios — 6 scenarios with difficulty + source
   categories.
6. Languages supported — 6 UI languages and which content each
   covers.
7. Grand totals — single flat table of every aggregate count.
8. Where each section is rendered — URL routes + source files
   mapping.

### Not changed

- No code changes. `data.md` is pure documentation — does not
  affect bundle, build, or runtime.
- No data files (`*.json`, `lib/terms.js`) were modified.
- No new scripts checked in; the one-liner audit ran via `node
  -e` in the shell.

### Verification

- File saved at `/Users/jj/.../data.md` (project root, alongside
  the existing `terms.md` and `termsConvers.md` working notes).
- Spot-checked counts against the raw data:
  - `q.length === 140` ✓
  - `s.length === 84` ✓
  - `TERMS.length === 63` ✓
  - `SCENARIOS.length === 6` ✓
  - All `explanation_*` field-fill checks return n/n ✓
  - All `convTrans[lang]` checks return 63/63 ✓
- `npx next build` was **not** re-run for this action (no JS / CSS
  / config touched, only a new markdown file). Previous green
  build still applies.

### Refresh policy

`data.md` is a manual snapshot, dated `2026-05-27` at the top. If
the question/sign/term banks grow, re-run the audit and update.
The structure is stable, so an LLM can refresh the numbers by
re-running the same Node.js inspection one-liners.

### Suggested commit

```
git add data.md doc/4claudelog6.md
git commit -m "doc: add data.md content inventory (questions / signs / terms / conversations / scenarios)"
git push origin main
```
