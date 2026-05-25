import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'

const FEATURES = [
  { icon: '🎯', title: '140 Officer Q&A', desc: 'Every roadside inspection question with exact English answers and multilingual explanations' },
  { icon: '🚦', title: '84 Traffic Signs', desc: 'Full US MUTCD sign library — identify, explain, and state correct driver action in English' },
  { icon: '🎧', title: 'Listening Drills', desc: 'Officer voice at slow, normal, and fast speed — train your ear for real roadside conditions' },
  { icon: '🎤', title: 'AI Pronunciation', desc: 'Record your answer, get word-by-word pronunciation scoring from OpenAI Whisper' },
  { icon: '🚗', title: 'Drive Mode', desc: 'Hands-free conversation practice while driving — officer speaks, you respond verbally' },
  { icon: '🚔', title: 'Mock Inspection', desc: '19-question timed simulation: 14 Q&A + 5 signs, scored and saved to your progress report' },
  { icon: '📊', title: 'Progress Report', desc: 'Cloud-saved progress across all devices — see weak spots, track improvement over time' },
  { icon: '🌍', title: '5 Languages', desc: 'Interface in Chinese, Spanish, Hindi, Punjabi, Vietnamese — practice answers in English' },
]

export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: '#0f172a', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.6rem' }}>🚛</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>CDL English Pro</div>
            <div style={{ fontSize: '.68rem', color: '#64748b' }}>AI Roadside Readiness Training</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SignedOut>
            <Link href="/sign-in" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', color: '#94a3b8', fontSize: '.84rem', fontWeight: 500, textDecoration: 'none' }}>Sign In</Link>
            <Link href="/sign-up" style={{ padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: '.84rem', fontWeight: 700, textDecoration: 'none' }}>Start Free →</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/practice" style={{ padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: '.84rem', fontWeight: 700, textDecoration: 'none' }}>Continue Training →</Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(248,113,113,.3)', color: '#fca5a5', borderRadius: 999, padding: '5px 18px', fontSize: '.74rem', fontWeight: 600, marginBottom: 28 }}>
          ⚠️ Training only — Not affiliated with DOT, FMCSA, or CVSA
        </div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 22, letterSpacing: '-.02em' }}>
          Pass Your DOT<br />
          <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            English Inspection
          </span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          AI-powered officer Q&amp;A, traffic signs, pronunciation scoring, and the industry&apos;s first <strong style={{ color: '#c7d2fe' }}>hands-free Drive Mode</strong> for verbal practice while on the road.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <SignedOut>
            <Link href="/sign-up" style={{ padding: '15px 36px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 24px rgba(99,102,241,.4)' }}>
              Start Free Training →
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/practice" style={{ padding: '15px 36px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 800, fontSize: '1rem', textDecoration: 'none' }}>Continue Training →</Link>
          </SignedIn>
          <Link href="/drive" style={{ padding: '15px 36px', borderRadius: 10, border: '1px solid #4338ca', color: '#c7d2fe', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            🚗 Try Drive Mode
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ background: '#1e293b', border: '1px solid #253347', borderRadius: 12, padding: '18px 16px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem', marginBottom: 5 }}>{f.title}</div>
            <div style={{ color: '#64748b', fontSize: '.8rem', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', color: '#334155', fontSize: '.72rem', padding: '0 24px 40px' }}>
        Training only. Not affiliated with the U.S. Department of Transportation, FMCSA, CVSA, or any government agency.<br />
        No guarantee of passing any official roadside inspection, CDL exam, or employer test.
      </div>
    </div>
  )
}
