import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0f172a', padding:24 }}>
      <div style={{ marginBottom:24, textAlign:'center' }}>
        <div style={{ fontSize:'2rem', marginBottom:6 }}>🚛</div>
        <div style={{ fontWeight:800, color:'#f1f5f9', fontSize:'1.1rem' }}>CDL English Pro</div>
        <div style={{ fontSize:'.74rem', color:'#475569', marginTop:4 }}>Training only · Not affiliated with DOT, FMCSA, or CVSA</div>
      </div>
      <SignIn />
    </div>
  )
}
