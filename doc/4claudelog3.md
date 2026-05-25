# CDL English Pro — Claude Action Log (Part 3)

> Continuation of `doc/4claudelog2.md` (Sessions 17–22, Actions 36–44).
> Original files split at the 800-line cap per `CLAUDE.md` log-rotation rule.
> Reference: `doc/2gptimprove.md`, `doc/Vercerror_Soluti.md`
> Guidelines: `doc/CLAUDE.md`, `./AGENTS.md`

---

## Session 23 — Voice-answer on signs (2026-05-25)

### Action 45 — Traffic Signs: add "Hear answer" voice button

**Request:** User asked to add the same voice-answer function from Drive Mode
(Action 44) to the Traffic Signs page's "Your English answer" area, so drivers
can hear the model answer in a real human voice and repeat for practice.

**File modified:** `app/signs/page.js`

**Changes:**

1. **Added a local TTS helper at module scope** (top of file, after imports,
   before `export default function SignsPage()`):

   - `let currentSignAudio = null` — module-level reference so concurrent
     clicks cancel the previous playback.
   - `async function speakSignAnswer(text)`:
     - Pauses any existing `currentSignAudio` and cancels any in-flight
       `window.speechSynthesis` utterances first (defensive — both can be
       live if the user has clicked Hear-answer then opened the browser
       voice synthesis elsewhere).
     - POSTs to `/api/speak` with `voiceId: 'north_m', speed: 0.95` —
       matches the voice/speed used by `app/mock/page.js`'s `speakText`.
     - On success: creates an `Audio` object from the returned blob URL,
       wires `onended` / `onerror` to revoke the URL + clear the module
       ref, then `.play()`.
     - On API failure: falls back to `window.speechSynthesis` with
       `lang: 'en-US', rate: 0.95`. Same fallback pattern as the other
       pages' TTS helpers.

   Yes, this is a duplicate of the `speakText` helper in
   `app/mock/page.js`. Extracting to a shared `lib/tts.js` was considered
   but skipped — the guideline is "Don't refactor things that aren't
   broken." Three pages each carry their own TTS helper today
   (practice/mock/drive); adding signs to that list is the surgical move.
   If a fourth or fifth caller appears later, lifting all of them to a
   shared module becomes worth the churn.

2. **Added a third button** to the existing `.actions` row (between
   "👁 Reveal Answer" and "Clear"):
   - `<button className="btn btn-success btn-sm" onClick={() =>
     speakSignAnswer(\`This sign means ${sign.meaning}. As a driver, I
     should ${sign.action}.\`)}>🔊 Hear answer</button>`
   - Green `btn-success` styling matches the Drive Mode's "Hear answer"
     button from Action 44 — visual consistency across pages.
   - The text passed to TTS is constructed live from `sign.meaning` and
     `sign.action`. This is the same template used as the textarea
     placeholder at line 93, so what the user hears is exactly the
     "model answer" the placeholder is suggesting they type/say.

**Design notes:**

- **Page-level i18n:** `app/signs/page.js` doesn't carry a per-page
  translation table (unlike practice/mock/drive). All inline labels here
  are English. The new button label "🔊 Hear answer" stays in English to
  match. Translating this page's surface text is a separate, larger
  task — out of scope for this request.
- **Voice choice:** `north_m` is reused (the standard "narrator" voice).
  The signs page has no per-user voice selection (no Drive-Mode-style
  voice catalog), so picking one universal voice is correct.
- **English-only model-answer audio:** even when the UI language is
  Chinese / Spanish / etc., the model answer is voiced in English. That
  matches the user's stated purpose ("so driver can repeat and practice"
  English answers for an English roadside inspection).

**Not changed:**

- `lib/data.js`, `/api/speak`, voice catalog, or any other page.
- The signs page's i18n stays as-is — only the new button was added.
- The existing 3 action buttons (Check / Reveal / Clear) and their
  styling unchanged.
- `next/prev` paging unchanged.

**Verification:**

- `npx next build` → ✓ All 16 routes built. `/signs` 2.05 → 2.34 kB
  (+0.29 kB for the TTS helper + button JSX).
- Manual flow:
  - Open `/signs` → choose any sign → row shows 4 buttons
    (Check / Reveal / **🔊 Hear answer** / Clear).
  - Click Hear answer → the constructed sentence "This sign means X.
    As a driver, I should Y." plays in `north_m` voice via OpenAI TTS.
  - Click rapidly: previous audio cancels, latest plays — no overlap.

**Reversal:**

- `git checkout HEAD~ -- app/signs/page.js` removes the helper and the
  new button.

---

## Session 24 — Drive Mode Prev/Next nav (2026-05-25)

### Action 46 — Drive conversation: add Previous / Next buttons

**Request:** User asked to add Previous and Next buttons under Drive
Mode (and all scenarios) pages. Clarified via AskUserQuestion → user
chose "Drive conversation phase" (skip between the 8 generated
questions without recording, mirroring the mock page's Prev/Next).

**File modified:** `app/drive/page.js`

**Changes:**

1. **i18n keys** — added `prev` / `next` to all 7 language tables in
   the `DT` object. Reused the exact strings already shipped on
   `app/mock/page.js` lines 53/84/115/146/177/208 so the two pages
   stay visually consistent:
   - en: `'← Previous'` / `'Next →'`
   - zh: `'← 上一题'` / `'下一题 →'`
   - es: `'← Anterior'` / `'Siguiente →'`
   - hi: `'← पिछला'` / `'अगला →'`
   - pa: `'← ਪਿਛਲਾ'` / `'ਅਗਲਾ →'`
   - vi: `'← Trước'` / `'Tiếp theo →'`

2. **New helper** `gotoQuestion(idx)` (added directly under
   `askQuestion`):
   - Bounds-checks `idx` against `questionsRef.current.length`.
   - Stops any in-flight `audioRef.current` and cancels the browser
     `speechSynthesis` queue — same defensive pattern as
     `stopDrivePreview` / `stopAutoConv`.
   - Sets `qIdx` and calls `speak(...)` so the user hears the
     newly-selected question immediately.
   - Intentionally does **not** push to `convHistory`. The
     conversation thread is chronological by design (driver answer
     gets appended after each recording); duplicating officer lines
     on every nav click would clutter the thread. The card at the
     bottom of the page is what shows the "current" question.

3. **Prev / Next button row** — inserted into the existing
   `!isAutoConv && driverState === 'idle'` controls card, **above**
   the Tap-to-record action row. Mirrors the layout in
   `app/mock/page.js:618-626` (justify-space-between row, btn-sm,
   disabled at boundaries):
   ```jsx
   <div className="flex-c" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
     <button className="btn btn-sm" onClick={() => gotoQuestion(qIdx - 1)} disabled={qIdx === 0}>
       {dt(lang, 'prev')}
     </button>
     <button className="btn btn-sm" onClick={() => gotoQuestion(qIdx + 1)} disabled={qIdx >= questions.length - 1}>
       {dt(lang, 'next')}
     </button>
   </div>
   ```
   - Disabled state at the boundaries (`qIdx === 0` for prev,
     `qIdx >= questions.length - 1` for next). The very last
     question's "Next" stays disabled — to advance past it the user
     records (which triggers `scoreAndAdvance` → result phase) or
     uses "End session."

**Design notes:**

- **Visible only when idle.** The row sits inside the same conditional
  as Tap-to-record, so it disappears during `speaking` / `listening` /
  `processing` and during auto-loop. That avoids racing with audio
  playback or active recording.
- **Why not also in the scenario picker?** The user explicitly chose
  "Drive conversation phase" via AskUserQuestion. The scenario grid
  has only 4-6 cards and fits on screen — no pagination needed.
- **Conversation thread retention.** Pressing Prev does not roll back
  `convHistory` — the user's previously-scored answers stay visible.
  This is intentional: if the user moves back to review a question,
  they still want to see what they already said.

**Not changed:**

- `convHistory` mutation logic, `askQuestion`, `scoreAndAdvance`, or
  any other navigation path.
- The scenario selection grid, voice picker, auto-loop card, result
  card, and `End session` button — all untouched.
- No other page modified. Helper isolated to drive page.

**Verification:**

- `npx next build` → ✓ 16/16 routes compiled. `/drive` 8.43 → 8.69 kB
  (+0.26 kB — 7 translation pairs + helper + button row JSX).
- Manual flow:
  - `/drive` → pick voice → pick scenario → Start.
  - Idle card now shows `← Previous` and `Next →` row above the
    Tap-to-record button.
  - Prev disabled on Q1, Next disabled on Q8 (boundary check works).
  - Clicking Next at Q3 → officer reads Q4 in selected voice, qIdx
    advances, conv thread unchanged (no duplicate Q4 prepended).
  - Clicking Prev → previous question replays. Audio of any
    currently-playing question is cut cleanly.
  - In all 7 languages the button text updates correctly via `dt()`.

**Reversal:**

- `git checkout HEAD~ -- app/drive/page.js` reverts the i18n keys,
  helper, and button row.
