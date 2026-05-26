'use client'
import { useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { TERMS, TERM_CATEGORIES } from '@/lib/terms'

let currentTermAudio = null
async function speakTermLine(text) {
  if (!text) return
  if (currentTermAudio) { try { currentTermAudio.pause() } catch {}; currentTermAudio = null }
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
    currentTermAudio = audio
    audio.onended = () => { URL.revokeObjectURL(url); if (currentTermAudio === audio) currentTermAudio = null }
    audio.onerror = () => { URL.revokeObjectURL(url); if (currentTermAudio === audio) currentTermAudio = null }
    await audio.play()
  } catch {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.95
      window.speechSynthesis.speak(u)
    }
  }
}

const T = {
  en: { title: '📚 Trucking Terms', subtitle: 'Roadside vocabulary in 6 languages with real inspector–driver conversation examples',
    all: 'All', search: 'Search terms…', translation: 'Translation', conversation: 'Conversation example', inspector: 'Inspector', driver: 'Driver',
    showAll: 'Show all languages', hideAll: 'Hide other languages', hear: '🔊 Hear', empty: 'No terms match.' },
  zh: { title: '📚 卡车术语', subtitle: '6 种语言的路检词汇，附真实路检官-司机对话示例',
    all: '全部', search: '搜索术语…', translation: '翻译', conversation: '对话示例', inspector: '路检官', driver: '司机',
    showAll: '显示所有语言', hideAll: '隐藏其他语言', hear: '🔊 朗读', empty: '没有匹配的术语。' },
  es: { title: '📚 Términos de camiones', subtitle: 'Vocabulario de inspección en 6 idiomas con ejemplos reales de conversación',
    all: 'Todos', search: 'Buscar términos…', translation: 'Traducción', conversation: 'Ejemplo de conversación', inspector: 'Inspector', driver: 'Conductor',
    showAll: 'Mostrar todos los idiomas', hideAll: 'Ocultar otros idiomas', hear: '🔊 Escuchar', empty: 'Sin coincidencias.' },
  hi: { title: '📚 ट्रकिंग शब्दावली', subtitle: '6 भाषाओं में सड़क जांच शब्दावली, असली बातचीत के साथ',
    all: 'सभी', search: 'शब्द खोजें…', translation: 'अनुवाद', conversation: 'बातचीत का उदाहरण', inspector: 'निरीक्षक', driver: 'चालक',
    showAll: 'सभी भाषाएँ दिखाएँ', hideAll: 'अन्य भाषाएँ छुपाएँ', hear: '🔊 सुनें', empty: 'कोई शब्द नहीं मिला।' },
  pa: { title: '📚 ਟਰੱਕਿੰਗ ਸ਼ਬਦਾਵਲੀ', subtitle: '6 ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਜਾਂਚ ਸ਼ਬਦ, ਅਸਲੀ ਗੱਲਬਾਤ ਉਦਾਹਰਣਾਂ ਨਾਲ',
    all: 'ਸਾਰੇ', search: 'ਸ਼ਬਦ ਖੋਜੋ…', translation: 'ਅਨੁਵਾਦ', conversation: 'ਗੱਲਬਾਤ ਉਦਾਹਰਣ', inspector: 'ਨਿਰੀਖਕ', driver: 'ਡਰਾਈਵਰ',
    showAll: 'ਸਾਰੀਆਂ ਭਾਸ਼ਾਵਾਂ ਦਿਖਾਓ', hideAll: 'ਹੋਰ ਭਾਸ਼ਾਵਾਂ ਛੁਪਾਓ', hear: '🔊 ਸੁਣੋ', empty: 'ਕੋਈ ਸ਼ਬਦ ਨਹੀਂ ਮਿਲਿਆ।' },
  vi: { title: '📚 Thuật ngữ vận tải', subtitle: 'Từ vựng kiểm tra đường bộ trong 6 ngôn ngữ kèm hội thoại thực tế',
    all: 'Tất cả', search: 'Tìm thuật ngữ…', translation: 'Bản dịch', conversation: 'Ví dụ hội thoại', inspector: 'Thanh tra', driver: 'Tài xế',
    showAll: 'Hiển thị mọi ngôn ngữ', hideAll: 'Ẩn các ngôn ngữ khác', hear: '🔊 Nghe', empty: 'Không có thuật ngữ phù hợp.' },
}
function tt(lang, key) { return (T[lang] || T.en)[key] ?? T.en[key] ?? key }

const OTHER_LANGS = ['zh', 'vi', 'es', 'pa', 'hi']
const LANG_LABEL = { en: 'EN', zh: '中文', vi: 'Tiếng Việt', es: 'Español', pa: 'ਪੰਜਾਬੀ', hi: 'हिन्दी' }

function categoryName(cat, lang) {
  return cat[`name_${lang}`] || cat.name_en
}

export default function TermsPage() {
  const [lang, setLang] = useState('zh')
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(() => new Set())

  const filtered = useMemo(() => TERMS.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.en.toLowerCase().includes(q)
        && !(t[lang] || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [filterCat, search, lang])

  const toggleExpand = (i) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

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

      {filtered.map((term, i) => {
        const key = `${term.category}-${term.en}`
        const isExpanded = expanded.has(key)
        const selectedTrans = lang === 'en' ? null : term[lang]
        return (
          <div key={key} className="card" style={{ marginBottom: 10 }}>
            <div className="between" style={{ alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '.98rem', color: 'var(--ink)', marginBottom: 4 }}>
                  {term.en}
                </div>
                {selectedTrans && (
                  <div style={{ fontSize: '.92rem', color: 'var(--brand)', fontWeight: 600 }}>
                    {selectedTrans}
                  </div>
                )}
              </div>
              <button
                className="btn btn-sm btn-success"
                onClick={() => speakTermLine(term.en)}
                style={{ flexShrink: 0 }}
                title={tt(lang, 'hear')}
              >
                {tt(lang, 'hear')}
              </button>
            </div>

            {/* Conversation example */}
            {(term.inspector || term.driver) && (
              <div style={{ marginTop: 10, padding: 10, background: 'var(--bg3)', borderRadius: 6, borderLeft: '3px solid var(--brand)' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>
                  💬 {tt(lang, 'conversation')}
                </div>
                <div style={{ fontSize: '.85rem', lineHeight: 1.55 }}>
                  <div style={{ marginBottom: 4 }}>
                    <strong>{tt(lang, 'inspector')}:</strong> {term.inspector}
                  </div>
                  <div>
                    <strong>{tt(lang, 'driver')}:</strong> {term.driver}
                  </div>
                </div>
              </div>
            )}

            {/* Other-languages expand toggle */}
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-sm" onClick={() => toggleExpand(key)}>
                {isExpanded ? tt(lang, 'hideAll') : tt(lang, 'showAll')}
              </button>
            </div>

            {isExpanded && (
              <div style={{ marginTop: 8, padding: 10, background: 'var(--bg2)', borderRadius: 6, fontSize: '.85rem', lineHeight: 1.7 }}>
                {OTHER_LANGS.filter(l => l !== lang).map(l => (
                  <div key={l} style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', minWidth: 60, paddingTop: 2 }}>{LANG_LABEL[l]}</span>
                    <span style={{ flex: 1 }}>{term[l]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </AppShell>
  )
}
