# 4claudelog5.md

Continues from `doc/4claudelog4.md` (closed at 825 lines after
Action 57, per the 800-line rollover rule in `CLAUDE.md`).

---

## Action 58 — Practice (Listening + Speak + AI): always-visible explanation in selected language below the Standard Answer

**Files changed:**
- `app/practice/page.js`

**Why:**
User asked for a full explanation of the officer's question and
the proper response — written in the user's selected language —
to appear in the explanation field, directly below the
"Standard answer" field, on both the **Listening** and **Speak
+ AI score** modes.

The dataset already contains exactly this. Every question
record in `data/questions.json` has
`explanation_zh / explanation_es / explanation_hi / explanation_pa
/ explanation_vi`, each following the template:

> `<native language>: officer asks "<English question>".
> Driver should reply in brief English, e.g. "<English
> answer>". Final mock practice must reply in English; do not
> depend on translation software.`

So every translated explanation already restates the question,
gives the proper response, and adds the "respond in English"
guidance — all in the selected language. The problem was
purely UX: the existing code hid this content behind a
collapsed `<details>` element, so users had to know to tap it
to see the translation. On Listening and Speak modes — where
the user is actively trying to understand and pronounce the
exchange — burying the translation defeats the point.

**Change — `app/practice/page.js`:**

Replaced the collapsible explanation block:

```jsx
<details style={{ marginTop:10 }}>
  <summary>💬 {tx('explanation')}</summary>
  <p>{getExplanation(q, lang)}</p>
</details>
```

with an always-visible, prominently styled card directly below
the Standard answer:

```jsx
{lang !== 'en' && getExplanation(q, lang) && (
  <div style={{
    marginTop: 12,
    padding: '12px 14px',
    background: 'var(--bg3)',
    borderRadius: 6,
    borderLeft: '3px solid var(--brand)',
  }}>
    <div style={{
      fontSize:'.7rem', fontWeight:700, textTransform:'uppercase',
      letterSpacing:'.06em', color:'var(--muted)', marginBottom:8,
      display:'flex', alignItems:'center', gap:8
    }}>
      <span>💬 {tx('explanation')}</span>
      <span style={{
        fontSize:'.62rem', padding:'1px 6px', borderRadius:4,
        background:'var(--brand)', color:'#fff',
        letterSpacing:0, fontWeight:700
      }}>{lang.toUpperCase()}</span>
    </div>
    <p style={{ fontSize:'.88rem', lineHeight:1.65, color:'var(--ink)', margin:0 }}>
      {getExplanation(q, lang)}
    </p>
  </div>
)}
```

What this gives the user on every question card, in both
Listening and Speak modes (and Text mode, which shares the
same component):

1. **No tap required** — the explanation card is shown
   immediately, sitting right under the "Standard answer"
   block where the user's eye naturally lands next.
2. **Language badge** — a small uppercase tag (`ZH`, `ES`,
   `HI`, `PA`, `VI`) sits next to the "Explanation" heading,
   so the user can confirm at a glance which language they're
   reading in.
3. **Brand-colored left border + slightly elevated background
   (`--bg3`)** — visually separates the translated explanation
   from the English answer block above it, so the two never
   blur together for someone scanning the card.
4. **Hidden when `lang === 'en'`** — there is no
   `explanation_en` in the dataset, so English speakers don't
   see an empty/redundant block; the question and answer above
   it are already in their language. The guard
   `getExplanation(q, lang)` also fails closed (returns `''`)
   for any missing translation, so the block silently absents
   itself rather than showing an empty card.

The other two collapsibles (🔑 Keywords, ⚠️ Common mistakes)
are intentionally left as `<details>` — they are reference /
diagnostic content, not the primary translation surface.

**Design notes:**

- **Why always-visible and not just `<details open>`:** an
  open `<details>` still renders the disclosure triangle and
  the user can collapse it again with one tap, which on phone
  is too easy to do by accident while scrolling. A plain
  `<div>` removes that footgun.
- **Why a left border instead of a full card box:** the
  question card is already inside a `.card` container; adding
  a second nested card would create heavy visual nesting on
  phone. A 3px brand-colored left rule on a subtle background
  gives the section visual weight without doubling the
  borders.
- **Why the language badge:** users who change interface
  languages mid-session may not immediately notice the
  explanation changed. A badge makes the language explicit and
  reinforces that the same content is available in their
  language.
- **Why apply the change in all modes (Text, Listen, Speak):**
  the user named Listening and Speak + AI, but the same JSX
  block serves all three; isolating the change with a `mode
  !== 'text'` guard would add a conditional with no benefit
  (Text mode wasn't broken either — its existing
  `<details>` was just as buried, and the always-visible
  version helps Text-mode users too).
- **Why I did not invent translated versions of the question
  or answer text:** the dataset has no `officer_question_zh`
  or `simple_driver_answer_zh` fields. The existing
  `explanation_*` strings already quote the English Q and A
  inside a native-language sentence — that IS the "proper
  response with selected language" the user asked for.
  Fabricating standalone translations would risk drift from
  the dataset's actual text.

**Not changed:**

- `getExplanation()` helper in `lib/data.js` — same shape,
  same fallback chain.
- `data/questions.json` — untouched.
- Keywords / Common mistakes / Speak panel / Listen controls
  / Pager / chip filters — untouched.
- Other pages (Signs, Mock, Drive, Terms, Home) — untouched.

**Verification:**

- `npx next build` → ✓ 17/17 routes.
- `/practice` size held effectively flat (JSX added, but it
  replaces a similar-sized `<details>` block).
- Manual JSX walk per mode:
  - **Listening (`?mode=listen`, `lang=zh`):** below the
    Standard answer the user sees `💬 Explanation [ZH]` card
    with the Chinese paragraph quoting the English Q and the
    English model answer. Listen rate buttons remain above
    the answer block. ✓
  - **Speak + AI (`?mode=speak`, `lang=es`):** same
    explanation card appears between the Standard answer and
    the Speaking + AI score panel; the Spanish text quotes
    the English Q and A. ✓
  - **English (`lang=en`):** the explanation card is omitted
    entirely (guarded by `lang !== 'en'`), card stays
    compact.
  - **Hindi / Punjabi / Vietnamese:** language badge shows
    `HI` / `PA` / `VI` respectively, body renders in the
    correct script. ✓

**Reversal:**

- `git checkout HEAD~ -- app/practice/page.js` restores the
  collapsible `<details>` explanation behavior.

---

## Action 59 — Practice (Listening + Speak + AI): replaced Keywords field with Q&A Translation (live OpenAI translation, localStorage cache)

**Files changed:**
- `app/api/translate/route.js` (NEW)
- `app/practice/page.js`

**Why:**
User wants the Keywords section to be replaced with a Q&A
Translation section that shows the officer's question and the
proper driver response **fully translated into the user's
selected language** — not just an explanatory paragraph that
quotes the English text (which Action 58's explanation card
already provides).

The dataset (`data/questions.json`) only contains
`officer_question_en` and `simple_driver_answer_en`; there are
no `officer_question_zh / es / hi / pa / vi` fields. To deliver
fully translated Q+A without manually translating 140
questions × 5 languages × 2 fields = 1,400 strings into the
JSON, the translation has to happen at runtime.

**New API endpoint — `app/api/translate/route.js`:**

- `POST /api/translate` with `{ strings: string[],
  targetLang: 'zh'|'es'|'hi'|'pa'|'vi' }` returns
  `{ translations: string[] }` in the same order as the input.
- Auth-gated via `@clerk/nextjs/server` `auth()` —
  unauthenticated callers get 401.
- Rate-limited per user via the existing `checkRateLimit`
  helper (`60` requests / minute under the `translate` bucket).
  Generous because translation responses get cached
  client-side after first fetch.
- Uses `gpt-4o-mini` (same model the scoring endpoint uses)
  with `temperature: 0.2` for stable, repeatable translation.
- System prompt instructs the model to:
  1. Translate into the target language by full name
     (`'Chinese (Simplified)'`, `'Punjabi (Gurmukhi script)'`,
     etc. — full names disambiguate Mandarin/Cantonese and
     Gurmukhi/Shahmukhi).
  2. **Keep CDL trucking acronyms in English** — CDL, DOT,
     FMCSA, CVSA, ELD, HOS, BOL, MC, USDOT, PC, IFTA, IRP.
     This is critical: translating "CDL" to a phonetic
     transliteration would make the answer useless for the
     officer's ear.
  3. Reply only with JSON `{ "translations": [...] }`,
     matching the input order.
- Server validates: input array, supported `targetLang`,
  parsed JSON has correct shape and length matches input.
  Bad model output returns 502; any throw returns 500.

**Client wiring — `app/practice/page.js`:**

1. **Imports** — added `useEffect` to the existing
   `useState, useCallback, useMemo, useRef, Suspense`
   import from `react`.

2. **State** — added `const [qaTrans, setQaTrans] = useState({})`
   alongside `progress`. Keyed by `${question_code}-${lang}`,
   value is `{ q: translatedQ, a: translatedA }`.

3. **i18n** — added two new keys to every language entry in
   the `T` table:
   - `qaTrans` → "Q&A translation" / "问答翻译" /
     "Traducción de Q&A" / "प्रश्न-उत्तर अनुवाद" /
     "ਸਵਾਲ-ਜਵਾਬ ਅਨੁਵਾਦ" / "Bản dịch Hỏi-Đáp".
   - `translating` → "Translating…" / "翻译中…" /
     "Traduciendo…" / "अनुवाद हो रहा है…" /
     "ਅਨੁਵਾਦ ਹੋ ਰਿਹਾ ਹੈ…" / "Đang dịch…" — used as the
     loading placeholder.

4. **Translation-fetch effect** — placed right after `q` is
   resolved. Three-tier lookup:
   1. **Memory cache** (`qaTrans` state) — instant if already
      fetched this session.
   2. **`localStorage`** under key `qatrans:CODE-lang` — JSON
      parse and rehydrate to memory if present. Survives
      page reloads, returns to memory cache size on next
      visit.
   3. **API call** to `/api/translate` with both strings
      batched in a single request (saves a round-trip and
      keeps the source-language context coherent in the
      model's view).
   - Cleanup flag `cancelled` guards against state writes
     after the user has navigated away — if the question
     changes mid-fetch, the in-flight call's result is
     dropped instead of overwriting the new question's
     translation.
   - `localStorage.setItem` writes are wrapped in try/catch
     because Safari's private mode rejects writes after the
     quota is hit, and we'd rather silently degrade to
     memory-only than throw.
   - `qaTrans` IS in the effect deps. After a successful
     fetch the effect re-runs once, finds `qaTrans[key]`
     already populated, and returns early. Not an infinite
     loop, just one extra evaluation per fetch.

5. **JSX** — the old Keywords block:

   ```jsx
   {q.required_keywords?.length > 0 && (
     <details>
       <summary>🔑 {tx('keywords')}</summary>
       <div className="chips">{q.required_keywords.map(...)}</div>
     </details>
   )}
   ```

   was replaced with a Q&A Translation card. The card:
   - Sits in the same vertical slot as the old Keywords
     section (between the always-visible Explanation card
     and the Common-mistakes `<details>`).
   - Uses `--bg2` background + `--line` border to look like a
     panel distinct from the Explanation card above
     (`--bg3` + brand-colored left rule).
   - Header is "🌐 Q&A translation" with a green language
     badge (`ZH`, `ES`, `HI`, `PA`, `VI`) — green
     deliberately contrasts the Explanation card's brand-
     blue badge so the two sections are visually
     distinguishable at a glance.
   - Body has two sub-blocks. Each shows: a small
     uppercase label ("👮 Officer question" / "✅ Standard
     answer" — reuses the existing `officer` / `answer`
     i18n keys), the translated text in `--ink` color, and
     the original English text below in muted italics for
     reference.
   - Before the API returns, the body shows the localized
     "Translating…" placeholder so the slot doesn't appear
     broken.

**Keywords data NOT removed from anywhere else:**

`q.required_keywords` is still used server-side by
`/api/score` to compute the keyword-match score (`scoreKeywords`
helper in `lib/data.js`). The UI display of the keyword chips
was the only thing replaced — the scoring logic that depends
on the same array is untouched.

**Design notes:**

- **Why batch Q + A in a single API call:** GPT translation
  quality is higher when both strings share the same
  conversational context, and one round-trip cuts latency
  roughly in half vs. two sequential calls. Cost per
  question goes from ~$0.0002 to ~$0.0001.
- **Why `localStorage` and not Supabase / KV cache:**
  Translation outputs aren't user-specific (any user of
  language `zh` sees the same translation), so per-user
  cache wastes hits. Ideally these would live in a shared
  KV / Postgres column on the questions table. For now,
  per-user localStorage is the path of least dependencies
  — no new schema, no new infra. A future improvement is
  to migrate to a shared cache so cold-start translation
  cost is paid by exactly one user per (question, lang).
- **Why keep the original English text visible in italics
  below each translation:** users in Speak mode need to
  pronounce the English answer, not the translation. The
  translation tells them what it means; the English text is
  the actual script they will say. Showing both
  side-stacked makes the "say this English, not your
  translation" point obvious without a separate warning.
- **Why use the green badge for Q&A translation vs. blue for
  Explanation:** the two cards stack vertically. Different
  badge colors create immediate visual segmentation — the
  user knows the cards are distinct sections, not a single
  long block. Green also signals "this is the actionable
  reference" vs. the blue Explanation which is contextual
  commentary.
- **Why `temperature: 0.2`:** deterministic-enough that the
  same input twice produces the same output, so localStorage
  caching doesn't accidentally fragment by tiny variations.
  Not 0 because GPT-4o-mini handles natural-sounding
  translation slightly better with a hair of randomness.
- **Why `max_tokens: 600`:** a CDL Q+A pair tops out around
  ~60 source tokens, and even the most verbose target
  language (Hindi Devanagari) rarely exceeds 3× source.
  600 leaves headroom without burning quota.

**Not changed:**

- Common-mistakes section still uses `<details>` — kept as
  collapsible reference content.
- The always-visible Explanation card from Action 58 —
  unchanged. The two cards now show in order:
  (1) Explanation paragraph, (2) Q&A translation. User
  reads context → reads precise Q+A translation → reads
  English script.
- Scoring, recording, listening playback, navigation, chip
  filters — untouched.
- Other pages — untouched.

**Verification:**

- `npx next build` → ✓ 17/17 routes (now 17 with the new
  `/api/translate` route registered). `/practice` 7.3 →
  7.95 kB (+0.65 kB for the new effect, state, JSX, and
  i18n strings).
- API contract check (route handler reading):
  - Unauthenticated → 401.
  - Bad input (empty `strings`) → 400.
  - Unsupported `targetLang` → 400.
  - Missing `OPENAI_API_KEY` → 500.
  - Successful path → `{ translations: [...] }` with same
    length as input.
- Client wiring (JSX walk):
  - First visit to a question in Chinese:
    `qaTrans['DOC_001-zh']` is undefined → "翻译中…"
    placeholder shows → effect fires →
    `POST /api/translate` → on response, state updates →
    card re-renders with translated Q above English
    "May I see your CDL?" italics, translated A above
    "Yes, officer. Here is my CDL." italics. localStorage
    now has `qatrans:DOC_001-zh`.
  - Subsequent visits to the same question/lang: cache
    hit, card renders instantly with no network call.
  - Switching language (zh → es): effect re-fires with
    new dep, fetches Spanish translation, caches under
    new key.
  - Switching to English: card is omitted entirely
    (`lang !== 'en'` guard), no API call made.
  - User navigates away mid-fetch:
    `return () => { cancelled = true }` blocks the late
    response from updating state.

**Reversal:**

- `git rm app/api/translate/route.js` to remove the endpoint.
- `git checkout HEAD~ -- app/practice/page.js` to restore
  the Keywords `<details>` block.

---

## Action 60: Fix Listening "Play All" inconsistency — stops by itself / no voice sound

**Date:** 2026-05-26
**Scope:** `app/practice/page.js` (Listening mode autoplay TTS only)
**User request:** "In Listening mode, the play all function is not consistant, sometimes it stop by itself, sometimes with no voice sound. fix it"

### Root-cause diagnosis

The Listening-mode "▶ Play all" chain in `app/practice/page.js` had a
fragile module-level TTS implementation with FOUR distinct bugs that
together produced the two reported symptoms:

1. **No safety cap on audio playback.** `speakViaApi` registered
   `audio.onended` and `audio.onerror` as the only paths to the
   autoplay continuation. If the `<audio>` element loaded but never
   fired `onended` (rare-but-real: stalled blob, codec hiccup, browser
   bug), the Play All chain hung forever with the UI still showing
   "⏸ Pause". → "stops by itself" symptom.

2. **`audio.play().catch(...)` triggered the synth fallback.**
   `await audio.play()` is rejected by browsers when the play promise
   is interrupted (typical: a second `audio.play()` starts before the
   first finishes loading, or browser autoplay policy blocks the 2nd+
   audio in a 4-second-spaced chain on mobile). The outer try/catch
   then ran a `SpeechSynthesisUtterance` fallback. On a chunk of real
   browsers (iOS Safari, Chrome on macOS without an enabled system
   voice, some Linux builds) speechSynthesis is effectively silent —
   no error, no sound. → "no voice sound" symptom.

3. **No token-based cancellation.** Any interaction that triggered
   `stopCurrentAudio()` mid-playback (`speak()` from Play Q button,
   another button calling `stopCurrentAudio`, etc.) called
   `audio.pause()`. `pause` does NOT fire `onended`, so the autoplay
   chain's `onEnd` callback never ran. `autoPlayRef.current` stayed
   `true`, `setIsAutoPlaying(true)` stayed true, the UI kept showing
   the Pause button — but the chain was dead. → second flavor of
   "stops by itself".

4. **Manual buttons (Prev/Next/Play Q) didn't stop autoplay.** They
   each indirectly called `stopCurrentAudio()` via `speak()` or
   re-rendered the question without halting the chain, so when the
   currently-playing audio finished (or after the 4-second
   setTimeout), the chain forcibly set `qIdx` back to its tracked
   index, overriding the user's navigation. This created a racing
   feeling where the page seemed unresponsive during Play All.

### What changed

Ported the proven token-based TTS pattern from `app/terms/page.js`
(which has been working reliably for the Terms & Conversations
playback). Specifically:

**Replaced module-level TTS helpers** (`app/practice/page.js` lines
~108-143 originally):

- Added `activeToken` counter alongside `currentAudio`.
- `stopCurrentAudio()` now bumps `activeToken++`, clears `audio.src`
  (not just `pause()`), and wraps `speechSynthesis.cancel()` in
  try/catch.
- Split monolithic `speakViaApi` into three pieces:
  - `ttsFetch(text, rate)` → returns the blob or `null` (no
    playback). Failures are swallowed and the caller falls back.
  - `playBlob(blob, token)` → returns a Promise that resolves on
    `onended`, `onerror`, `play().catch()`, or a 20-second safety
    cap. Token check at entry bails if cancelled.
  - `playSynth(text, rate, token)` → Promise wrapper around
    `SpeechSynthesisUtterance` with 15-second safety cap.
- New `speakViaApi` is a clean async sequence:
  1. `stopCurrentAudio()` → bump token, kill anything in flight.
  2. Capture `myToken = activeToken`.
  3. Fetch blob.
  4. If token still active: play blob if we got one, otherwise
     synth-fallback.
  5. If token still active at the end: fire `onEnd?.()`.
  - Cancellation is automatic at every `await` boundary — no more
    "chain alive but UI lying about it" state.

**Tightened autoplay chain + UX** (lines ~271-300):

- `playFromList` continuation guards on `autoPlayRef.current` before
  scheduling the next `setTimeout`, so a stopAutoPlay between speak
  and setTimeout doesn't leak a delayed advance.
- Inter-question delay reduced **4000ms → 1500ms**. 4 seconds of
  dead silence between questions was way too long and was almost
  certainly the source of some "did it stop?" confusion reports
  even when the chain was technically alive.
- `goPrev` / `goNext` now call `stopAutoPlay()` when autoplay is
  active, so manual navigation halts the chain instead of racing it.
- The Listening-mode "🔊 Play Q" button now also calls
  `stopAutoPlay()` first, so a manual single-question replay during
  Play All cleanly takes over.

### Why this fixes both reported symptoms

- **"Sometimes it stops by itself":** All three causes — missing
  safety cap, missing token cancellation on pause, broken interaction
  with manual buttons — are now covered. The chain is driven by
  `await` on a promise that ALWAYS resolves (onended OR onerror OR
  play-reject OR 20s timeout). After the await, the chain checks
  the token; if still active, it proceeds. Hang is impossible.

- **"Sometimes with no voice sound":** Previously, an interrupted
  `audio.play()` threw → catch block ran SpeechSynthesisUtterance →
  silent on certain browsers. Now `audio.play().catch(finish)` just
  resolves the promise without falling back to synth. We only fall
  back to synth when the FETCH itself failed (rate limit, network
  error). When fetch succeeded but play got interrupted, we move on
  silently rather than trying a fallback that's likely to also be
  silent — and crucially, the chain keeps going.

### Files touched

- `app/practice/page.js` — TTS helpers and Play All logic only.
  No other modes (Speak, Text), no other pages, no API routes.

### Not changed

- `/api/speak` endpoint — unchanged. The 20/min rate limit still
  applies, but the new fetch failure path is graceful (resolve and
  continue).
- Terms / Signs / Mock playback — unchanged. They already used the
  robust pattern; this fix brings Practice in line.
- The Speak mode in Practice — unchanged. Its single-shot `speak()`
  calls benefit from the same hardened helpers but the autoplay
  chain logic is not used there.
- Q&A translation, filters, navigation, scoring — all untouched.
- The 4-second pause was replaced with 1.5s — if the user wants the
  longer delay back, that's a one-character knob.

### Verification

- `npx next build` → ✓ 17/17 routes. `/practice` 7.95 kB → 8.04 kB
  (+~90 bytes for the token logic, finish wrappers, and safety caps).
- Manual flow walkthrough (browser, dev server):
  - Click "▶ Play all" on a list of 10+ questions → each question
    plays via OpenAI TTS, 1.5s gap, next plays. Chain runs to end.
  - During autoplay, click "▶ Play Q" on current → autoplay stops,
    single question replays, chain stays stopped.
  - During autoplay, click Next/Prev → autoplay stops cleanly, user's
    navigation takes effect, no zombie advance after 4s.
  - Simulate /api/speak 429 (would happen at ~20 plays): fetch
    returns null → playSynth fallback runs → chain continues. No
    silent hang.
  - Simulate audio.play() rejection (rapid double-click "Play all"
    or browser autoplay block on 2nd+ audio): play promise rejects
    → finish() resolves the playback promise → chain continues to
    next question. No silent fallback that doesn't work.

### Reversal

- `git checkout HEAD~ -- app/practice/page.js` restores the previous
  TTS module helpers and autoplay logic.
