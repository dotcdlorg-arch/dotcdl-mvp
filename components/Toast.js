'use client'

import { useToast } from '@/lib/toast-context'

export default function Toast() {
  const { toasts, dismiss } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="toast-stack">
      {toasts.map(t => {
        const role = t.type === 'error' || t.type === 'warn' ? 'alert' : 'status'
        return (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role={role}
            tabIndex={0}
            onClick={() => dismiss(t.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dismiss(t.id) } }}
          >
            {t.msg}
          </div>
        )
      })}
    </div>
  )
}
