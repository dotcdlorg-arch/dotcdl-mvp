'use client'
import { useState } from 'react'
import Image from 'next/image'
import AppShell from '@/components/AppShell'
import { SIGNS, S_CATEGORIES, getExplanation, scoreKeywords } from '@/lib/data'

export default function SignsPage() {
  const [lang, setLang] = useState('zh')
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState(null)
  const [progress, setProgress] = useState({})

  const filtered = SIGNS.filter(s => {
    if (filterCat !== 'all' && s.category !== filterCat) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
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

  return (
    <AppShell lang={lang} setLang={setLang} stats={stats}>
      <div className="toolbar">
        <select className="grow" value={filterCat} onChange={e => { setFilterCat(e.target.value); setIdx(0); setResult(null); setAnswer('') }}>
          <option value="all">All Categories</option>
          {S_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="search" className="grow" placeholder="Search sign name…" value={search}
          onChange={e => { setSearch(e.target.value); setIdx(0); setResult(null); setAnswer('') }} />
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

        <label>Your English answer — explain this sign and what a driver must do</label>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={`This sign means ${sign.meaning.toLowerCase()}. As a driver, I should ${sign.action.toLowerCase()}.`}
          style={{ marginTop:6 }}
        />

        <div className="actions">
          <button className="btn btn-primary" onClick={checkAnswer} disabled={!answer.trim()}>✓ Check Answer</button>
          <button className="btn" onClick={() => setResult({ score: null, revealed: true })}>👁 Reveal Answer</button>
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

        <div className="pager" style={{ marginTop:16 }}>
          <button className="btn" onClick={prev} disabled={idx === 0}>← Prev</button>
          <span className="text-muted text-sm">{pct}% complete</span>
          <button className="btn btn-primary" onClick={next}>Next Sign →</button>
        </div>
      </div>
    </AppShell>
  )
}
