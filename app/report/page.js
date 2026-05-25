import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { QUESTIONS } from '@/lib/data'
import ReportClient from './ReportClient'

export default async function ReportPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const db = createServerClient()
  const [{ data: qp }, { data: sp }, { data: mocks }] = await Promise.all([
    db.from('question_progress').select('*').eq('user_id', userId),
    db.from('sign_progress').select('score,sign_code').eq('user_id', userId),
    db.from('mock_results').select('score,total_items,created_at').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(10),
  ])

  const understood = qp?.filter(p => p.status === 'understood').length ?? 0
  const review     = qp?.filter(p => p.status === 'needs_review').length ?? 0
  const qScores    = qp?.map(p => p.last_score).filter(Boolean) ?? []
  const avgQ       = qScores.length ? Math.round(qScores.reduce((a,b)=>a+b,0)/qScores.length) : 0
  const sScores    = sp?.map(s => s.score).filter(Boolean) ?? []
  const avgS       = sScores.length ? Math.round(sScores.reduce((a,b)=>a+b,0)/sScores.length) : 0
  const bestMock   = mocks?.length ? Math.max(...mocks.map(m=>m.score)) : 0
  const latestMock = mocks?.[0] ?? null

  const catStats = {}
  ;['Basic Identity / Documents','Route / Cargo','HOS / ELD','Vehicle Condition','Accident / Emergency'].forEach(cat => {
    const catQs = QUESTIONS.filter(q => q.category === cat)
    const catProgress = qp?.filter(p => catQs.some(q => q.question_code === p.question_code)) || []
    const catScores = catProgress.map(p => p.last_score).filter(Boolean)
    catStats[cat] = {
      total: catQs.length,
      seen: catProgress.length,
      avg: catScores.length ? Math.round(catScores.reduce((a,b)=>a+b,0)/catScores.length) : 0
    }
  })

  const overall = avgQ ? Math.round((avgQ + avgS) / 2) : 0

  return (
    <ReportClient
      understood={understood}
      review={review}
      avgQ={avgQ}
      avgS={avgS}
      mocksLength={mocks?.length ?? 0}
      bestMock={bestMock}
      latestMock={latestMock}
      catStats={catStats}
      overall={overall}
      mocks={mocks ?? []}
    />
  )
}
