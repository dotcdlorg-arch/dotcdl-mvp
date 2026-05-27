'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import AppShell from '@/components/AppShell'
import { SIGNS, S_CATEGORIES, getExplanation, scoreKeywords } from '@/lib/data'

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

let currentSignAudio = null
async function speakSignAnswer(text) {
  if (currentSignAudio) { try { currentSignAudio.pause() } catch {}; currentSignAudio = null }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: 'north_m', speed: 0.95 }),
    })
    if (!res.ok) throw new Error('TTS ' + res.status)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentSignAudio = audio
    audio.onended = () => { URL.revokeObjectURL(url); if (currentSignAudio === audio) currentSignAudio = null }
    audio.onerror = () => { URL.revokeObjectURL(url); if (currentSignAudio === audio) currentSignAudio = null }
    await audio.play()
  } catch {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
  }
}

export default function SignsPage() {
  const [lang, setLang] = useState('zh')
  const [filterCat, setFilterCat] = useState('all')
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState({})

  // Filtered + shuffled signs. Random order, re-shuffles only when filter
  // changes — not on every render — so navigation stays stable.
  const filtered = useMemo(() => {
    const list = SIGNS.filter(s => {
      if (filterCat !== 'all' && s.category !== filterCat) return false
      return true
    })
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [filterCat])
  const sign = filtered[Math.min(idx, filtered.length - 1)]
  const pct = filtered.length > 0 ? Math.round((idx + 1) / filtered.length * 100) : 0

  function checkAnswer() {
    if (!sign || !answer.trim()) return
    const score = scoreKeywords(answer, sign.keywords || [])
    setResult({ score, revealed: false })
    setProgress(prev => ({ ...prev, [sign.sign_code]: score }))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signCode: sign.sign_code, score, answer, type: 'sign' })
    }).catch(() => {})
  }

  function next() { setIdx(i => (i + 1) % filtered.length); setAnswer(''); setResult(null) }
  function prev() { setIdx(i => Math.max(0, i - 1)); setAnswer(''); setResult(null) }

  const stats = {
    seen: Object.keys(progress).length, total: SIGNS.length,
    understood: Object.values(progress).filter(x => x >= 80).length,
    review: Object.values(progress).filter(x => x > 0 && x < 55).length,
  }

  if (!sign) return (
    <AppShell lang={lang} setLang={setLang} stats={stats}>
      <div className="card" style={{ textAlign:'center', color:'var(--muted)', padding:48 }}>No signs found</div>
    </AppShell>
  )

  const scoreColor = result ? (result.score>=80?'var(--green)':result.score>=55?'var(--amber)':'var(--red)') : 'var(--muted)'

  const topbarActions = (
    <>
      <button
        type="button"
        className="tpa-btn"
        onClick={prev}
        disabled={idx === 0}
        aria-label="Previous"
        title="Previous"
      >⏮</button>
      <button
        type="button"
        className="tpa-btn"
        onClick={() => speakSignAnswer(`This sign means ${sign.meaning}. As a driver, I should ${sign.action}.`)}
        aria-label="Hear answer"
        title="Hear answer"
      >🔊</button>
      <button
        type="button"
        className="tpa-btn"
        onClick={() => setResult({ score: null, revealed: true })}
        aria-label="Reveal answer"
        title="Reveal answer"
      >👁</button>
      <button
        type="button"
        className="tpa-btn"
        onClick={next}
        aria-label="Next"
        title="Next"
      >⏭</button>
    </>
  )

  return (
    <AppShell lang={lang} setLang={setLang} stats={stats} topbarActions={topbarActions}>
      {/* Category chips (Terms-style, single-line scrollable on phone) */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div style={chipRowStyle}>
          <button
            className={`btn ${filterCat === 'all' ? 'btn-primary' : ''}`}
            style={chipBtnStyle}
            onClick={() => { setFilterCat('all'); setIdx(0); setResult(null); setAnswer('') }}
          >
            All
          </button>
          {S_CATEGORIES.map(c => (
            <button
              key={c}
              className={`btn ${filterCat === c ? 'btn-primary' : ''}`}
              style={chipBtnStyle}
              onClick={() => { setFilterCat(c); setIdx(0); setResult(null); setAnswer('') }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="between mb-8">
          <span className="badge badge-gray">{sign.category}</span>
          {progress[sign.sign_code] != null && (
            <span className={`badge ${progress[sign.sign_code]>=80?'badge-green':progress[sign.sign_code]>=55?'badge-amber':'badge-red'}`}>
              {progress[sign.sign_code]}/100
            </span>
          )}
        </div>

        <div className="bar bar-thin"><div className="bar-fill brand" style={{ width:pct+'%' }} /></div>

        <div className="sign-img-wrap">
          <Image
            src={`/signs/${sign.sign_code}.png`}
            alt={sign.name}
            width={220} height={220}
            style={{ objectFit:'contain', maxHeight:220 }}
            onError={e => { e.target.style.display='none'; e.target.nextSibling?.removeAttribute('style') }}
          />
          <div className="sign-text-fallback" style={{ display:'none' }}>{sign.name}</div>
        </div>

        <p style={{ fontWeight:800, fontSize:'1rem', marginBottom:12 }}>{sign.name}</p>

        {/* Desktop: full Prev/Next bar */}
        <div className="hide-on-phone" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:12 }}>
          <button className="btn btn-sm" onClick={prev} disabled={idx === 0}>← Prev</button>
          <span style={{ fontSize:'.74rem', color:'var(--muted)', fontWeight:600 }}>{pct}% complete</span>
          <button className="btn btn-sm btn-primary" onClick={next}>Next Sign →</button>
        </div>

        {/* Phone: just progress (Prev/Next live in top bar) */}
        <div className="hide-on-desktop" style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <span style={{ fontSize:'.74rem', color:'var(--muted)', fontWeight:600 }}>{pct}% complete</span>
        </div>

        <label>Your English answer — explain this sign and what a driver must do</label>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={`This sign means ${sign.meaning.toLowerCase()}. As a driver, I should ${sign.action.toLowerCase()}.`}
          style={{ marginTop:6 }}
        />

        <div className="actions">
          <button className="btn btn-primary" onClick={checkAnswer} disabled={!answer.trim()}>✓ Check Answer</button>
          <button className="btn hide-on-phone" onClick={() => setResult({ score: null, revealed: true })}>👁 Reveal Answer</button>
          <button className="btn btn-success btn-sm hide-on-phone" onClick={() => speakSignAnswer(`This sign means ${sign.meaning}. As a driver, I should ${sign.action}.`)}>🔊 Hear answer</button>
          <button className="btn btn-sm" onClick={() => { setAnswer(''); setResult(null) }}>Clear</button>
        </div>

        {result && (
          <div style={{ marginTop:16 }}>
            {result.score != null && (
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
                <div className="score-ring" style={{ borderColor:scoreColor }}>
                  <span className="score-num-big" style={{ color:scoreColor }}>{result.score}</span>
                  <span className="score-label-sm">/100</span>
                </div>
                <div>
                  <div className="bar" style={{ width:200, marginBottom:4 }}>
                    <div className="bar-fill" style={{ width:result.score+'%', background:scoreColor }} />
                  </div>
                  <span className={`badge ${result.score>=80?'badge-green':result.score>=55?'badge-amber':'badge-red'}`}>
                    {result.score>=80?'Great answer!':result.score>=55?'Partially correct':'Needs practice'}
                  </span>
                </div>
              </div>
            )}
            <div className="answer-block">
              <p><strong>Name:</strong> {sign.name}</p>
              <p style={{ marginTop:5 }}><strong>Meaning:</strong> {sign.meaning}</p>
              <p style={{ marginTop:5 }}><strong>Driver action:</strong> {sign.action}</p>
              {getExplanation(sign, lang) && (
                <p style={{ marginTop:8, fontSize:'.84rem', color:'var(--muted)' }}>{getExplanation(sign, lang)}</p>
              )}
              {sign.keywords?.length > 0 && (
                <div className="chips" style={{ marginTop:8 }}>
                  {sign.keywords.map(k => <span key={k} className="chip">{k}</span>)}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
