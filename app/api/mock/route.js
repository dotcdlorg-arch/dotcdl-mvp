import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const { score, totalItems, details } = await req.json()
  const db = createServerClient()

  const { error } = await db.from('mock_results').insert({
    user_id: userId, score, total_items: totalItems,
    details: details || null,
    created_at: new Date().toISOString()
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const db = createServerClient()
  const { data, error } = await db.from('mock_results')
    .select('score,total_items,created_at').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(10)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ mocks: data })
}
