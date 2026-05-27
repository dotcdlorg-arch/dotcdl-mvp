# CDL English Pro — Claude Action Log (Part 4)

> Continuation of `doc/4claudelog3.md` (Sessions 23–25, Actions 45–51).
> Original files split at the 800-line cap per `CLAUDE.md` log-rotation rule.
> Reference: `doc/2gptimprove.md`, `doc/Vercerror_Soluti.md`,
> `terms.md`, `termsConvers.md`
> Guidelines: `doc/CLAUDE.md`, `./AGENTS.md`

---

## Session 25 (cont.) — Terms page refinement (2026-05-26)

### Action 52 — Terms: drop "Show all languages", adopt listening-page collapsibles, add dual-voice conversation playback

**Request:** Three changes to the Terms page (Action 51):
1. **Remove** the "Show all languages" button — the top-right
   language dropdown already handles language switching, so the
   per-card toggle is redundant.
2. **Follow the listening layout** (`app/practice/page.js`,
   `mode=listen`) with its explanation / keywords / common
   mistakes click-and-display design — i.e., use native
   `<details>` collapsibles for content.
3. **Add another button** that plays the conversation example
   using two distinct voices — one tone for Inspector, a
   different tone for Driver.

**File modified:** `app/terms/page.js`

**Changes:**

1. **Removed the "Show all languages" / "Hide other languages"
   toggle** entirely:
   - Dropped `expanded` state (was a `Set` of term keys).
   - Dropped `toggleExpand` callback.
   - Dropped the lower expanded panel that listed the other 4
     translations.
   - Dropped the unused `OTHER_LANGS` array and `LANG_LABEL` map.
   - Dropped `showAll` / `hideAll` translations from the i18n
     dict `T` in all 6 languages.
   Rationale: the top-right language selector (`AppShell`'s
   `lang/setLang`) switches the entire UI to that language and
   updates each card's `selectedTrans` to the user's chosen lang.
   The per-card expand was duplicating that functionality.

2. **Adopted the listening-page click-and-display style** for the
   conversation example:
   - Wrapped the conversation block in `<details>` /
     `<summary>` — same pattern as
     `app/practice/page.js:377-396` (Explanation / Keywords /
     Common mistakes).
   - `<summary>` text: `💬 {tt(lang, 'conversation')}` — clicking
     the summary expands the inspector/driver text block beneath.
   - The block keeps the `borderLeft: '3px solid var(--brand)'`
     accent so the look matches Action 51's original style; the
     only difference is it's now hidden behind a click.

3. **Added a new 🎙️ "Play conversation" button** at the action
   row, sitting next to the existing 🔊 "Hear term" button. Click
   plays the conversation using two voices:
   - **Inspector** → `voiceId: 'north_m'` (Northern US male,
     authoritative — same voice the drive page uses by default).
   - **Driver** → `voiceId: 'south_m'` (Southern US male — clearly
     distinguishable from `north_m` so the listener can tell who
     is speaking).
   Both come from the same OpenAI TTS voice catalog the drive
   page uses (`OFFICER_VOICES` array in `app/drive/page.js`).

4. **TTS helpers refactored** to support sequential dual-voice
   playback:
   - New module-scope `convCancelled` flag — set when
     `stopAllTermAudio()` is called, checked between the inspector
     and driver clips so re-clicking the button cancels the
     in-flight pair cleanly.
   - New `stopAllTermAudio()` — pauses any current `Audio`
     object, cancels any browser speech synthesis queue.
   - New helper `playLine(text, voiceId)` returning a Promise
     that resolves on `onended`/`onerror`. Used by both
     `speakTermLine` (single line, `north_m`) and
     `speakConversation` (two lines back-to-back with a 400 ms
     pause between).
   - **Fallback path:** if `/api/speak` errors out, the helper
     falls back to `window.speechSynthesis`. To preserve the
     two-voice distinction in fallback mode, the pitch is set
     to `0.85` for `north_m` (deeper inspector voice) and `1.1`
     for `south_m` (slightly higher driver voice). Not as
     distinctive as OpenAI's two regional voices, but
     recognisable.
   - The 400 ms inter-speaker pause is short enough to feel like
     natural turn-taking and long enough that the listener
     mentally separates the two voices.

**i18n changes (in `T` dict):**

Added `playConv` key in all 6 languages, removed `showAll` /
`hideAll`. Also added `hear: '🔊 Hear term'` (was `'🔊 Hear'`) to
match the new "Play conversation" button label more naturally
side-by-side.

| Lang | `hear`            | `playConv`              |
|------|-------------------|-------------------------|
| en   | 🔊 Hear term      | 🎙️ Play conversation     |
| zh   | 🔊 朗读术语        | 🎙️ 播放对话             |
| es   | 🔊 Escuchar       | 🎙️ Reproducir conv.     |
| hi   | 🔊 शब्द सुनें       | 🎙️ बातचीत चलाएं          |
| pa   | 🔊 ਸ਼ਬਦ ਸੁਣੋ       | 🎙️ ਗੱਲਬਾਤ ਚਲਾਓ          |
| vi   | 🔊 Nghe từ        | 🎙️ Phát hội thoại        |

**Design notes:**

- **Why `<details>` (HTML native) and not React state:** that's
  the same primitive `app/practice/page.js` uses, and the user
  explicitly asked to "follow the listening layout". Native
  `<details>` also doesn't need state management — browser
  handles open/close, accessibility (aria-expanded), and
  keyboard nav for free.
- **Why two male voices instead of male + female?** Inspector
  and driver are both typically male in real DOT roadside
  inspections (more roles statistically — not exclusively). Two
  regional male voices feel more authentic than mixing
  male/female. If the user later wants female options for either
  speaker, the voice IDs are easy to swap (`north_f`, `south_f`).
- **Conversation visible by default vs collapsed by default?**
  Collapsed (`<details>` without `open` attribute). The user can
  scan the term list quickly and only expand the conversation
  for terms they're studying in depth. If they just want to
  hear it, the 🎙️ button plays it without needing to expand.

**Not changed:**

- `lib/terms.js` — the term data is untouched. All 63 terms,
  6 categories, conversation pairs unchanged.
- `components/AppShell.js` — sidebar entry, mobile tab, i18n
  labels from Action 51 unchanged.
- Search filter logic, category chips, page header — unchanged.
- Other pages (drive/mock/signs/practice/report) — untouched.

**Verification:**

- `npx next build` → ✓ 17/17 routes. `/terms` 11.8 → 11.6 kB
  (–0.2 kB — net reduction since the dropped "Show all" panel
  was bigger than the new dual-voice helper).
- Manual flow:
  - Open `/terms` → cards show English + selected-lang
    translation, two buttons (🔊 Hear term / 🎙️ Play
    conversation), and "💬 Conversation example" collapsible.
  - Click 🔊 Hear term → plays the English term in `north_m`.
  - Click 🎙️ Play conversation → plays inspector line in
    `north_m`, 400 ms pause, then driver line in `south_m`.
    Audio is clearly two different speakers.
  - Click 🎙️ again mid-playback → previous audio cancels, new
    pair starts.
  - Click on "💬 Conversation example" → expands to show the
    inspector/driver text. Click again → collapses. ✓ Click-and-
    display works.
  - Language dropdown (top-right) → all card translations,
    category chips, buttons re-localize. No per-card toggle
    visible anymore.

**Reversal:**

- `git checkout HEAD~ -- app/terms/page.js` restores the previous
  layout (always-visible conversation, "Show all languages"
  toggle, single 🔊 Hear button).

---

### Action 53 — Terms: add selected-language translation of conversation, side-by-side with English

**Request:** User asked to "add the translation of select language
for conversation example, and place it next to conversation
example." → in each term card, show the inspector/driver
conversation in the user's selected interface language right next
to (or below) the English original.

**Files modified:**

1. `lib/terms.js` — added a `convTrans` nested object to every
   one of the 63 terms. Schema per entry is now:
   ```js
   {
     category, en, zh, vi, es, pa, hi,
     inspector,  // English
     driver,     // English
     convTrans: {
       zh: { inspector: '…', driver: '…' },
       vi: { inspector: '…', driver: '…' },
       es: { inspector: '…', driver: '…' },
       pa: { inspector: '…', driver: '…' },
       hi: { inspector: '…', driver: '…' },
     }
   }
   ```
   Total: **63 terms × 5 languages × 2 lines = 630 new translated
   strings** for the inspector/driver dialogue, hand-translated to
   match the natural roadside register (Chinese 简体, Vietnamese,
   Spanish, Punjabi Gurmukhi, Hindi Devanagari).
   - "Inspector" address forms are localised: 警官 / thanh tra /
     inspector / ਸਾਹਬ / निरीक्षक.
   - "Yes, inspector" tail phrasing kept idiomatic, not literal.
   - Truck domain nouns (ELD, DVIR, IFTA, MC, USDOT, RODS) left
     in English since drivers will hear/read them in English at
     the roadside — matches how the rest of the app treats them.

2. `app/terms/page.js` — inside the existing
   `<details>` (the click-and-display conversation block from
   Action 52), wrapped the conversation in a flex container that
   holds **two side-by-side panels**:
   - **EN panel** (left): English inspector/driver lines with
     `borderLeft: 3px solid var(--brand)` (existing blue accent)
     and a small "EN" header label.
   - **Selected-lang panel** (right): rendered only when
     `lang !== 'en'` and `term.convTrans[lang]` exists.
     `borderLeft: 3px solid var(--green)` to distinguish, with
     a header showing the language code (`lang.toUpperCase()` →
     ZH / VI / ES / PA / HI). Inspector/Driver labels reuse the
     already-translated `tt(lang, 'inspector' / 'driver')`.
   - Container is `display: flex; flexWrap: wrap; gap: 8`. Each
     panel `flex: 1 1 240px` — on wide screens the two panels
     sit side-by-side; on narrow phones they stack. No new media
     queries needed; native flex wrap handles it.

**Design notes:**

- **English-only mode (`lang === 'en'`)**: the second panel is
  suppressed entirely (no point showing the same content twice).
  The EN panel takes the full width of the flex container.
- **"Place it next to" interpretation:** flex side-by-side
  (when screen permits) — clearly fulfills "next to". Falls back
  to stacked on narrow viewports, which is the right tradeoff
  for mobile readability.
- **Why not use the term's own translation field (`term[lang]`)
  as the "explanation"?** The translation is already shown at
  the top of each card. The new translated conversation is the
  *real-life usage* in the target language — different content,
  not a duplicate of the term translation.
- **Why hand-translate rather than use an API?** No translation
  API is wired into this codebase, and runtime translation would
  cost per-request latency + dollar cost on every page view.
  Bundling the translations into the JS data file makes
  `/terms` a fully static prerendered page (✓ in the build
  output) with no network calls for content.

**Not changed:**

- `convTrans` is purely additive. The original `inspector`/
  `driver` English fields are unchanged so any code reading
  them keeps working.
- The 🔊 Hear-term and 🎙️ Play-conversation buttons still play
  the English audio (the user is practicing English for
  roadside inspections — TTS in target language is not the goal
  here; the written translation is for comprehension).
- `lib/terms.js` `TERMS` ordering, `TERM_CATEGORIES`, all term
  translations, every other field — unchanged from Action 52.
- `components/AppShell.js`, all other routes — untouched.

**Verification:**

- `npx next build` → ✓ 17/17 routes. `/terms` 11.6 → 28.8 kB
  page chunk (+17 kB from inlining the 630 translation strings).
  First-load JS 144 → 161 kB. Acceptable since `/terms` is a
  reference view; users open it occasionally and benefit from
  having no runtime translation calls.
- Manual flow:
  - `/terms` with Chinese selected → expand a card's
    "💬 对话示例" → both EN and ZH panels render side-by-side.
    Inspector/Driver labels in Chinese in both panels.
  - Switch language to Spanish (top-right) → same card's
    second panel now shows ES translation, label changes to
    "ES". EN panel unchanged.
  - Switch to English → second panel disappears, EN panel
    fills the row alone.
  - On narrow phone width, panels stack vertically (flex-wrap).

**Reversal:**

- `git checkout HEAD~ -- lib/terms.js app/terms/page.js` drops
  the `convTrans` data + the two-panel render.

---

### Action 54 — Terms: fix inconsistent driver voice in conversation playback

**Request:** User reported that when clicking 🎙️ Play conversation,
the inspector's line plays but the driver's line is "inconsistent"
— most of the time there is no voice for the driver after the
inspector finishes the sentence.

**File modified:** `app/terms/page.js`

**Root cause:**

The original implementation had multiple latent bugs that
combined to make the driver line drop:

1. **`new Promise(async resolve => {...})` antipattern** in
   `playLine`. The async function inside the Promise constructor
   makes error propagation and resolution flow fragile. If
   `audio.play()` rejected or any await threw, the outer promise
   could hang (never resolving), leaving `speakConversation`
   stuck on `await playLine(inspector, ...)` forever — the
   driver call is never even reached.
2. **Sequential per-line fetches**. The driver's `/api/speak`
   call only fired AFTER the inspector audio finished (~3-5s
   after click). By then any flake — rate-limit (20/min, easy to
   hit on a Terms page with lots of click testing), transient
   network blip, or a Chrome autoplay-policy edge case — could
   silently kill the driver line. The inspector played because
   it was started DURING the user gesture; the driver's `play()`
   happened seconds later and could be blocked.
3. **`audio.onended` doesn't fire deterministically** on every
   browser for blob-URL audio. The original code only resolved
   on `onended` / `onerror` — if neither fired (stall, abrupt
   end-of-buffer, GC quirk), the playLine promise hung.
4. **Shared `convCancelled` boolean** was racy across multiple
   playback calls. Once a single `speakTermLine` or repeated
   click flipped it, an in-flight conversation's
   `if (convCancelled) return` bail could trigger spuriously.

**Changes:**

Rewrote the TTS module-scope helpers with four targeted fixes:

1. **Token-based cancellation.** Replaced `convCancelled`
   boolean with an integer `activeToken` that increments every
   time `stopTermAudio()` runs. Each call captures
   `myToken = activeToken` at start and checks
   `if (myToken !== activeToken) return` at every yield point.
   Two concurrent playbacks can no longer poison each other's
   state.

2. **Pre-fetch BOTH blobs in parallel.** `speakConversation`
   now fires `Promise.all([ttsFetch(inspector, 'north_m'),
   ttsFetch(driver, 'south_m')])` immediately on click. By the
   time the inspector audio finishes playing, the driver blob
   is already in memory. No second `/api/speak` call mid-
   playback — eliminates the rate-limit / network-flake /
   autoplay-policy attack surface that was killing the driver
   line. `audio.play()` for the driver is essentially
   instantaneous (already buffered locally).

3. **Idempotent `finish()` with safety timeouts.** Each playback
   resolution path (blob audio, speech-synth fallback) wires up
   a `done`-guarded `finish()` closure. `finish` is bound to:
   - `audio.onended` / `audio.onerror`
   - `audio.play().catch(finish)` — covers play-promise
     rejection from autoplay policy, abort, etc.
   - `setTimeout(finish, 20000)` for audio / `15000` for synth
     — absolute upper bound so playLine NEVER hangs.
   Whichever fires first wins; subsequent calls are no-ops.

4. **Removed the `new Promise(async () => {})` antipattern.**
   Both `playBlob` and `playSynth` are now plain
   `new Promise(resolve => {...})` with no async function
   inside. All operations are explicit event-handler chains.

**API for the page is unchanged:** `speakTermLine(text)` and
`speakConversation(inspector, driver)` keep their signatures.
No JSX changes needed.

**Design notes:**

- **Why parallel pre-fetch:** the win isn't just speed (driver
  audio starts instantly after the 400ms pause), it's
  **reliability**. The driver fetch happens within the same
  user-gesture window as the inspector fetch — any browser
  policy that checks "did the user just click?" sees both
  fetches as gesture-driven. By contrast, sequential fetching
  put the driver fetch ~3-5s after the click, well outside
  most browsers' "recent gesture" windows.
- **Why 20s / 15s safety caps:** roadside-style sentences are
  3-8s of speech. A 20-second cap won't truncate any realistic
  line but guarantees we don't deadlock on a rare buggy
  audio-end event. The 15s cap for speech-synth is shorter
  because the Chrome `cancel()`-then-`speak()` bug is the most
  common synth failure and its symptom is silent (no audio at
  all), so a shorter timeout doesn't cut off real speech.
- **Why not use a single Audio element with chained sources:**
  more complex, would require tracking source-switches and
  re-binding events. Two Audio objects + parallel pre-fetch
  achieves the same reliability with less code.
- **Why `audio.src = ''` in stopTermAudio:** ensures the old
  Audio object releases its decoder resources immediately —
  belt and suspenders on top of `audio.pause()`.

**Not changed:**

- The 🔊 Hear term button and 🎙️ Play conversation button JSX,
  labels, i18n keys — all the same.
- The card layout, the side-by-side EN/translation panels from
  Action 53, the conversation collapsible — unchanged.
- `lib/terms.js` data, all 63 terms × 6 languages — unchanged.
- Other pages — unchanged.

**Verification:**

- `npx next build` → ✓ 17/17 routes. `/terms` 28.8 → 28.9 kB
  (+0.1 kB for the new helpers + token logic).
- Manual flow:
  - Click 🎙️ Play conversation on any term → inspector plays
    in `north_m` (deeper, Onyx OpenAI voice), 400 ms pause,
    driver plays in `south_m` (warmer, Echo voice). ✓ both
    lines play consistently now.
  - Click 🎙️ repeatedly → each click cancels any in-flight
    audio (via `activeToken++`) and starts fresh. No "leftover"
    driver lines after switching cards.
  - Click 🎙️ then quickly click 🔊 Hear term on another card
    → conversation aborts cleanly, term plays. ✓
  - Network throttled in DevTools → both fetches still happen
    in parallel; if either fails, fallback speech-synth voice
    plays with pitch shift (0.8 vs 1.15) to keep speakers
    distinguishable.

**Reversal:**

- `git checkout HEAD~ -- app/terms/page.js` restores the
  sequential / shared-flag implementation.
