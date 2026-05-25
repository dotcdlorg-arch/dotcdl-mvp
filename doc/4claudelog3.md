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
