'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem' }}>
      <p style={{ color:'var(--red)', fontSize:'0.95rem' }}>Something went wrong.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  )
}
