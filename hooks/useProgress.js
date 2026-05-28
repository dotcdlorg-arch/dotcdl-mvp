'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// 401 (signed-out) is treated as a silent no-op on BOTH read and write paths,
// so anonymous user flows on /practice and /signs keep working without console
// noise. Other failures are logged but never bubble.
export function useProgress({ type }) {
  const [progress, setProgress] = useState({})

  useEffect(() => {
    let cancelled = false
    fetch('/api/progress', { credentials: 'same-origin' })
      .then(r => {
        if (r.status === 401) return null
        if (!r.ok) { console.warn('progress GET failed', r.status); return null }
        return r.json()
      })
      .then(data => {
        if (cancelled || !data) return
        const next = {}
        if (type === 'sign') {
          for (const row of data.signProgress || []) {
            next[row.sign_code] = { score: row.score }
          }
        } else {
          for (const row of data.questionProgress || []) {
            next[row.question_code] = {
              status: row.status,
              score: row.last_score,
              transcript: row.last_transcript,
              viewCount: 1,
            }
          }
        }
        // Race guard: if the user clicked before GET resolved, their local
        // write wins over the server snapshot for that key.
        setProgress(prev => {
          const merged = { ...next }
          Object.keys(prev).forEach(k => { merged[k] = prev[k] })
          return merged
        })
      })
      .catch(e => console.warn('progress GET failed', e))
    return () => { cancelled = true }
  }, [type])

  const markQuestion = useCallback((code, status, score, transcript) => {
    setProgress(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        status,
        score: score ?? prev[code]?.score,
        transcript: transcript ?? prev[code]?.transcript,
        viewCount: (prev[code]?.viewCount || 0) + 1,
      },
    }))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionCode: code, status, lastScore: score, lastTranscript: transcript }),
    })
      .then(r => { if (!r.ok && r.status !== 401) console.warn('progress POST failed', r.status) })
      .catch(e => console.warn('progress POST failed', e))
  }, [])

  const markSign = useCallback((code, score, answer) => {
    setProgress(prev => ({ ...prev, [code]: { score } }))
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signCode: code, score, answer, type: 'sign' }),
    })
      .then(r => { if (!r.ok && r.status !== 401) console.warn('progress POST failed', r.status) })
      .catch(e => console.warn('progress POST failed', e))
  }, [])

  const stats = useMemo(() => {
    const vals = Object.values(progress)
    if (type === 'sign') {
      return {
        seen: vals.length,
        understood: vals.filter(v => v.score >= 80).length,
        review: vals.filter(v => v.score > 0 && v.score < 55).length,
      }
    }
    const scores = vals.map(v => v.score).filter(Boolean)
    return {
      seen: vals.filter(v => v.viewCount > 0).length,
      understood: vals.filter(v => v.status === 'understood').length,
      review: vals.filter(v => v.status === 'needs_review').length,
      avgScore: scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) + '/100'
        : null,
    }
  }, [progress, type])

  return type === 'sign'
    ? { progress, stats, markSign }
    : { progress, stats, markQuestion }
}
