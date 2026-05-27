'use client'
import { useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { TERMS, TERM_CATEGORIES } from '@/lib/terms'

// ── TTS helpers ──────────────────────────────────────────────
let currentTermAudio = null
let convCancelled = false

function stopAllTermAudio() {
  convCancelled = true
  if (currentTermAudio) { try { currentTermAudio.pause() } catch {}; currentTermAudio = null }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}

function playLine(text, voiceId) {
  return new Promise(async resolve => {
    if (!text) return resolve()
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, speed: 0.95 }),
      })
      if (!res.ok) throw new Error('TTS ' + res.status)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentTermAudio = audio
      const cleanup = () => {
        URL.revokeObjectURL(url)
        if (currentTermAudio === audio) currentTermAudio = null
        resolve()
      }
      audio.onended = cleanup
      audio.onerror = cleanup
      await audio.play()
    } catch {
      // Fallback to browser synthesis with pitch shift to distinguish voices
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'; u.rate = 0.95
        u.pitch = voiceId === 'south_m' ? 1.1 : 0.85
        u.onend = resolve
        u.onerror = resolve
        window.speechSynthesis.speak(u)
      } else {
        resolve()
      }
    }
  })
}

async function speakTermLine(text) {
  if (!text) return
  stopAllTermAudio()
  convCancelled = false
  await playLine(text, 'north_m')
}

async function speakConversation(inspector, driver) {
  stopAllTermAudio()
  convCancelled = false
  await playLine(inspector, 'north_m')
  if (convCancelled) return
  // brief pause between speakers
  await new Promise(r => setTimeout(r, 400))
  if (convCancelled) return
  await playLine(driver, 'south_m')
}

// ── i18n ─────────────────────────────────────────────────────
const T = {
  en: { title: '📚 Trucking Terms', subtitle: 'Roadside vocabulary in 6 languages with real inspector–driver conversation examples',
    all: 'All', search: 'Search terms…', translation: 'Translation', conversation: 'Conversation example', inspector: 'Inspector', driver: 'Driver',
    hear: '🔊 Hear term', playConv: '🎙️ Play conversation', empty: 'No terms match.' },
  zh: { title: '📚 卡车术语', subtitle: '6 种语言的路检词汇，附真实路检官-司机对话示例',
    all: '全部', search: '搜索术语…', translation: '翻译', conversation: '对话示例', inspector: '路检官', driver: '司机',
    hear: '🔊 朗读术语', playConv: '🎙️ 播放对话', empty: '没有匹配的术语。' },
  es: { title: '📚 Términos de camiones', subtitle: 'Vocabulario de inspección en 6 idiomas con ejemplos reales de conversación',
    all: 'Todos', search: 'Buscar términos…', translation: 'Traducción', conversation: 'Ejemplo de conversación', inspector: 'Inspector', driver: 'Conductor',
    hear: '🔊 Escuchar', playConv: '🎙️ Reproducir conversación', empty: 'Sin coincidencias.' },
  hi: { title: '📚 ट्रकिंग शब्दावली', subtitle: '6 भाषाओं में सड़क जांच शब्दावली, असली बातचीत के साथ',
    all: 'सभी', search: 'शब्द खोजें…', translation: 'अनुवाद', conversation: 'बातचीत का उदाहरण', inspector: 'निरीक्षक', driver: 'चालक',
    hear: '🔊 शब्द सुनें', playConv: '🎙️ बातचीत चलाएं', empty: 'कोई शब्द नहीं मिला।' },
  pa: { title: '📚 ਟਰੱਕਿੰਗ ਸ਼ਬਦਾਵਲੀ', subtitle: '6 ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਜਾਂਚ ਸ਼ਬਦ, ਅਸਲੀ ਗੱਲਬਾਤ ਉਦਾਹਰਣਾਂ ਨਾਲ',
    all: 'ਸਾਰੇ', search: 'ਸ਼ਬਦ ਖੋਜੋ…', translation: 'ਅਨੁਵਾਦ', conversation: 'ਗੱਲਬਾਤ ਉਦਾਹਰਣ', inspector: 'ਨਿਰੀਖਕ', driver: 'ਡਰਾਈਵਰ',
    hear: '🔊 ਸ਼ਬਦ ਸੁਣੋ', playConv: '🎙️ ਗੱਲਬਾਤ ਚਲਾਓ', empty: 'ਕੋਈ ਸ਼ਬਦ ਨਹੀਂ ਮਿਲਿਆ।' },
  vi: { title: '📚 Thuật ngữ vận tải', subtitle: 'Từ vựng kiểm tra đường bộ trong 6 ngôn ngữ kèm hội thoại thực tế',
    all: 'Tất cả', search: 'Tìm thuật ngữ…', translation: 'Bản dịch', conversation: 'Ví dụ hội thoại', inspector: 'Thanh tra', driver: 'Tài xế',
    hear: '🔊 Nghe từ', playConv: '🎙️ Phát hội thoại', empty: 'Không có thuật ngữ phù hợp.' },
}
function tt(lang, key) { return (T[lang] || T.en)[key] ?? T.en[key] ?? key }

function categoryName(cat, lang) {
  return cat[`name_${lang}`] || cat.name_en
}

export default function TermsPage() {
  const [lang, setLang] = useState('zh')
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => TERMS.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.en.toLowerCase().includes(q)
        && !(t[lang] || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [filterCat, search, lang])

  return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="drive-header" style={{ marginBottom: 14 }}>
        <h1>{tt(lang, 'title')}</h1>
        <p>{tt(lang, 'subtitle')}</p>
      </div>

      {/* Category filter chips + search */}
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
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={tt(lang, 'search')}
          style={{ marginTop: 10, width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', fontSize: '.9rem' }}
        />
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
                <div style={{ marginTop: 8, padding: 10, background: 'var(--bg3)', borderRadius: 6, borderLeft: '3px solid var(--brand)', fontSize: '.85rem', lineHeight: 1.55 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{tt(lang, 'inspector')}:</strong> {term.inspector}
                  </div>
                  <div>
                    <strong>{tt(lang, 'driver')}:</strong> {term.driver}
                  </div>
                </div>
              </details>
            )}
          </div>
        )
      })}
    </AppShell>
  )
}
