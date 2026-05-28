'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const DEDUPE_WINDOW_MS = 2000
const AUTO_DISMISS_MS = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const lastSeen = useRef(new Map())
  const timers = useRef(new Map())
  const seq = useRef(0)

  const dismiss = useCallback((id) => {
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  const showToast = useCallback((msg, type = 'info') => {
    const now = Date.now()
    const prev = lastSeen.current.get(msg)
    if (prev && now - prev < DEDUPE_WINDOW_MS) return
    // Prune stale dedupe entries so the Map cannot grow without bound in a long session.
    for (const [k, t] of lastSeen.current) {
      if (now - t > DEDUPE_WINDOW_MS) lastSeen.current.delete(k)
    }
    lastSeen.current.set(msg, now)
    const id = ++seq.current
    setToasts(curr => [...curr, { id, msg, type }])
    timers.current.set(id, setTimeout(() => dismiss(id), AUTO_DISMISS_MS))
  }, [dismiss])

  const value = useMemo(() => ({ toasts, showToast, dismiss }), [toasts, showToast, dismiss])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
