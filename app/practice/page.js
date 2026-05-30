'use client'
import { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { QUESTIONS, Q_CATEGORIES, Q_DIFFICULTIES, getExplanation, scoreKeywords } from '@/lib/data'
import { useProgress } from '@/hooks/useProgress'
import { useLang } from '@/lib/lang-context'
import { useToast } from '@/lib/toast-context'
import InlineAlert from '@/components/InlineAlert'
import { t } from '@/lib/i18n'

// Chip-row styling: single-line horizontal scroll with smaller chips so all
// categories fit on a phone screen (swipe to see the rest).
const chipRowStyle = {
  display: 'flex',
  flexWrap: 'nowrap',
  gap: 6,
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  paddingBottom: 4,
}
const chipBtnStyle = {
  flex: '0 0 auto',
  padding: '4px 10px',
  fontSize: '.72rem',
  whiteSpace: 'nowrap',
}

// Real human voice via OpenAI TTS, fallback to browser synthesis on failure.
// Token-based cancellation: every stop bumps the token; in-flight playback
// checks myToken !== activeToken and bails. Avoids the shared-flag race that
// made Play All hang or play silently when interrupted.
let currentAudio = null
let activeToken = 0

// Mobile autoplay-policy workaround. On phones, every audio.play() that runs
// AFTER an awaited fetch is silently rejected because the user-gesture context
// is lost. So we keep ONE persistent <audio> element, unlock it once with a
// silent source during the user's click (synchronously, before any await),
// then reuse that same element for every question's playback. iOS/Android
// Safari + Chrome remember per-element permission, so subsequent play() calls
// outside a gesture work.
let persistentAudio = null
let audioUnlocked = false
let synthUnlocked = false

// 45-byte valid silent WAV (1 sample, 8 kHz, 8-bit mono). Used only to
// satisfy iOS Safari's "play() needs a real src" requirement on the
// gesture's first play call.
const SILENT_AUDIO_SRC =
  'data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQEAAAAA'

function getPersistentAudio() {
  if (typeof window === 'undefined') return null
  if (!persistentAudio) {
    persistentAudio = new Audio()
    persistentAudio.preload = 'auto'
  }
  return persistentAudio
}

// MUST be called synchronously from a user-gesture handler (click) BEFORE any
// await. Idempotent — safe to call on every click.
function unlockAudio() {
  if (typeof window === 'undefined') return
  const a = getPersistentAudio()
  if (a && !audioUnlocked) {
    try {
      a.src = SILENT_AUDIO_SRC
      const p = a.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          try { a.pause() } catch {}
          audioUnlocked = true
        }).catch(() => {
          // Some browsers reject the silent-priming play() but still mark
          // the element as user-permitted. Mark unlocked optimistically;
          // worst case we retry on the next gesture.
          audioUnlocked = true
        })
      } else {
        audioUnlocked = true
      }
    } catch {}
  }
  // Also prime speechSynthesis — on iOS the first speak() must be in a gesture.
  if (window.speechSynthesis && !synthUnlocked) {
    try {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      window.speechSynthesis.speak(u)
      synthUnlocked = true
    } catch {}
  }
}

// Pending finish callback for whatever is currently playing. When the user
// stops or interrupts mid-playback, we call this to resolve the awaiting
// promise so the chain can shut down cleanly instead of leaving an orphan
// awaiting forever.
let pendingFinish = null

function stopCurrentAudio() {
  activeToken++
  if (pendingFinish) {
    const fn = pendingFinish; pendingFinish = null
    try { fn() } catch {}
  }
  if (currentAudio) {
    try { currentAudio.pause() } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel() } catch {}
  }
}

async function ttsFetch(text, rate) {
  if (!text) return null
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: 'north_m', speed: rate || 1 }),
    })
    if (!res.ok) return null
    return await res.blob()
  } catch { return null }
}

// Resolves on onended / onerror / play() rejection / 20s safety cap.
// Uses the persistent (unlocked) audio element so playback works on mobile
// after the gesture context is gone.
function playBlob(blob, token) {
  return new Promise(resolve => {
    if (!blob || token !== activeToken) return resolve()
    const audio = getPersistentAudio() || new Audio()
    const url = URL.createObjectURL(blob)
    currentAudio = audio
    let done = false
    const finish = () => {
      if (done) return
      done = true
      try { URL.revokeObjectURL(url) } catch {}
      if (currentAudio === audio) currentAudio = null
      if (pendingFinish === finish) pendingFinish = null
      audio.onended = null
      audio.onerror = null
      resolve()
    }
    pendingFinish = finish
    audio.onended = finish
    audio.onerror = finish
    try {
      audio.src = url
      const p = audio.play()
      if (p && typeof p.then === 'function') p.catch(finish)
    } catch { finish(); return }
    setTimeout(finish, 20000)
  })
}

function playSynth(text, rate, token) {
  return new Promise(resolve => {
    if (token !== activeToken) return resolve()
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate || 1
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (pendingFinish === finish) pendingFinish = null
      resolve()
    }
    pendingFinish = finish
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
    setTimeout(finish, 15000)
  })
}

async function speakViaApi(text, rate, onEnd) {
  stopCurrentAudio()
  const myToken = activeToken
  const blob = await ttsFetch(text, rate)
  if (myToken !== activeToken) return
  if (blob) await playBlob(blob, myToken)
  else await playSynth(text, rate, myToken)
  if (myToken !== activeToken) return
  onEnd?.()
}

function speak(text, rate) { speakViaApi(text, rate, null) }
function speakWithCb(text, rate, onEnd) { speakViaApi(text, rate, onEnd) }

// ── Main component ────────────────────────────────
function PracticeInner() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'text'

  const { lang, setLang } = useLang()
  const [filterCat, setFilterCat] = useState('all')
  const [filterDiff, setFilterDiff] = useState('all')
  const [reviewOnly, setReviewOnly] = useState(false)
  const [qIdx, setQIdx] = useState(0)
  const [listenRate, setListenRate] = useState(1)
  const [transcript, setTranscript] = useState('')
  const [scoreData, setScoreData] = useState(null)
  const [scoring, setScoring] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [micError, setMicError] = useState(null)
  const { showToast } = useToast()
  const { progress, stats: hookStats, markQuestion } = useProgress({ type: 'question' })
  const [qaTrans, setQaTrans] = useState({})
  const mrRef = useRef(null)
  const autoPlayRef = useRef(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const tx = (k) => t(lang, 'practice.' + k)

  // Filtered + shuffled questions. Shuffle is memoized on filter keys only —
  // not on `progress` — so marking a question doesn't re-randomize the order
  // while the user is navigating. The reviewOnly trim happens after the shuffle
  // so it preserves the random order.
  const baseFiltered = useMemo(() => {
    const list = QUESTIONS.filter(q => {
      if (filterCat !== 'all' && q.category !== filterCat) return false
      if (filterDiff !== 'all' && q.difficulty !== filterDiff) return false
      return true
    })
    // Fisher-Yates shuffle — random order, not source order.
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [filterCat, filterDiff])

  const filtered = reviewOnly
    ? baseFiltered.filter(q => progress[q.question_code]?.status === 'needs_review')
    : baseFiltered

  const safeIdx = Math.min(qIdx, Math.max(0, filtered.length - 1))
  const q = filtered[safeIdx]
  const p = q ? progress[q.question_code] : null

  // Fetch Q&A translation for the current question/lang. Uses localStorage as a
  // persistent cache so each user pays the OpenAI cost at most once per
  // (question_code, lang) pair, ever.
  useEffect(() => {
    if (!q || lang === 'en') return
    const code = q.question_code
    const key = `${code}-${lang}`
    if (qaTrans[key]) return
    try {
      const cached = localStorage.getItem(`qatrans:${key}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.q && parsed?.a) {
          setQaTrans(prev => ({ ...prev, [key]: parsed }))
          return
        }
      }
    } catch {}
    let cancelled = false
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strings: [q.officer_question_en, q.simple_driver_answer_en],
        targetLang: lang,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data?.translations || data.translations.length < 2) return
        const entry = { q: data.translations[0], a: data.translations[1] }
        setQaTrans(prev => ({ ...prev, [key]: entry }))
        try { localStorage.setItem(`qatrans:${key}`, JSON.stringify(entry)) } catch {}
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [q?.question_code, lang, qaTrans])

  const stats = { ...hookStats, total: QUESTIONS.length }

  const markStatus = markQuestion

  function startAutoPlay() {
    // Synchronously unlock the persistent audio element on this click so
    // every subsequent play() in the chain works on mobile (where the user
    // gesture is consumed by the first awaited fetch).
    unlockAudio()
    autoPlayRef.current = true
    setIsAutoPlaying(true)
    playFromList(filtered, safeIdx)
  }
  function stopAutoPlay() {
    autoPlayRef.current = false
    setIsAutoPlaying(false)
    stopCurrentAudio()
  }
  function playFromList(list, idx) {
    if (!autoPlayRef.current || idx >= list.length) {
      autoPlayRef.current = false
      setIsAutoPlaying(false)
      return
    }
    setQIdx(idx)
    setTranscript(''); setScoreData(null)
    speakWithCb(list[idx].officer_question_en, listenRate, () => {
      if (!autoPlayRef.current) return
      setTimeout(() => playFromList(list, idx + 1), 1500)
    })
  }

  function goNext() {
    if (autoPlayRef.current) stopAutoPlay()
    if (safeIdx < filtered.length - 1) { setQIdx(safeIdx + 1); resetSpeak() }
  }
  function goPrev() {
    if (autoPlayRef.current) stopAutoPlay()
    if (safeIdx > 0) { setQIdx(safeIdx - 1); resetSpeak() }
  }
  function resetSpeak() { setTranscript(''); setScoreData(null) }

  async function startRecording() {
    if (typeof window === 'undefined') return
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Microphone requires HTTPS. Please use https://dotcdl.org'
      showToast(msg, 'error')
      setMicError(msg)
      return
    }
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' })
      const chunks = []
      mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunks, { type: mr.mimeType })
        const fd = new FormData()
        fd.append('audio', blob, 'rec.webm')
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          if (res.ok) {
            const d = await res.json()
            if (d.text) setTranscript(d.text)
          }
        } catch (err) {}
      }
      mr.start()
      mrRef.current = mr
      setIsRecording(true)
    } catch (e) {
      const msg = 'Microphone error: ' + e.message
      showToast(msg, 'error')
      setMicError(msg)
    }
  }

  function stopRecording() {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop()
    }
    setIsRecording(false)
  }

  async function runScore() {
    if (!q || !transcript.trim()) return
    setScoring(true)
    const kwScore = scoreKeywords(transcript, q.required_keywords || [])
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCode: q.question_code,
          officerQuestion: q.officer_question_en,
          correctAnswer: q.simple_driver_answer_en,
          keywords: q.required_keywords || [],
          userAnswer: transcript,
          userLanguage: lang
        })
      })
      if (res.ok) {
        const d = await res.json()
        setScoreData(d)
        markStatus(q.question_code, 'viewed', d.score, transcript)
      } else {
        setScoreData({ score: kwScore, feedback: null, wordScores: null })
        markStatus(q.question_code, 'viewed', kwScore, transcript)
      }
    } catch {
      setScoreData({ score: kwScore, feedback: null, wordScores: null })
      markStatus(q.question_code, 'viewed', kwScore, transcript)
    }
    setScoring(false)
  }

  if (!q) return (
    <AppShell lang={lang} setLang={setLang} stats={stats}>
      <div className="card" style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
        {tx('noQ')}
      </div>
    </AppShell>
  )

  const diffClass = q.difficulty === 'Beginner' ? 'badge-green' : q.difficulty === 'Mock Test' ? 'badge-red' : 'badge-amber'
  const scoreColor = scoreData ? (scoreData.score >= 80 ? 'var(--green)' : scoreData.score >= 55 ? 'var(--amber)' : 'var(--red)') : 'var(--muted)'

  const topbarActions = (
    <>
      <button
        type="button"
        className="tpa-btn"
        onClick={goPrev}
        disabled={safeIdx === 0}
        aria-label={tx('prev')}
        title={tx('prev')}
      >⏮</button>
      <button
        type="button"
        className="tpa-btn"
        onClick={() => { unlockAudio(); if (autoPlayRef.current) stopAutoPlay(); speak(q.officer_question_en, mode === 'listen' ? listenRate : 1) }}
        aria-label={tx('playQ')}
        title={tx('playQ')}
      >🔊</button>
      {mode === 'speak' && (
        <button
          type="button"
          className={`tpa-btn ${isRecording ? 'tpa-rec' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? tx('stopRec') : tx('startRec')}
          title={isRecording ? tx('stopRec') : tx('startRec')}
        >{isRecording ? '⏹' : '🎤'}</button>
      )}
      <button
        type="button"
        className="tpa-btn"
        onClick={goNext}
        disabled={safeIdx >= filtered.length - 1}
        aria-label={tx('next')}
        title={tx('next')}
      >⏭</button>
    </>
  )

  return (
    <AppShell lang={lang} setLang={setLang} stats={stats} topbarActions={topbarActions}>
      {/* Category + difficulty chips (Terms-style, single-line scrollable on phone) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={chipRowStyle}>
          <button
            className={`btn ${filterCat === 'all' ? 'btn-primary' : ''}`}
            style={chipBtnStyle}
            onClick={() => { setFilterCat('all'); setQIdx(0) }}
          >
            {tx('all')}
          </button>
          {Q_CATEGORIES.map(c => (
            <button
              key={c}
              className={`btn ${filterCat === c ? 'btn-primary' : ''}`}
              style={chipBtnStyle}
              onClick={() => { setFilterCat(c); setQIdx(0) }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ ...chipRowStyle, marginTop: 6 }}>
          <button
            className={`btn ${filterDiff === 'all' ? 'btn-primary' : ''}`}
            style={chipBtnStyle}
            onClick={() => { setFilterDiff('all'); setQIdx(0) }}
          >
            {tx('all')}
          </button>
          {Q_DIFFICULTIES.map(d => (
            <button
              key={d}
              className={`btn ${filterDiff === d ? 'btn-primary' : ''}`}
              style={chipBtnStyle}
              onClick={() => { setFilterDiff(d); setQIdx(0) }}
            >
              {d}
            </button>
          ))}
        </div>
        <label style={{ cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6,
          marginTop:10, fontSize:'.83rem', fontWeight:500, color:'var(--ink2)',
          textTransform:'none', letterSpacing:0 }}>
          <input type="checkbox" checked={reviewOnly}
            onChange={e => setReviewOnly(e.target.checked)}
            style={{ width:'auto', accentColor:'var(--brand)' }} />
          {tx('reviewOnly')}
        </label>
      </div>

      {/* Question card */}
      <div className="card">
        {/* Meta row */}
        <div className="flex-c mb-8">
          <span className={`badge ${diffClass}`}>{q.difficulty}</span>
          <span className="badge badge-gray">{q.category}</span>
          {p?.status === 'understood' && <span className="badge badge-green">✓ Understood</span>}
          {p?.status === 'needs_review' && <span className="badge badge-amber">⚑ Review</span>}
          {p?.score != null && <span className="badge badge-gray">{p.score}/100</span>}
        </div>

        {/* Phone: just position indicator (Prev/Next live in top bar) */}
        <div className="hide-on-desktop" style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
          <span style={{ fontSize:'.74rem', color:'var(--muted)', fontWeight:600 }}>
            {filtered.length ? `${safeIdx + 1} / ${filtered.length}` : ''}
          </span>
        </div>

        {/* Desktop: in-page Prev/Next bar */}
        <div className="hide-on-phone" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:10 }}>
          <button className="btn btn-sm" onClick={goPrev} disabled={safeIdx === 0}>{tx('prev')}</button>
          <span style={{ fontSize:'.74rem', color:'var(--muted)', fontWeight:600 }}>
            {filtered.length ? `${safeIdx + 1} / ${filtered.length}` : ''}
          </span>
          <button className="btn btn-sm btn-primary" onClick={goNext} disabled={safeIdx === filtered.length - 1}>{tx('next')}</button>
        </div>

        {/* Officer question */}
        <div style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--muted)', marginBottom:4 }}>
          👮 {tx('officer')}
        </div>
        <p className="q-officer">{q.officer_question_en}</p>

        {/* Listen controls — Play Q is desktop-only (phone uses top bar); speed + auto-play universal */}
        {mode === 'listen' && (
          <div className="flex-c mt-8">
            <button className="btn btn-sm hide-on-phone" onClick={() => { unlockAudio(); if (autoPlayRef.current) stopAutoPlay(); speak(q.officer_question_en, listenRate) }}>{tx('playQ')}</button>
            {[{label:tx('slow'),v:.7},{label:tx('normal'),v:1},{label:tx('fast'),v:1.3}].map(s => (
              <button key={s.v} className={`btn btn-sm ${listenRate===s.v ? 'btn-primary' : ''}`}
                onClick={() => setListenRate(s.v)}>{s.label}</button>
            ))}
            {isAutoPlaying
              ? <button className="btn btn-sm btn-danger" onClick={stopAutoPlay}>{tx('stopPlay')}</button>
              : <button className="btn btn-sm btn-success" onClick={startAutoPlay}>{tx('autoPlay')}</button>
            }
          </div>
        )}

        {/* Standard answer */}
        <div style={{ fontSize:'.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--muted)', margin:'14px 0 4px' }}>
          ✅ {tx('answer')}
        </div>
        <div className="answer-block">{q.simple_driver_answer_en}</div>

        {/* Play Q for text mode — desktop-only (phone uses top bar) */}
        {mode === 'text' && (
          <button className="btn btn-sm mt-8 hide-on-phone" onClick={() => { unlockAudio(); speak(q.officer_question_en, 1) }}>{tx('playQ')}</button>
        )}

        {/* Explanation — always visible, full Q + proper response in selected language */}
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
                background:'var(--brand)', color:'#fff', letterSpacing:0, fontWeight:700
              }}>{lang.toUpperCase()}</span>
            </div>
            <p style={{ fontSize:'.88rem', lineHeight:1.65, color:'var(--ink)', margin:0 }}>
              {getExplanation(q, lang)}
            </p>
          </div>
        )}

        {/* Q&A translation — replaces the old Keywords field on Listening + Speak modes.
            Auto-fetches via /api/translate; shows cached translation immediately on revisit. */}
        {lang !== 'en' && (() => {
          const trans = qaTrans[`${q.question_code}-${lang}`]
          return (
            <div style={{
              marginTop: 10,
              padding: '12px 14px',
              background: 'var(--bg2)',
              borderRadius: 6,
              border: '1px solid var(--line)',
            }}>
              <div style={{
                fontSize:'.7rem', fontWeight:700, textTransform:'uppercase',
                letterSpacing:'.06em', color:'var(--muted)', marginBottom:8,
                display:'flex', alignItems:'center', gap:8
              }}>
                <span>🌐 {tx('qaTrans')}</span>
                <span style={{
                  fontSize:'.62rem', padding:'1px 6px', borderRadius:4,
                  background:'var(--green)', color:'#fff', letterSpacing:0, fontWeight:700
                }}>{lang.toUpperCase()}</span>
              </div>
              {!trans ? (
                <p style={{ fontSize:'.85rem', color:'var(--muted)', margin:0, fontStyle:'italic' }}>
                  {tx('translating')}
                </p>
              ) : (
                <>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--muted)', marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>
                      👮 {tx('officer')}
                    </div>
                    <div style={{ fontSize:'.92rem', lineHeight:1.55, color:'var(--ink)' }}>
                      {trans.q}
                    </div>
                    <div style={{ fontSize:'.88rem', lineHeight:1.65, color:'var(--muted)', marginTop:2, fontStyle:'italic' }}>
                      {q.officer_question_en}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'.68rem', fontWeight:700, color:'var(--muted)', marginBottom:3, textTransform:'uppercase', letterSpacing:'.05em' }}>
                      ✅ {tx('answer')}
                    </div>
                    <div style={{ fontSize:'.92rem', lineHeight:1.55, color:'var(--ink)' }}>
                      {trans.a}
                    </div>
                    <div style={{ fontSize:'.88rem', lineHeight:1.65, color:'var(--muted)', marginTop:2, fontStyle:'italic' }}>
                      {q.simple_driver_answer_en}
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {q.common_mistakes?.length > 0 && (
          <details>
            <summary>⚠️ {tx('mistakes')}</summary>
            <ul style={{ paddingLeft:'1.2em' }}>
              {q.common_mistakes.map((m,i) => <li key={i} style={{ fontSize:'.84rem', color:'var(--ink2)', marginBottom:4 }}>{m}</li>)}
            </ul>
          </details>
        )}

        {/* Speaking + AI scoring mode */}
        {mode === 'speak' && (
          <div style={{ marginTop:16, background:'var(--bg3)', borderRadius:'var(--rs)', border:'1px solid var(--line)', padding:16 }}>
            <div style={{ fontWeight:700, fontSize:'.82rem', marginBottom:10 }}>🎤 {tx('speakTitle')}</div>

            {/* Recording zone — desktop keeps full controls; phone gets status only when recording (Start/Stop in top bar) */}
            <div className={`rec-zone ${isRecording ? 'recording' : 'hide-on-phone'}`}>
              {isRecording ? (
                <>
                  <span className="rec-dot" />
                  <span style={{ fontSize:'.84rem', fontWeight:600, color:'var(--red)' }}>Recording…</span>
                  <div className="waveform" style={{ marginTop:8 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ height: 8 + Math.random()*20 + 'px' }} />)}
                  </div>
                  <button className="btn btn-danger btn-sm hide-on-phone" style={{ marginTop:8 }} onClick={stopRecording}>{tx('stopRec')}</button>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'.84rem', color:'var(--muted)', marginBottom:8 }}>Tap to record your English answer</div>
                  <div className="flex-c" style={{ justifyContent:'center', gap:8 }}>
                    <button className="btn btn-primary" onClick={startRecording}>{tx('startRec')}</button>
                    <button className="btn btn-sm" onClick={() => { unlockAudio(); speak(q.officer_question_en, 1) }}>{tx('playQ')}</button>
                  </div>
                </>
              )}
            </div>

            {micError && <InlineAlert type="error">{micError}</InlineAlert>}

            <label style={{ marginTop:12 }}>Your answer (edit if needed)</label>
            <textarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder={tx('typeHere')}
              style={{ marginTop:5 }}
            />
            <div className="actions">
              <button className="btn btn-primary" onClick={runScore} disabled={scoring || !transcript.trim()}>
                {scoring ? '…' : tx('scoreBtn')}
              </button>
              <button className="btn btn-sm" onClick={() => { setTranscript(''); setScoreData(null) }}>{tx('clearAns')}</button>
            </div>

            {/* Score result */}
            {scoreData && (
              <div className="pron-result" style={{ marginTop:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                  <div className={`score-ring ${scoreData.score >= 80 ? '' : scoreData.score >= 55 ? 'amber' : 'red'}`}
                    style={{ borderColor: scoreColor }}>
                    <span className="score-num-big" style={{ color: scoreColor }}>{scoreData.score}</span>
                    <span className="score-label-sm">/100</span>
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'.92rem' }}>{tx('scoreTitle')}</div>
                    {scoreData.feedback && <p style={{ fontSize:'.84rem', color:'var(--ink2)', marginTop:4 }}>{scoreData.feedback}</p>}
                    <div style={{ marginTop:4 }}>
                      <span className={`badge ${scoreData.score>=80?'badge-green':scoreData.score>=55?'badge-amber':'badge-red'}`}>
                        {scoreData.score>=80 ? tx('good') : scoreData.score>=55 ? tx('partial') : tx('bad')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bar">
                  <div className="bar-fill" style={{ width:scoreData.score+'%', background:scoreColor }} />
                </div>

                {/* Word-level pronunciation */}
                {scoreData.wordScores?.length > 0 && (
                  <div style={{ marginTop:12 }}>
                    <div style={{ fontSize:'.72rem', fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>
                      {tx('pronTitle')}
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {scoreData.wordScores.map((w,i) => (
                        <span key={i} className={`pron-word ${w.score>=80?'good':w.score>=55?'ok':'miss'}`}
                          title={`Score: ${w.score}/100`}>
                          {w.word}
                        </span>
                      ))}
                    </div>
                    <div className="flex-c mt-8" style={{ fontSize:'.74rem', color:'var(--muted)' }}>
                      <span><span className="pron-word good" style={{ fontSize:'.72rem' }}>word</span> = {tx('pronGood')}</span>
                      <span><span className="pron-word ok" style={{ fontSize:'.72rem' }}>word</span> = {tx('pronOk')}</span>
                      <span><span className="pron-word miss" style={{ fontSize:'.72rem' }}>word</span> = {tx('pronMiss')}</span>
                    </div>
                  </div>
                )}

                <div style={{ marginTop:12, fontSize:'.82rem', fontWeight:600, color:'var(--muted)' }}>{tx('betterAns')}:</div>
                <div className="answer-block" style={{ marginTop:4 }}>{q.simple_driver_answer_en}</div>
              </div>
            )}
          </div>
        )}

        {/* Bottom actions — review / understood. Prev/Next live at top of card. */}
        <div className="flex-c" style={{ marginTop:16, justifyContent:'space-between', gap:8 }}>
          <button className="btn btn-amber btn-sm" onClick={() => markStatus(q.question_code, 'needs_review')}>
            {tx('needReview')}
          </button>
          <button className="btn btn-success" onClick={() => {
            markStatus(q.question_code, 'understood')
            goNext()
          }}>{tx('understood')}</button>
        </div>
      </div>
    </AppShell>
  )
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="loading-wrap"><div className="spinner"/><p>Loading practice…</p></div>}>
      <PracticeInner />
    </Suspense>
  )
}
