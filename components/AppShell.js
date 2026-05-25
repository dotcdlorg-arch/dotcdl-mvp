'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'

export const LANGS = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  vi: 'Tiếng Việt',
}

// Nav labels translated for all supported languages
const NAV_LABELS = {
  en: {
    training: 'Training',
    premium: 'Premium',
    progress: 'Progress',
    text: 'Text practice',
    listen: 'Listening',
    speak: 'Speak + AI score',
    signs: 'Traffic signs',
    mock: 'Mock inspection',
    drive: 'Drive Mode',
    report: 'Progress report',
    stats: 'Session stats',
    seen: 'Questions seen',
    understood: 'Understood',
    review: 'Needs review',
    avgScore: 'Average score',
    mocks: 'Mock tests',
    disclaimer: '⚠️ Training only. Not affiliated with DOT, FMCSA, or CVSA.',
  },
  zh: {
    training: '训练',
    premium: '高级',
    progress: '进度',
    text: '文字练习',
    listen: '听力练习',
    speak: '口语 + AI 评分',
    signs: '交通标志',
    mock: '模拟检查',
    drive: '驾驶模式',
    report: '进度报告',
    stats: '本次统计',
    seen: '已看题数',
    understood: '已理解',
    review: '需复习',
    avgScore: '平均分',
    mocks: '模拟次数',
    disclaimer: '⚠️ 仅供训练，非 DOT/FMCSA/CVSA 官方，不保证通过检查。',
  },
  es: {
    training: 'Entrenamiento',
    premium: 'Premium',
    progress: 'Progreso',
    text: 'Práctica de texto',
    listen: 'Escucha',
    speak: 'Habla + Puntuación AI',
    signs: 'Señales de tráfico',
    mock: 'Inspección simulada',
    drive: 'Modo conducción',
    report: 'Informe de progreso',
    stats: 'Estadísticas',
    seen: 'Preguntas vistas',
    understood: 'Entendidas',
    review: 'Para repasar',
    avgScore: 'Puntuación media',
    mocks: 'Simulacros',
    disclaimer: '⚠️ Solo entrenamiento. No garantiza aprobar inspecciones DOT.',
  },
  hi: {
    training: 'प्रशिक्षण',
    premium: 'प्रीमियम',
    progress: 'प्रगति',
    text: 'पाठ अभ्यास',
    listen: 'सुनने का अभ्यास',
    speak: 'बोलना + AI स्कोर',
    signs: 'यातायात चिह्न',
    mock: 'नकली निरीक्षण',
    drive: 'ड्राइव मोड',
    report: 'प्रगति रिपोर्ट',
    stats: 'सत्र आँकड़े',
    seen: 'देखे गए प्रश्न',
    understood: 'समझे गए',
    review: 'समीक्षा करें',
    avgScore: 'औसत स्कोर',
    mocks: 'मॉक टेस्ट',
    disclaimer: '⚠️ केवल प्रशिक्षण। DOT/FMCSA/CVSA से संबद्ध नहीं।',
  },
  pa: {
    training: 'ਸਿਖਲਾਈ',
    premium: 'ਪ੍ਰੀਮੀਅਮ',
    progress: 'ਪ੍ਰਗਤੀ',
    text: 'ਪਾਠ ਅਭਿਆਸ',
    listen: 'ਸੁਣਨ ਦਾ ਅਭਿਆਸ',
    speak: 'ਬੋਲਣਾ + AI ਸਕੋਰ',
    signs: 'ਆਵਾਜਾਈ ਚਿੰਨ੍ਹ',
    mock: 'ਨਕਲੀ ਜਾਂਚ',
    drive: 'ਡ੍ਰਾਈਵ ਮੋਡ',
    report: 'ਪ੍ਰਗਤੀ ਰਿਪੋਰਟ',
    stats: 'ਸੈਸ਼ਨ ਅੰਕੜੇ',
    seen: 'ਦੇਖੇ ਸਵਾਲ',
    understood: 'ਸਮਝੇ',
    review: 'ਦੁਹਰਾਓ',
    avgScore: 'ਔਸਤ ਸਕੋਰ',
    mocks: 'ਮੌਕ ਟੈਸਟ',
    disclaimer: '⚠️ ਕੇਵਲ ਸਿਖਲਾਈ। DOT/FMCSA/CVSA ਨਾਲ ਕੋਈ ਸੰਬੰਧ ਨਹੀਂ।',
  },
  vi: {
    training: 'Đào tạo',
    premium: 'Cao cấp',
    progress: 'Tiến độ',
    text: 'Luyện đọc',
    listen: 'Luyện nghe',
    speak: 'Nói + Chấm điểm AI',
    signs: 'Biển báo giao thông',
    mock: 'Kiểm tra mô phỏng',
    drive: 'Chế độ lái xe',
    report: 'Báo cáo tiến độ',
    stats: 'Thống kê phiên',
    seen: 'Câu đã xem',
    understood: 'Đã hiểu',
    review: 'Cần ôn lại',
    avgScore: 'Điểm trung bình',
    mocks: 'Bài kiểm tra thử',
    disclaimer: '⚠️ Chỉ để đào tạo. Không liên kết với DOT/FMCSA/CVSA.',
  },
}

function nl(lang, key) {
  return (NAV_LABELS[lang] || NAV_LABELS.en)[key] || NAV_LABELS.en[key] || key
}

export default function AppShell({ children, lang = 'zh', setLang, stats }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href) => {
    const base = href.split('?')[0]
    if (href.includes('?')) return pathname + (typeof window !== 'undefined' ? window.location.search : '') === href || (pathname === base && href === pathname)
    return pathname === base
  }

  // Rebuild NAV with translated labels each render (fix #1 & #6)
  const NAV = [
    {
      label: nl(lang, 'training'),
      items: [
        { href: '/practice?mode=listen', icon: '🎧', labelKey: 'listen' },
        { href: '/practice?mode=speak', icon: '🎤', labelKey: 'speak' },
        { href: '/signs', icon: '🚦', labelKey: 'signs' },
        { href: '/mock', icon: '🚔', labelKey: 'mock' },
      ],
    },
    {
      label: nl(lang, 'premium'),
      items: [
        { href: '/drive', icon: '🚗', labelKey: 'drive', badge: 'PRO' },
      ],
    },
    {
      label: nl(lang, 'progress'),
      items: [
        { href: '/report', icon: '📊', labelKey: 'report' },
      ],
    },
  ]

  return (
    <>
      <div className="watermark">CDL Training · {new Date().toLocaleDateString()} · Not Official DOT</div>

      <header className="topbar">
        <div className="topbar-brand">
          <span className="topbar-logo">🚛</span>
          <div>
            <div className="topbar-title">CDL English Pro</div>
            <div className="topbar-sub">Not affiliated with DOT · FMCSA · CVSA</div>
          </div>
        </div>
        <div className="topbar-actions">
          <select
            className="lang-select"
            value={lang}
            onChange={e => setLang && setLang(e.target.value)}
            aria-label="Interface language"
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <UserButton />
          <button
            className="btn btn-ghost mobile-toggle"
            style={{ color: '#fff', fontSize: '1.2rem', padding: '4px 8px' }}
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      <div className="app-layout">
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          {NAV.map(group => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => {
                const active = isActive(item.href)
                const isDrive = item.badge === 'PRO'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-btn ${isDrive ? 'drive-btn' : ''} ${active ? 'active' : ''}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{nl(lang, item.labelKey)}</span>
                    {item.badge && (
                      <span className="nav-badge">{item.badge}</span>
                    )}
                    {/* Active indicator dot (fix #7) */}
                    {active && !isDrive && (
                      <span className="nav-active-dot" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {stats && (
            <div style={{ marginTop: 20, padding: '12px 10px', background: 'var(--bg3)', borderRadius: 'var(--rs)', border: '1px solid var(--line)' }}>
              <div className="nav-group-label" style={{ padding: '0 0 8px' }}>{nl(lang, 'stats')}</div>
              <div className="sidebar-stat"><span>{nl(lang, 'seen')}</span><span className="ssv">{stats.seen}/{stats.total}</span></div>
              <div className="sidebar-stat"><span>{nl(lang, 'understood')}</span><span className="ssv">{stats.understood}</span></div>
              <div className="sidebar-stat"><span>{nl(lang, 'review')}</span><span className="ssv">{stats.review}</span></div>
              {stats.avgScore && <div className="sidebar-stat"><span>{nl(lang, 'avgScore')}</span><span className="ssv">{stats.avgScore}</span></div>}
              {stats.mocks != null && <div className="sidebar-stat"><span>{nl(lang, 'mocks')}</span><span className="ssv">{stats.mocks}</span></div>}
            </div>
          )}

          <div className="disclaimer" style={{ marginTop: 14 }}>
            {nl(lang, 'disclaimer')}
          </div>
        </aside>

        <main className="main-content" onClick={() => setOpen(false)}>
          {children}
        </main>
      </div>

      <nav className="mobile-tabs" aria-label="Primary mobile navigation">
        {[
          { href: '/practice?mode=listen', icon: '🎧', labelKey: 'listen' },
          { href: '/practice?mode=speak',  icon: '🎤', labelKey: 'speak' },
          { href: '/signs',                icon: '🚦', labelKey: 'signs' },
          { href: '/mock',                 icon: '🚔', labelKey: 'mock' },
          { href: '/drive',                icon: '🚗', labelKey: 'drive' },
        ].map(tab => {
          const active = isActive(tab.href)
          const label = nl(lang, tab.labelKey)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobile-tab ${active ? 'active' : ''}`}
              aria-label={label}
              title={label}
            >
              <span className="mobile-tab-icon">{tab.icon}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
