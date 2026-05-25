import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { QUESTIONS, SIGNS } from '@/lib/data'

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
  const latestMock = mocks?.[0]

  // Category breakdown
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
  const color = (v) => v >= 80 ? '#059669' : v >= 55 ? '#d97706' : '#dc2626'
  const pct   = (v) => Math.max(0, Math.min(100, v))

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,sans-serif", background:'var(--bg, #f0f4f8)', minHeight:'100vh', padding:'0 0 80px' }}>
      <header style={{ background:'#0f172a', color:'#fff', padding:'16px 24px', display:'flex', alignItems:'center', gap:12 }}>
        <span style={{ fontSize:'1.4rem' }}>🚛</span>
        <div>
          <div style={{ fontWeight:800 }}>CDL English Pro</div>
          <div style={{ fontSize:'.7rem', color:'#475569' }}>Not affiliated with DOT, FMCSA, or CVSA</div>
        </div>
        <a href="/practice" style={{ marginLeft:'auto', padding:'7px 14px', background:'#1e293b', color:'#e2e8f0', borderRadius:8, fontSize:'.82rem', textDecoration:'none', border:'1px solid #334155' }}>
          ← Back to Practice
        </a>
      </header>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'24px 20px' }}>
        <h1 style={{ fontSize:'1.3rem', fontWeight:800, marginBottom:6 }}>📊 Training Progress Report</h1>
        <p style={{ fontSize:'.75rem', color:'#64748b', marginBottom:24 }}>
          Training only. Not an official DOT, FMCSA, or CVSA assessment. No guarantee of passing any inspection.
        </p>

        {/* Overall score */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'24px', marginBottom:20, textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize:'.75rem', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>Overall Readiness Estimate</div>
          <div style={{ fontSize:'3rem', fontWeight:900, color:color(overall), fontFamily:'monospace' }}>{overall || '—'}</div>
          <div style={{ fontSize:'.8rem', color:'#64748b', marginBottom:12 }}>/100 · {overall>=80?'Strong':'Developing'}</div>
          <div style={{ height:10, background:'#e2e8f0', borderRadius:999, overflow:'hidden', maxWidth:300, margin:'0 auto' }}>
            <div style={{ height:'100%', width:pct(overall)+'%', background:color(overall), borderRadius:999, transition:'width .5s ease' }} />
          </div>
        </div>

        {/* Key metrics */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:20 }}>
          {[
            { val:`${qp?.length??0}/${QUESTIONS.length}`, label:'Questions Seen' },
            { val:understood, label:'Understood' },
            { val:review, label:'Need Review' },
            { val:avgQ?`${avgQ}/100`:'—', label:'Avg Q Score' },
            { val:avgS?`${avgS}/100`:'—', label:'Avg Sign Score' },
            { val:mocks?.length??0, label:'Mocks Taken' },
            { val:bestMock?`${bestMock}/100`:'—', label:'Best Mock' },
            { val:latestMock?`${latestMock.score}/100`:'—', label:'Latest Mock' },
          ].map(m => (
            <div key={m.label} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#2563eb', fontFamily:'monospace' }}>{m.val}</div>
              <div style={{ fontSize:'.66rem', color:'#64748b', marginTop:3, textTransform:'uppercase', letterSpacing:'.05em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 22px', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:16 }}>Category Performance</h2>
          {Object.entries(catStats).map(([cat, stat]) => (
            <div key={cat} style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <span style={{ fontSize:'.85rem', fontWeight:600 }}>{cat}</span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:'.75rem', color:'#64748b' }}>{stat.seen}/{stat.total} seen</span>
                  {stat.avg > 0 && <span style={{ fontSize:'.78rem', fontWeight:700, color:color(stat.avg), padding:'1px 7px', background:stat.avg>=80?'#ecfdf5':stat.avg>=55?'#fffbeb':'#fef2f2', borderRadius:999 }}>{stat.avg}/100</span>}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>
                <div>
                  <div style={{ fontSize:'.66rem', color:'#94a3b8', marginBottom:2 }}>Coverage</div>
                  <div style={{ height:6, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:pct(Math.round(stat.seen/stat.total*100))+'%', background:'#2563eb', borderRadius:999 }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:'.66rem', color:'#94a3b8', marginBottom:2 }}>Avg score</div>
                  <div style={{ height:6, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:pct(stat.avg)+'%', background:color(stat.avg), borderRadius:999 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mock history */}
        {mocks?.length > 0 && (
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 22px', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:14 }}>Mock Inspection History</h2>
            {mocks.map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:'.78rem', color:'#94a3b8', width:90, flexShrink:0 }}>{new Date(m.created_at).toLocaleDateString()}</span>
                <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:999, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:m.score+'%', background:color(m.score), borderRadius:999 }} />
                </div>
                <span style={{ fontWeight:800, fontSize:'.85rem', color:color(m.score), width:44, textAlign:'right' }}>{m.score}/100</span>
              </div>
            ))}
          </div>
        )}

        {/* Next steps */}
        <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 8px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize:'1rem', fontWeight:800, marginBottom:12 }}>Next Steps</h2>
          <ol style={{ paddingLeft:'1.4em', color:'#334155', fontSize:'.87rem', lineHeight:2 }}>
            {review > 0 && <li>Review {review} questions marked &quot;needs review&quot; in Text Practice</li>}
            {avgQ < 80 && <li>Focus on HOS/ELD and Vehicle Condition — most commonly tested</li>}
            {avgS < 80 && <li>Practice traffic sign recognition daily — aim for 80+ on all categories</li>}
            <li>Use Drive Mode for hands-free conversation practice while commuting</li>
            <li>Complete a full Mock Inspection after every 20 questions studied</li>
            <li>Target 80+ on mock inspections before any real roadside check</li>
          </ol>
          <p style={{ marginTop:14, fontSize:'.72rem', color:'#94a3b8' }}>
            ⚠️ Training only. Not affiliated with DOT, FMCSA, or CVSA. No guarantee of passing any inspection or exam.
          </p>
        </div>
      </div>
    </div>
  )
}
