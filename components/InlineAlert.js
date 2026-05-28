'use client'

export default function InlineAlert({ type = 'error', children }) {
  return (
    <div className={`inline-alert inline-alert-${type}`} role="alert">
      {children}
    </div>
  )
}
