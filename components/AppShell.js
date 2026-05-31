'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { t } from '@/lib/i18n'

function nl(lang, key) { return t(lang, 'nav.' + key) }

export const LANGS = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  vi: 'Tiếng Việt',
}

export default function AppShell({ children, lang = 'zh', setLang, stats, topbarActions }) {
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
        { href: '/terms', icon: '📚', labelKey: 'terms' },
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
            <div className="topbar-title">
              <span className="hide-on-phone">CDL English Pro</span>
              <span className="hide-on-desktop">ELP</span>
            </div>
            <div className="topbar-sub">Not affiliated with DOT · FMCSA · CVSA</div>
          </div>
        </div>
        {topbarActions && (
          <div className="topbar-page-actions">
            {topbarActions}
          </div>
        )}
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
          { href: '/terms',                icon: '📚', labelKey: 'terms' },
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
