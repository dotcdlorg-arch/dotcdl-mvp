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
