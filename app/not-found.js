import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem' }}>
      <p style={{ color:'var(--ink2)', fontSize:'0.95rem' }}>Page not found.</p>
      <Link href="/practice" className="btn btn-primary">Go to Practice</Link>
    </div>
  )
}
