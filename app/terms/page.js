'use client'
import { useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { TERMS, TERM_CATEGORIES } from '@/lib/terms'

// ── TTS helpers ──────────────────────────────────────────────
// Token-based cancellation: every stop bumps the token; in-flight playback
// checks myToken !== activeToken and bails. Avoids the shared-flag race.
let currentAudio = null
let activeToken = 0

function stopTermAudio() {
  activeToken++
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = '' } catch {}
    currentAudio = null
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel() } catch {}
  }
}

// Fetch the TTS audio blob (no playback). Returns null on any failure.
async function ttsFetch(text, voiceId) {
  if (!text) return null
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId, speed: 0.95 }),
    })
    if (!res.ok) return null
    return await res.blob()
  } catch { return null }
}

// Play a pre-fetched blob. Resolves on onended/onerror, on play() rejection,
// or after 20s safety cap (in case the audio stalls without firing onended).
function playBlob(blob, token) {
  return new Promise(resolve => {
    if (!blob || token !== activeToken) return resolve()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentAudio = audio
    let done = false
    const finish = () => {
      if (done) return
      done = true
      try { URL.revokeObjectURL(url) } catch {}
      if (currentAudio === audio) currentAudio = null
      resolve()
    }
    audio.onended = finish
    audio.onerror = finish
    audio.play().catch(finish)
    setTimeout(finish, 20000)
  })
}

// Fallback: speechSynthesis with pitch shift to distinguish voices.
function playSynth(text, voiceId, token) {
  return new Promise(resolve => {
    if (token !== activeToken) return resolve()
    if (typeof window === 'undefined' || !window.speechSynthesis) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.95
    u.pitch = voiceId === 'south_m' ? 1.15 : 0.8
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
    // Chrome's cancel+speak race can swallow onend; safety cap.
    setTimeout(finish, 15000)
  })
}

async function playLineOrFallback(text, voiceId, blob, token) {
  if (token !== activeToken) return
  if (blob) await playBlob(blob, token)
  else await playSynth(text, voiceId, token)
}

async function speakTermLine(text) {
  if (!text) return
  stopTermAudio()
  const myToken = activeToken
  const blob = await ttsFetch(text, 'north_m')
  if (myToken !== activeToken) return
  await playLineOrFallback(text, 'north_m', blob, myToken)
}

async function speakConversation(inspector, driver) {
  stopTermAudio()
  const myToken = activeToken
  // Pre-fetch BOTH blobs in parallel at click time. By the time inspector
  // finishes playing, the driver blob is already in memory — no second
  // network call mid-playback, so no race against rate-limit / network
  // flake / autoplay-policy edge cases.
  const [iBlob, dBlob] = await Promise.all([
    ttsFetch(inspector, 'north_m'),
    ttsFetch(driver, 'south_m'),
  ])
  if (myToken !== activeToken) return

  await playLineOrFallback(inspector, 'north_m', iBlob, myToken)
  if (myToken !== activeToken) return

  await new Promise(r => setTimeout(r, 400))
  if (myToken !== activeToken) return

  await playLineOrFallback(driver, 'south_m', dBlob, myToken)
}

// ── i18n ─────────────────────────────────────────────────────
const T = {
  en: { title: '📚 Trucking Terms', subtitle: 'Roadside vocabulary in 6 languages with real inspector–driver conversation examples',
    all: 'All', translation: 'Translation', conversation: 'Conversation example', inspector: 'Inspector', driver: 'Driver',
    hear: '🔊 Hear term', playConv: '🎙️ Play conversation', empty: 'No terms match.' },
  zh: { title: '📚 卡车术语', subtitle: '6 种语言的路检词汇，附真实路检官-司机对话示例',
    all: '全部', translation: '翻译', conversation: '对话示例', inspector: '路检官', driver: '司机',
    hear: '🔊 朗读术语', playConv: '🎙️ 播放对话', empty: '没有匹配的术语。' },
  es: { title: '📚 Términos de camiones', subtitle: 'Vocabulario de inspección en 6 idiomas con ejemplos reales de conversación',
    all: 'Todos', translation: 'Traducción', conversation: 'Ejemplo de conversación', inspector: 'Inspector', driver: 'Conductor',
    hear: '🔊 Escuchar', playConv: '🎙️ Reproducir conversación', empty: 'Sin coincidencias.' },
  hi: { title: '📚 ट्रकिंग शब्दावली', subtitle: '6 भाषाओं में सड़क जांच शब्दावली, असली बातचीत के साथ',
    all: 'सभी', translation: 'अनुवाद', conversation: 'बातचीत का उदाहरण', inspector: 'निरीक्षक', driver: 'चालक',
    hear: '🔊 शब्द सुनें', playConv: '🎙️ बातचीत चलाएं', empty: 'कोई शब्द नहीं मिला।' },
  pa: { title: '📚 ਟਰੱਕਿੰਗ ਸ਼ਬਦਾਵਲੀ', subtitle: '6 ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਜਾਂਚ ਸ਼ਬਦ, ਅਸਲੀ ਗੱਲਬਾਤ ਉਦਾਹਰਣਾਂ ਨਾਲ',
    all: 'ਸਾਰੇ', translation: 'ਅਨੁਵਾਦ', conversation: 'ਗੱਲਬਾਤ ਉਦਾਹਰਣ', inspector: 'ਨਿਰੀਖਕ', driver: 'ਡਰਾਈਵਰ',
    hear: '🔊 ਸ਼ਬਦ ਸੁਣੋ', playConv: '🎙️ ਗੱਲਬਾਤ ਚਲਾਓ', empty: 'ਕੋਈ ਸ਼ਬਦ ਨਹੀਂ ਮਿਲਿਆ।' },
  vi: { title: '📚 Thuật ngữ vận tải', subtitle: 'Từ vựng kiểm tra đường bộ trong 6 ngôn ngữ kèm hội thoại thực tế',
    all: 'Tất cả', translation: 'Bản dịch', conversation: 'Ví dụ hội thoại', inspector: 'Thanh tra', driver: 'Tài xế',
    hear: '🔊 Nghe từ', playConv: '🎙️ Phát hội thoại', empty: 'Không có thuật ngữ phù hợp.' },
}
function tt(lang, key) { return (T[lang] || T.en)[key] ?? T.en[key] ?? key }

function categoryName(cat, lang) {
  return cat[`name_${lang}`] || cat.name_en
}

export default function TermsPage() {
  const [lang, setLang] = useState('zh')
  const [filterCat, setFilterCat] = useState('all')

  const filtered = useMemo(() => TERMS.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    return true
  }), [filterCat])

  return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="drive-header" style={{ marginBottom: 14 }}>
        <h1>{tt(lang, 'title')}</h1>
        <p>{tt(lang, 'subtitle')}</p>
      </div>

      {/* Category filter chips */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="flex-c" style={{ flexWrap: 'wrap', gap: 6 }}>
          <button
            className={`btn btn-sm ${filterCat === 'all' ? 'btn-primary' : ''}`}
            onClick={() => setFilterCat('all')}
          >
            {tt(lang, 'all')}
          </button>
          {TERM_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`btn btn-sm ${filterCat === cat.id ? 'btn-primary' : ''}`}
              onClick={() => setFilterCat(cat.id)}
            >
              {cat.icon} {categoryName(cat, lang)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          {tt(lang, 'empty')}
        </div>
      )}

      {filtered.map(term => {
        const key = `${term.category}-${term.en}`
        const selectedTrans = lang === 'en' ? null : term[lang]
        const hasConv = !!(term.inspector || term.driver)
        return (
          <div key={key} className="card" style={{ marginBottom: 10 }}>
            {/* Header: English term + translation */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: '.98rem', color: 'var(--ink)', marginBottom: 4 }}>
                {term.en}
              </div>
              {selectedTrans && (
                <div style={{ fontSize: '.92rem', color: 'var(--brand)', fontWeight: 600 }}>
                  {selectedTrans}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex-c" style={{ flexWrap: 'wrap', gap: 6, marginBottom: hasConv ? 8 : 0 }}>
              <button className="btn btn-sm btn-success" onClick={() => speakTermLine(term.en)}>
                {tt(lang, 'hear')}
              </button>
              {hasConv && (
                <button className="btn btn-sm btn-primary" onClick={() => speakConversation(term.inspector, term.driver)}>
                  {tt(lang, 'playConv')}
                </button>
              )}
            </div>

            {/* Conversation example — click-to-expand (listening-layout style) */}
            {hasConv && (
              <details style={{ marginTop: 4 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--muted)', fontSize: '.85rem' }}>
                  💬 {tt(lang, 'conversation')}
                </summary>
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {/* English conversation */}
                  <div style={{ flex: '1 1 240px', padding: 10, background: 'var(--bg3)', borderRadius: 6, borderLeft: '3px solid var(--brand)', fontSize: '.85rem', lineHeight: 1.55 }}>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>EN</div>
                    <div style={{ marginBottom: 4 }}>
                      <strong>{tt(lang, 'inspector')}:</strong> {term.inspector}
                    </div>
                    <div>
                      <strong>{tt(lang, 'driver')}:</strong> {term.driver}
                    </div>
                  </div>
                  {/* Selected-language conversation (skip if lang is en) */}
                  {lang !== 'en' && term.convTrans?.[lang] && (
                    <div style={{ flex: '1 1 240px', padding: 10, background: 'var(--bg2)', borderRadius: 6, borderLeft: '3px solid var(--green)', fontSize: '.85rem', lineHeight: 1.55 }}>
                      <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{lang.toUpperCase()}</div>
                      <div style={{ marginBottom: 4 }}>
                        <strong>{tt(lang, 'inspector')}:</strong> {term.convTrans[lang].inspector}
                      </div>
                      <div>
                        <strong>{tt(lang, 'driver')}:</strong> {term.convTrans[lang].driver}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        )
      })}
    </AppShell>
  )
}
