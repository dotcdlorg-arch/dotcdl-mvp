import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook secret not set', { status: 500 })

  // Next.js 15: headers() is async
  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSig       = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSig)
    return new Response('Missing svix headers', { status: 400 })

  const body = await req.text()
  let evt
  try {
    evt = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSig,
    })
  } catch (e) {
    return new Response('Invalid signature', { status: 400 })
  }

  const db = createServerClient()

  if (evt.type === 'user.created') {
    const { id, email_addresses, primary_email_address_id } = evt.data
    const email = email_addresses?.find(e => e.id === primary_email_address_id)?.email_address || ''
    await db.from('profiles').insert({
      id, email, language: 'zh', plan: 'free',
      created_at: new Date().toISOString()
    }).catch(() => {}) // ignore duplicate
  }

  if (evt.type === 'user.deleted') {
    await db.from('profiles').delete().eq('id', evt.data.id).catch(() => {})
  }

  return new Response('OK', { status: 200 })
}
