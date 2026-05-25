import { SignUp } from '@clerk/nextjs'
export default function SignUpPage() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#0f172a', padding:24 }}>
      <div style={{ marginBottom:24, textAlign:'center' }}>
        <div style={{ fontSize:'2rem', marginBottom:6 }}>🚛</div>
        <div style={{ fontWeight:800, color:'#f1f5f9', fontSize:'1.1rem' }}>Create Your Free Account</div>
        <div style={{ fontSize:'.74rem', color:'#475569', marginTop:4 }}>Training only · No guarantee of passing any official inspection</div>
      </div>
      <SignUp />
    </div>
  )
}
