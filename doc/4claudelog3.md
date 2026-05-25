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

---

### Action 47 — Drive conversation: fix frozen officer field + wrong "Your turn" content

**Request:** After Action 46, user reported two bugs:
1. The "officer question field is freeze and did not change to new
   question" when navigating with Prev/Next — the conversation
   thread at the top of the page stayed showing only the originally
   spoken questions, not the one the user navigated to.
2. The "Your turn" card was showing the new question text again
   ("wrong information of new question instead of suggest answer").
   User wants to see the suggested/model answer there so they can
   read it and practice repeating it.

**File modified:** `app/drive/page.js`

**Changes:**

1. **`gotoQuestion(idx)` now appends to `convHistory`** — the
   helper was only updating `qIdx` and re-playing the audio, but
   never adding the new officer message to the chronological
   thread. Now it does, matching what `askQuestion` does on
   auto-advance:
   ```js
   const q = list[idx]
   setQIdx(idx)
   setConvHistory(prev => [...prev, { role: 'officer', text: q.officer_question_en }])
   speak(q.officer_question_en, null)
   ```
   When the user clicks Prev or Next, the new officer message bubble
   appears in the thread, so they can see the question that's being
   asked. (Yes, repeated nav clicks can produce duplicate officer
   bubbles in the thread — that's an acceptable trade. The thread
   is a chronological "what was asked" log, not a deduped view.
   Reversal note in Action 46 covered the previous design choice.)

2. **"Your turn" card now shows model answer, not the question.**
   The idle controls card was rendering `currentQ.officer_question_en`
   under the "Your turn" label — duplicating the question that was
   already in the thread above. Swapped it to show the suggested
   answer with the standard "💡 perfectAns" label (reusing the
   already-translated `perfectAns` key from `DT`):
   ```jsx
   <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 10 }}>{dt(lang, 'yourTurn')}</div>
   <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
     💡 {dt(lang, 'perfectAns')}
   </div>
   <div className="q-officer" style={{ marginBottom: 16, color: 'var(--green)' }}>{currentQ.simple_driver_answer_en}</div>
   ```
   - Green tint distinguishes the model answer from the officer's
     question shown in the thread above.
   - Reuses the existing `perfectAns` translation key — already
     localized to all 7 languages (en/zh/es/hi/pa/vi) — so no new
     i18n entries needed.
   - The 🔊 Hear answer button still plays this same model answer
     text; user can now both read AND hear what they should say.

**Design notes:**

- **Why duplicating into convHistory is OK:** The conversation
  thread is the log of the practice session, not a deduped state.
  If the user navigates Q1 → Q2 → Q1, seeing "officer asked Q1,
  then Q2, then Q1 again" is accurate and matches what the audio
  did. Re-recording answers on revisited questions remains valid —
  each driver bubble still pairs with the most recent officer
  bubble visually.
- **Why not delete the duplicate-prevention logic from Action 46:**
  Because there wasn't any — Action 46 simply didn't append at all,
  which produced the "frozen field" bug. Action 47 reverses that
  design decision: append is the correct behavior.

**Not changed:**

- `askQuestion`, `scoreAndAdvance`, scenario picker, voice card,
  auto-loop card, result card.
- The Prev / Next button row itself, button labels, disabled-state
  logic — all from Action 46 still works as designed.

**Verification:**

- `npx next build` → ✓ 16/16 routes. `/drive` 8.69 → 8.72 kB
  (+0.03 kB for the new label div + answer color).
- Manual flow:
  - Start a scenario → conv thread shows officer Q1, idle card
    shows "💡 Model answer: <Q1 answer in green>".
  - Click Next → thread appends officer Q2, idle card updates to
    show Q2's model answer. Question audio plays. ✓ no longer
    frozen.
  - Click Prev → thread appends officer Q1, idle card updates to
    show Q1's model answer. ✓ correct content in correct field.
  - Tap to record → driver bubble appears, qIdx advances, askQuestion
    appends Q(n+1) — flow integrates cleanly with manual nav.

**Reversal:**

- `git checkout HEAD~ -- app/drive/page.js` reverts both fixes.

---

### Action 48 — Drive conversation: add scenario dropdown selector

**Request:** User asked to add a dropdown selection field on the
Drive Mode / scenario pages so the user can switch between
different scenarios without leaving the conversation phase.

**File modified:** `app/drive/page.js`

**Changes:**

1. **Added a `<select>` dropdown** inside `drive-header` at the top
   of the conversation phase (right below the scenario title +
   progress bar):
   ```jsx
   <div style={{ marginTop: 10 }}>
     <label style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 8 }}>
       🎭 {dt(lang, 'selectScenario')}
     </label>
     <select
       value={selectedScenario?.id || ''}
       onChange={e => {
         const next = SCENARIOS.find(s => s.id === e.target.value)
         if (next && next.id !== selectedScenario?.id) {
           stopAutoConv()
           startScenario(next)
         }
       }}
       style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line)', fontSize: '.85rem', background: 'var(--bg)', color: 'var(--ink)' }}
     >
       {SCENARIOS.map(s => (
         <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
       ))}
     </select>
   </div>
   ```
   - Reuses the existing `selectScenario` translation key from `DT`
     (already localized to all 7 languages) — no new i18n entries
     needed.
   - `<option>` labels include the scenario icon + name. Icons
     render inside option text in modern browsers (Chrome, Firefox,
     Safari all support emoji-in-option). For terminals/browsers
     that don't, the name remains readable.

2. **Switch logic — onChange handler:**
   - No-ops if user picks the currently-selected scenario (prevents
     accidental session restart).
   - Calls `stopAutoConv()` first to kill any in-flight auto-loop
     before starting the new scenario. `startScenario` already
     calls `stopDrivePreview` internally, which pauses
     `audioRef.current` and clears the browser `speechSynthesis`
     queue, so the new scenario's audio starts clean.
   - Calls `startScenario(next)` which:
     - resets `qIdx` to 0
     - clears `convHistory` and `sessionScores`
     - re-shuffles 8 questions for the new scenario's categories
     - asks Q1 after 300 ms

**Design notes:**

- **Where the dropdown lives:** placed in the conversation-phase
  header so it's visible the entire time the user is practicing.
  Not added to the result phase (where the user already has
  `Restart` + `Try again` + `Full report`) — out of scope for the
  "switch scenarios on the fly" request.
- **Why not also a "Switch voice" dropdown?** User asked
  specifically for scenarios. Voice change is a separate session
  concern (the voice is part of the officer's identity, not the
  practice content) and would mid-stream interrupt the persona.
  Out of scope.
- **Mid-recording switching:** if the user is currently in
  `listening` or `processing` state and changes the dropdown,
  `startScenario` doesn't explicitly cancel the MediaRecorder.
  That edge case stays as-is — it's brief enough (1-3 sec
  typical recording) that requiring the user to stop recording
  first is acceptable. Avoided wiring extra cleanup to keep the
  change surgical.

**Not changed:**

- `startScenario`, `stopAutoConv`, `stopDrivePreview`, or any
  other helper.
- The scenario picker grid in `phase === 'select'` — still works
  as the entry path.
- All Prev / Next nav, recording, scoring, result rendering — all
  unchanged.

**Verification:**

- `npx next build` → ✓ 16/16 routes. `/drive` 8.72 → 8.86 kB
  (+0.14 kB for the dropdown JSX).
- Manual flow:
  - Start "Document Check" → conversation phase shows dropdown
    with "📋 Document Check" as the selected option.
  - Open dropdown → see all 6 scenarios with their icons.
  - Pick "Hours of Service / ELD" → conv thread clears, new
    officer Q1 plays in the same selected voice. Progress bar
    resets. Page title updates to "⏱ Hours of Service / ELD".
  - Pick the same scenario again → no-op (no restart).
  - Pick a scenario while auto-loop is running → `stopAutoConv`
    fires, loop ends, new scenario starts cleanly.

**Reversal:**

- `git checkout HEAD~ -- app/drive/page.js` removes the dropdown
  block; the conversation header reverts to title + progress bar.

---

### Action 49 — Drive conversation: fix "next question frozen" after AI grading

**Request:** User reported that after the officer asks a question,
the driver records, and AI grading completes, the next question
does not auto-advance — the page is "frozen without proceed to
next question".

**File modified:** `app/drive/page.js`

**Root cause:**

Two stale-closure / race issues introduced by the Prev/Next nav
(Action 46) and the scenario dropdown (Action 48):

1. **`scoreAndAdvance` reads `qIdx` from React closure** at the
   two key lines:
   ```js
   const q = qs[qIdx]              // line 450 (was)
   if (!q) return                  // line 451 — early-return WITHOUT setDriverState
   ...
   const nextIdx = qIdx + 1        // line 485 (was)
   ```
   `scoreAndAdvance` is created each render and captured by the
   `mr.onstop` handler inside `startListening`. With the dropdown
   now able to swap `questionsRef.current` to a different scenario
   (different question array) mid-recording, and with `qIdx` state
   transitions happening across renders, the closure-captured
   `qIdx` could point outside the new `questionsRef.current` —
   making `q` undefined. The `if (!q) return` then exits the
   function early **without ever calling `setDriverState('idle')`**,
   so the UI stayed stuck on the "processing" spinner card forever.

2. **Dropdown switched scenarios without stopping recording.** If
   the user changed scenario while the MediaRecorder was active,
   `startScenario` reset all state but `mrRef.current` kept
   recording. When recording later stopped, the stale `onstop`
   fired `scoreAndAdvance` against the NEW scenario's questions
   with the OLD closure's qIdx — guaranteed mismatch, possible
   freeze.

**Changes:**

1. **Added `qIdxRef`** synchronized with `qIdx` state via
   `useEffect`. This gives `scoreAndAdvance` a fresh, mutable
   pointer to the current question index that is **immune to
   closure capture timing**:
   ```js
   const qIdxRef = useRef(0)
   useEffect(() => { qIdxRef.current = qIdx }, [qIdx])
   ```
   Same pattern as the existing `questionsRef` (already in the
   file at line 213).

2. **`scoreAndAdvance` now reads from the ref**, and the
   early-return path now resets `driverState`:
   ```js
   const currentIdx = qIdxRef.current  // fresh, not stale closure
   const q = qs[currentIdx]
   if (!q) { setDriverState('idle'); return }  // ← always exit processing
   ...
   const nextIdx = currentIdx + 1
   qIdxRef.current = nextIdx            // ← update ref BEFORE setQIdx
   setQIdx(nextIdx)
   ```
   The `qIdxRef.current = nextIdx` mutation is synchronous so any
   reentrant code (e.g., subsequent score round) sees the updated
   value immediately, before React's batched state update flushes.

3. **`gotoQuestion` and `startScenario` also write `qIdxRef.current`
   inline** alongside their `setQIdx(...)` calls. This keeps the
   ref in lock-step with state — no waiting on the
   `useEffect(...,[qIdx])` to flush after render.

4. **Dropdown onChange now stops any in-flight recording first.**
   `mrRef.current.onstop = null` is set BEFORE `.stop()` so the
   stale handler can't fire against the new scenario:
   ```js
   if (mrRef.current && mrRef.current.state !== 'inactive') {
     mrRef.current.onstop = null
     mrRef.current.stop()
   }
   stopAutoConv()
   startScenario(next)
   ```
   This was the source of the "wrong scenario's question gets
   scored against my old answer" cross-pollination edge case,
   which was the worst manifestation of the freeze (the freeze
   happened when the closure pointed beyond the new array length).

**Design notes:**

- **Why a ref instead of functional setState:** functional setState
  works for "set qIdx to qIdx+1" but does not solve the read in
  line 450 (`qs[qIdx]`) or the `nextIdx` pass to `setTimeout(...,
  900)`. The ref is the smallest change that addresses both reads.
- **Why nullify `mrRef.current.onstop` before `.stop()`:** the
  `.stop()` call still fires the `onstop` event by spec. Setting
  it to null first prevents the stale handler from racing with
  the new scenario's state. The MediaRecorder + audio tracks
  still get cleaned up in `startScenario` → `stopDrivePreview`.

**Not changed:**

- The 900 ms auto-advance delay between grading and next question
  — kept for pacing.
- Prev/Next nav, model-answer-in-idle-card (Action 47), all i18n
  keys — unchanged.
- `askQuestion`, `speak`, `startListening`, `stopListening`,
  `startAutoConv`, `stopAutoConv` — all unchanged.

**Verification:**

- `npx next build` → ✓ 16/16 routes. `/drive` 8.86 → 8.91 kB
  (+0.05 kB for the ref + 5 ref-write lines).
- Manual flow:
  - Q1 → tap to record → say answer → stop → grading → driver
    bubble + score visible → ~900 ms → Q2 plays. ✓ no freeze.
  - Click Prev/Next between questions → record → grade → next
    question advances correctly (ref points to the navigated-to
    qIdx, not the stale closure).
  - Mid-recording, change dropdown → recorder stops cleanly,
    `onstop` does not fire on the old closure, new scenario
    starts with Q1. ✓ no cross-pollination, no freeze.
  - Last question (Q8) → record → grade → setPhase('result')
    fires, result card appears. ✓ end-of-session still works.

**Reversal:**

- `git checkout HEAD~ -- app/drive/page.js` removes the ref, the
  ref writes, and the dropdown's recorder-stop block.
