import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { QUESTIONS, SIGNS } from '@/lib/data'

const VALID_Q_CODES = new Set(QUESTIONS.map(q => q.question_code))
const VALID_S_CODES = new Set(SIGNS.map(s => s.sign_code))
const VALID_STATUS = new Set(['viewed', 'understood', 'needs_review'])

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { questionCode, signCode, status, lastScore, lastTranscript, answer, type } = body

  if (type === 'sign' && signCode) {
    if (!VALID_S_CODES.has(signCode)) {
      return Response.json({ error: 'Invalid sign code' }, { status: 400 })
    }
    if (lastScore !== undefined && (typeof lastScore !== 'number' || lastScore < 0 || lastScore > 100)) {
      return Response.json({ error: 'Invalid score' }, { status: 400 })
    }
    if (answer && answer.length > 2000) {
      return Response.json({ error: 'Answer too long' }, { status: 400 })
    }

    const db = createServerClient()
    const { error } = await db.from('sign_progress').upsert({
      user_id: userId, sign_code: signCode,
      score: lastScore, answer,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,sign_code' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  if (questionCode) {
    if (!VALID_Q_CODES.has(questionCode)) {
      return Response.json({ error: 'Invalid question code' }, { status: 400 })
    }
    if (status && !VALID_STATUS.has(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (lastScore !== undefined && (typeof lastScore !== 'number' || lastScore < 0 || lastScore > 100)) {
      return Response.json({ error: 'Invalid score' }, { status: 400 })
    }
    if (lastTranscript && lastTranscript.length > 2000) {
      return Response.json({ error: 'Transcript too long' }, { status: 400 })
    }

    const db = createServerClient()
    const { error } = await db.from('question_progress').upsert({
      user_id: userId,
      question_code: questionCode,
      status: status || 'viewed',
      last_score: lastScore,
      last_transcript: lastTranscript,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,question_code' })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ ok: true })
  }

  return Response.json({ error: 'Missing code' }, { status: 400 })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  const db = createServerClient()
  const [{ data: qp }, { data: sp }, { data: mocks }] = await Promise.all([
    db.from('question_progress').select('*').eq('user_id', userId),
    db.from('sign_progress').select('*').eq('user_id', userId),
    db.from('mock_results').select('score,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(5),
  ])
  return Response.json({ questionProgress: qp || [], signProgress: sp || [], recentMocks: mocks || [] })
}
