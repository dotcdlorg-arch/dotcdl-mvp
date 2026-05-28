'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LANGS } from '@/components/AppShell'

const STORAGE_KEY = 'cdl-lang'

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  // Intentional SSR pattern: server AND first client render both initialize
  // to 'zh' so markup matches and React doesn't fire a hydration mismatch.
  // The useEffect below hydrates from localStorage after mount. Do NOT move
  // localStorage access into useState's initializer; that breaks SSR.
  const [lang, setLangState] = useState('zh')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && saved in LANGS) setLangState(saved)
    } catch {}
  }, [])

  const setLang = useCallback((next) => {
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch {}
  }, [])

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
