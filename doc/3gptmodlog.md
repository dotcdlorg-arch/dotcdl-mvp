# GPT Modification Log

Date: 2026-05-21

This log records the source-level edits made in this working copy. The folder is not a Git repository, so this is based on the observable project files and modification timestamps rather than `git diff`.

## Added Files

- `gptimprove.md`
  - Added an implementation plan based on `improve.md` and a source review.
  - Prioritized API cost controls, App Router status pages, language persistence, progress loading, lint modernization, testing, monitoring, and later product work.
- `lib/rate-limit.js`
  - Added an in-memory rate limit helper.
  - Added a shared `429` JSON response helper with `Retry-After`.
- `lib/validation.js`
  - Added shared validation constants for question codes, sign codes, progress statuses, and language codes.
  - Added helpers for score validation, text cleanup, and JSON error responses.
- `hooks/useLang.js`
  - Added a client hook for persistent language preference.
  - Stores the selected language in `localStorage`.
  - Broadcasts language changes across mounted components.
- `hooks/useProgress.js`
  - Added a client hook to load saved progress from `/api/progress`.
  - Maps question and sign progress API rows into page-friendly state.
- `app/loading.js`
  - Added a global App Router loading state.
- `app/error.js`
  - Added a global client error boundary with retry support.
- `app/not-found.js`
  - Added a custom 404 page with links back to practice and home.
- `eslint.config.mjs`
  - Added ESLint 9 flat config using Next core web vitals rules.

## Edited Files

- `app/api/speak/route.js`
  - Added Clerk user-based rate limiting.
  - Added request text cleanup and max length handling.
  - Changed TTS cache control from public caching to `private, max-age=3600`.
- `app/api/transcribe/route.js`
  - Added Clerk user-based rate limiting.
  - Added an audio upload size check before calling OpenAI Whisper.
- `app/api/score/route.js`
  - Added Clerk user-based rate limiting.
  - Added request body cleanup and validation for question/sign codes and language codes.
  - Kept keyword scoring as the no-cost fallback when OpenAI scoring is unavailable or fails.
  - Limited Supabase writes to valid question codes.
- `app/api/progress/route.js`
  - Added structured input validation for question progress and sign progress writes.
  - Added `GET /api/progress` to load question progress, sign progress, and recent mock results.
- `app/api/mock/route.js`
  - Added request validation for mock score, item count, and details.
  - Added `GET /api/mock` to fetch recent mock results.
- `components/AppShell.js`
  - Integrated the persistent language hook so the shell can use stored language state.
  - Preserved page-provided language state when supplied.
- `app/practice/page.js`
  - Integrated persistent language state.
  - Integrated saved progress loading.
  - Added loading/error UI for progress retrieval.
- `app/signs/page.js`
  - Integrated persistent language state.
  - Integrated saved sign progress loading.
  - Added loading/error UI for progress retrieval.
- `app/mock/page.js`
  - Integrated persistent language state.
- `app/drive/page.js`
  - Integrated persistent language state.
- `app/globals.css`
  - Removed the external Google Fonts CSS import.
  - Kept the existing CSS variable based font stack.
- `app/layout.js`
  - Touched while reviewing global app setup.
- `package.json`
  - Changed the lint script from `next lint` to `eslint .`.
  - Added/kept ESLint flat-config support dependencies.
- `package-lock.json`
  - Refreshed dependency lock state after package/lint tooling changes.

## Local Or Generated Files Not Counted As Source Edits

- `.env.local`
- `.DS_Store`
- `app/.DS_Store`
- `.next/**`
- `node_modules/**`

## 2026-05-21 Continuous Play Update

- `app/practice/page.js`
  - Added continuous playback controls to listening mode.
  - The new listening flow starts at the first filtered question, plays each officer question, marks it viewed, waits 3 seconds, and continues until the end.
  - Added stop support that cancels browser speech synthesis and exits the loop.
  - Updated the browser speech helper to return a promise so the page can wait for each spoken question to finish before the 3-second pause.
- `app/mock/page.js`
  - Updated oral mock test mode to auto-continue after AI grading.
  - After transcription and AI scoring finish, the score/model answer remains visible for 3 seconds, then the mock advances to the next question and plays it automatically.
  - Added timer cleanup and disabled re-record/next controls during the 3-second auto-advance pause to avoid duplicate submissions.
  - Kept skip and manual next behavior available outside the active auto-advance window.
- `app/drive/page.js`
  - Changed driving mode auto-advance timing to wait 3 seconds after AI grading before asking the next officer question.
  - Added timer cleanup for conversation advance timers, active audio, and browser speech synthesis when the page unmounts.

Verification:

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 Continuous Auto-Advance Fix

- `app/mock/page.js`
  - Fixed continuous oral mock mode stalling after a question by adding an automatic response window.
  - In continuous mode, recording now starts after the prompt finishes and auto-stops after 10 seconds if the user does not press stop first.
  - Once recording stops, the existing flow transcribes, grades, shows the result for 3 seconds, then advances to the next question.
  - Added cleanup for the recording auto-stop timer when continuous mode is stopped or the page unmounts.
- `app/drive/page.js`
  - Fixed continuous driving mode stalling after a question by adding the same automatic response window.
  - In continuous mode, the driver answer recording now auto-stops after 10 seconds, then grading and next-question advance proceed automatically.
  - Added cleanup for the recording auto-stop timer when continuous mode is stopped, the session ends early, or the page unmounts.

Verification:

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 Continuous Play Buttons

- `app/mock/page.js`
  - Added a visible `连续播放口语测试` button for `模拟检查 / 口语模式`.
  - Added an in-test continuous play toggle in the oral mock header.
  - Added a continuous play resume button in the idle recording panel when continuous mode is off.
  - Added stop support so users can pause the continuous oral test loop without leaving the mock test.
- `app/drive/page.js`
  - Added a visible `连续播放驾驶测试` button for `驾驶模式 — 边开车边练习`.
  - Added an in-conversation continuous play toggle in the driving mode header.
  - Added a continuous play resume button in the idle answer panel when continuous mode is off.
  - Added stop support so users can pause the continuous driving test loop without ending the session.

Verification:

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 Continuous Voice Testing Update

- `app/mock/page.js`
  - Changed oral mock mode from "auto-play next question only" to full continuous voice testing.
  - After the user starts oral mock mode, each question now plays aloud and recording starts automatically when the spoken prompt finishes.
  - After the user stops recording, the app transcribes, grades, shows the AI result/model answer for 3 seconds, then automatically plays the next question and starts recording again.
  - Preserved the existing stop-recording behavior so the driver controls when their answer is complete.
- `app/drive/page.js`
  - Changed driving mode to the same continuous voice testing loop.
  - Starting a scenario now plays the officer question, automatically begins recording when the officer voice finishes, grades after the user stops recording, waits 3 seconds, and continues to the next officer question.
  - Passed the active question index through recording and grading callbacks so each transcript/score stays attached to the correct question during the continuous loop.

Verification:

- `npm run lint` passed.
- `npm run build` passed.
- Started the local dev server; Next used `http://localhost:3002` because port `3000` was already in use.
- In-app browser verification could not be completed because the browser runtime reported that the `iab` browser was unavailable in this session.

## 2026-05-21 Driving And Mock Continuous Flow Follow-Up

- `app/mock/page.js`
  - Made the oral mock auto-continue state visible after AI grading.
  - Added an `autoContinue` message so users can see that the mock test will continue automatically after the 3-second pause.
  - Kept the next/re-record buttons disabled during that pause to prevent duplicate advance events.
- `app/drive/page.js`
  - Added a separate `advancing` driver state for the 3-second pause after AI grading.
  - Added a visible `nextIn3` message in driving mode so users know the next officer question is about to play automatically.
  - Moved the question index update into `askQuestion()` so the displayed question number does not jump ahead during the 3-second grading pause.

Verification:

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 Continuous Play Loop

- `app/mock/page.js`
  - Converted `items` from `useMemo` to `useState` + `itemsRef` so the question set can be replaced mid-session.
  - Changed `nextSpeakQ` and `skipSpeakQ`: when the last question finishes and continuous mode is still active, a fresh `buildMock()` set is generated, state is reset to question 0, and playback restarts after the standard 3-second pause — instead of going to the result screen.
  - The loop only stops when the user clicks the stop button; clicking stop during the 3-second inter-round pause shows the result screen.
  - All async callbacks (`startAutoVoiceQuestion`, `startRec` onstop) now read items via `itemsRef.current` to avoid stale-closure mismatches during loop transitions.
- `app/drive/page.js`
  - Changed `scoreAndAdvance`: when the last question in a scenario is answered and continuous mode is still active, the scenario questions are reshuffled and driving restarts after the 3-second pause — instead of going to the result screen.
  - If the user stops continuous play during that 3-second inter-round pause, the result screen is shown instead.

Verification:

- `npm run lint` passed.
- `npm run build` passed.

## 2026-05-21 Continuous Play Not Starting — Root Cause Fix

Root causes identified:

1. `setTimeout` in `startContinuousMock` (100 ms) and `startScenario` (300 ms) pushed the first
   `speechSynthesis.speak()` call into a new macrotask, losing Chrome's user-gesture context.
   Chrome gates the very first TTS call on a user gesture; once that context is gone, `speak()`
   silently does nothing and the loop never starts.
2. `speakText` had no fallback timeout. Chrome has a known bug where `onend` does not fire after
   `cancel()`, causing `await speakText()` to hang and `startRec` to never be called.

- `app/mock/page.js`
  - Rewrote `speakText` to use a single `done` callback shared by `onend`, `onerror`, and a
    word-count-based fallback `setTimeout` (max 3 s, ~500 ms/word). The promise now always
    resolves regardless of browser TTS behaviour.
  - Removed the `setTimeout(..., 100)` wrapper in `startContinuousMock`; now calls
    `startAutoVoiceQuestion` directly so `speechSynthesis.speak()` executes within the
    user-gesture call stack.
- `app/drive/page.js`
  - Removed the `setTimeout(..., 300)` wrapper in `startScenario`; now calls `askQuestion`
    directly for the same reason.
  - Added a matching fallback timeout to the browser-synthesis fallback inside `speak`'s catch
    block so `onEnd` is always called even if `onend` never fires.

Verification:

- `npm run lint` passed.
- `npm run build` passed.
