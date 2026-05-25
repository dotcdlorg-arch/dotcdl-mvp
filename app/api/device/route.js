import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

const DEVICE_LIMIT = 2

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ allowed: false, reason: 'not_authenticated' })

  const body = await req.json().catch(() => ({}))
  const { fingerprint, userAgent } = body
  if (!fingerprint) return Response.json({ allowed: true }) // graceful degradation

  const db = createServerClient()
  const { data: devices } = await db.from('device_sessions').select('fingerprint').eq('user_id', userId)
  const known = [...new Set(devices?.map(d => d.fingerprint) ?? [])]

  if (known.includes(fingerprint)) return Response.json({ allowed: true })

  if (known.length < DEVICE_LIMIT) {
    await db.from('device_sessions').insert({
      user_id: userId, fingerprint,
      user_agent: userAgent || '',
      risk_score: 10,
      created_at: new Date().toISOString()
    }).catch(() => {})
    return Response.json({ allowed: true, newDevice: true })
  }

  await db.from('device_sessions').insert({
    user_id: userId, fingerprint,
    user_agent: userAgent || '',
    risk_score: 60,
    created_at: new Date().toISOString()
  }).catch(() => {})

  return Response.json({
    allowed: false,
    reason: 'device_limit_exceeded',
    message: 'This account is active on 2 devices. Sign out from another device first.'
  })
}
