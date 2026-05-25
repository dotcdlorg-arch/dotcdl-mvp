'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut } from '@clerk/nextjs'

const LANGS = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  vi: 'Tiếng Việt',
}

// Translations for hero / nav / footer. The last "5 Languages" feature card is intentionally
// left untouched and always rendered in English per user request.
const T = {
  en: {
    badge: '⚠️ Training only — Not affiliated with DOT, FMCSA, or CVSA',
    h1a: 'Pass Your DOT',
    h1b: 'English Inspection',
    sub: "AI-powered officer Q&A, traffic signs, pronunciation scoring, and the industry's first hands-free Drive Mode for verbal practice while on the road.",
    subHandsFree: 'hands-free Drive Mode',
    signIn: 'Sign In',
    startFree: 'Start Free →',
    continue: 'Continue Training →',
    ctaStart: 'Start Free Training →',
    ctaDrive: '🚗 Try Drive Mode',
    footer1: 'Training only. Not affiliated with the U.S. Department of Transportation, FMCSA, CVSA, or any government agency.',
    footer2: 'No guarantee of passing any official roadside inspection, CDL exam, or employer test.',
    tagline: 'AI Roadside Readiness Training',
  },
  zh: {
    badge: '⚠️ 仅供训练 — 非 DOT、FMCSA 或 CVSA 官方',
    h1a: '通过你的 DOT',
    h1b: '英语路检',
    sub: 'AI 驱动的执法官问答、交通标志、发音评分,以及业界首创的免提驾驶模式,让你在路上也能进行口语练习。',
    subHandsFree: '免提驾驶模式',
    signIn: '登录',
    startFree: '免费开始 →',
    continue: '继续训练 →',
    ctaStart: '免费开始训练 →',
    ctaDrive: '🚗 试用驾驶模式',
    footer1: '仅供训练。与美国交通部、FMCSA、CVSA 或任何政府机构均无关联。',
    footer2: '不保证通过任何官方路检、CDL 考试或雇主测试。',
    tagline: 'AI 路检备战训练',
  },
  es: {
    badge: '⚠️ Solo entrenamiento — No afiliado con DOT, FMCSA, ni CVSA',
    h1a: 'Aprueba tu inspección',
    h1b: 'de inglés del DOT',
    sub: 'Preguntas y respuestas del oficial con IA, señales de tráfico, puntuación de pronunciación y el primer Modo Conducción manos libres del sector para practicar verbalmente en la carretera.',
    subHandsFree: 'Modo Conducción manos libres',
    signIn: 'Iniciar sesión',
    startFree: 'Comenzar gratis →',
    continue: 'Continuar entrenamiento →',
    ctaStart: 'Comenzar entrenamiento gratis →',
    ctaDrive: '🚗 Probar Modo Conducción',
    footer1: 'Solo entrenamiento. No afiliado con el Departamento de Transporte de EE. UU., FMCSA, CVSA, ni ninguna agencia gubernamental.',
    footer2: 'No garantiza aprobar ninguna inspección oficial, examen CDL o prueba de empleador.',
    tagline: 'Entrenamiento de Preparación en Carretera con IA',
  },
  hi: {
    badge: '⚠️ केवल प्रशिक्षण — DOT, FMCSA, या CVSA से संबद्ध नहीं',
    h1a: 'अपना DOT पास करें',
    h1b: 'अंग्रेज़ी निरीक्षण',
    sub: 'AI-संचालित ऑफिसर प्रश्नोत्तर, यातायात चिह्न, उच्चारण स्कोरिंग, और इंडस्ट्री का पहला हैंड्स-फ्री ड्राइव मोड — सड़क पर मौखिक अभ्यास के लिए।',
    subHandsFree: 'हैंड्स-फ्री ड्राइव मोड',
    signIn: 'साइन इन',
    startFree: 'मुफ़्त शुरू करें →',
    continue: 'प्रशिक्षण जारी रखें →',
    ctaStart: 'मुफ़्त प्रशिक्षण शुरू करें →',
    ctaDrive: '🚗 ड्राइव मोड आज़माएँ',
    footer1: 'केवल प्रशिक्षण। अमेरिकी परिवहन विभाग, FMCSA, CVSA, या किसी सरकारी एजेंसी से संबद्ध नहीं।',
    footer2: 'किसी भी आधिकारिक सड़क निरीक्षण, CDL परीक्षा, या नियोक्ता परीक्षण को पास करने की गारंटी नहीं है।',
    tagline: 'AI सड़क तत्परता प्रशिक्षण',
  },
  pa: {
    badge: '⚠️ ਸਿਰਫ਼ ਸਿਖਲਾਈ — DOT, FMCSA, ਜਾਂ CVSA ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ',
    h1a: 'ਆਪਣਾ DOT ਪਾਸ ਕਰੋ',
    h1b: 'ਅੰਗਰੇਜ਼ੀ ਨਿਰੀਖਣ',
    sub: 'AI-ਸੰਚਾਲਿਤ ਅਫ਼ਸਰ ਸਵਾਲ-ਜਵਾਬ, ਆਵਾਜਾਈ ਚਿੰਨ੍ਹ, ਉਚਾਰਨ ਸਕੋਰਿੰਗ, ਅਤੇ ਉਦਯੋਗ ਦਾ ਪਹਿਲਾ ਹੈਂਡਜ਼-ਫ੍ਰੀ ਡ੍ਰਾਈਵ ਮੋਡ — ਸੜਕ \'ਤੇ ਜ਼ੁਬਾਨੀ ਅਭਿਆਸ ਲਈ।',
    subHandsFree: 'ਹੈਂਡਜ਼-ਫ੍ਰੀ ਡ੍ਰਾਈਵ ਮੋਡ',
    signIn: 'ਸਾਈਨ ਇਨ',
    startFree: 'ਮੁਫ਼ਤ ਸ਼ੁਰੂ ਕਰੋ →',
    continue: 'ਸਿਖਲਾਈ ਜਾਰੀ ਰੱਖੋ →',
    ctaStart: 'ਮੁਫ਼ਤ ਸਿਖਲਾਈ ਸ਼ੁਰੂ ਕਰੋ →',
    ctaDrive: '🚗 ਡ੍ਰਾਈਵ ਮੋਡ ਅਜ਼ਮਾਓ',
    footer1: 'ਸਿਰਫ਼ ਸਿਖਲਾਈ। ਅਮਰੀਕੀ ਆਵਾਜਾਈ ਵਿਭਾਗ, FMCSA, CVSA, ਜਾਂ ਕਿਸੇ ਸਰਕਾਰੀ ਏਜੰਸੀ ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ।',
    footer2: 'ਕਿਸੇ ਵੀ ਅਧਿਕਾਰਤ ਸੜਕ ਨਿਰੀਖਣ, CDL ਪ੍ਰੀਖਿਆ, ਜਾਂ ਮਾਲਕ ਟੈਸਟ ਪਾਸ ਕਰਨ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ।',
    tagline: 'AI ਸੜਕ ਤਿਆਰੀ ਸਿਖਲਾਈ',
  },
  vi: {
    badge: '⚠️ Chỉ để đào tạo — Không liên kết với DOT, FMCSA, hay CVSA',
    h1a: 'Vượt qua kỳ kiểm tra',
    h1b: 'tiếng Anh DOT',
    sub: 'Hỏi đáp với cảnh sát bằng AI, biển báo giao thông, chấm điểm phát âm, và Chế độ Lái xe rảnh tay đầu tiên trong ngành — luyện nói ngay trên đường.',
    subHandsFree: 'Chế độ Lái xe rảnh tay',
    signIn: 'Đăng nhập',
    startFree: 'Bắt đầu miễn phí →',
    continue: 'Tiếp tục đào tạo →',
    ctaStart: 'Bắt đầu đào tạo miễn phí →',
    ctaDrive: '🚗 Thử Chế độ Lái xe',
    footer1: 'Chỉ để đào tạo. Không liên kết với Bộ Giao thông Hoa Kỳ, FMCSA, CVSA, hay bất kỳ cơ quan chính phủ nào.',
    footer2: 'Không đảm bảo vượt qua bất kỳ kỳ kiểm tra chính thức, kỳ thi CDL, hay bài kiểm tra của nhà tuyển dụng nào.',
    tagline: 'Đào tạo Sẵn sàng Đường trường bằng AI',
  },
}

// Feature titles + descriptions per language. Numbers removed; features described by what
// they do. The last entry (🌍 5 Languages) is intentionally kept in English across all
// languages — per user request, that field is not to be touched.
const FEATURES_BY_LANG = {
  en: [
    { icon: '🎯', title: 'Officer Q&A', desc: 'Every roadside inspection question with exact English answers and multilingual explanations' },
    { icon: '🚦', title: 'Traffic Signs', desc: 'Full US MUTCD sign library — identify, explain, and state correct driver action in English' },
    { icon: '🎧', title: 'Listening Drills', desc: 'Officer voice at slow, normal, and fast speed — train your ear for real roadside conditions' },
    { icon: '🎤', title: 'AI Pronunciation', desc: 'Record your answer, get word-by-word pronunciation scoring from OpenAI Whisper' },
    { icon: '🚗', title: 'Drive Mode', desc: 'Hands-free conversation practice while driving — officer speaks, you respond verbally' },
    { icon: '🚔', title: 'Mock Inspection', desc: 'Timed simulated inspection mixing officer Q&A and traffic signs, scored and saved to your progress report' },
    { icon: '📊', title: 'Progress Report', desc: 'Cloud-saved progress across all devices — see weak spots, track improvement over time' },
  ],
  zh: [
    { icon: '🎯', title: '执法官问答', desc: '涵盖每一个路检问题,提供准确的英语答案和多语种讲解' },
    { icon: '🚦', title: '交通标志', desc: '完整的美国 MUTCD 标志库 — 识别、解释,并用英语说出正确的驾驶动作' },
    { icon: '🎧', title: '听力训练', desc: '慢速、正常、快速三档执法官语音 — 训练你应对真实路检的耳力' },
    { icon: '🎤', title: 'AI 发音评分', desc: '录下你的回答,获得来自 OpenAI Whisper 的逐字发音评分' },
    { icon: '🚗', title: '驾驶模式', desc: '边开车边练习的免提对话 — 执法官语音提问,你口头作答' },
    { icon: '🚔', title: '模拟检查', desc: '限时模拟检查,混合执法官问答与交通标志,自动评分并保存到进度报告' },
    { icon: '📊', title: '进度报告', desc: '云端跨设备保存进度 — 发现薄弱环节,追踪长期进步' },
  ],
  es: [
    { icon: '🎯', title: 'Preguntas del oficial', desc: 'Cada pregunta de inspección con respuestas exactas en inglés y explicaciones multilingües' },
    { icon: '🚦', title: 'Señales de tráfico', desc: 'Biblioteca completa MUTCD de EE. UU. — identificar, explicar y decir la acción correcta del conductor en inglés' },
    { icon: '🎧', title: 'Ejercicios de escucha', desc: 'Voz del oficial a velocidad lenta, normal y rápida — entrena tu oído para condiciones reales' },
    { icon: '🎤', title: 'Pronunciación con IA', desc: 'Graba tu respuesta y obtén puntuación palabra por palabra de OpenAI Whisper' },
    { icon: '🚗', title: 'Modo Conducción', desc: 'Práctica de conversación manos libres mientras conduces — el oficial habla, tú respondes verbalmente' },
    { icon: '🚔', title: 'Inspección simulada', desc: 'Simulación cronometrada que combina preguntas del oficial y señales, con puntuación guardada en tu informe' },
    { icon: '📊', title: 'Informe de progreso', desc: 'Progreso guardado en la nube en todos los dispositivos — detecta puntos débiles y sigue tu mejora' },
  ],
  hi: [
    { icon: '🎯', title: 'ऑफिसर प्रश्नोत्तर', desc: 'हर सड़क निरीक्षण प्रश्न के सटीक अंग्रेज़ी उत्तर और बहुभाषी व्याख्या' },
    { icon: '🚦', title: 'यातायात चिह्न', desc: 'पूरी US MUTCD चिह्न लाइब्रेरी — पहचानें, समझाएँ, और अंग्रेज़ी में सही ड्राइवर क्रिया बताएँ' },
    { icon: '🎧', title: 'सुनने का अभ्यास', desc: 'धीमी, सामान्य और तेज़ गति पर ऑफिसर की आवाज़ — असली सड़क हालात के लिए अपने कान तैयार करें' },
    { icon: '🎤', title: 'AI उच्चारण स्कोरिंग', desc: 'अपना उत्तर रिकॉर्ड करें, OpenAI Whisper से शब्द-दर-शब्द उच्चारण स्कोर पाएँ' },
    { icon: '🚗', title: 'ड्राइव मोड', desc: 'गाड़ी चलाते समय हैंड्स-फ्री बातचीत अभ्यास — ऑफिसर बोलते हैं, आप मौखिक उत्तर देते हैं' },
    { icon: '🚔', title: 'मॉक निरीक्षण', desc: 'समयबद्ध मॉक निरीक्षण जिसमें ऑफिसर प्रश्न और चिह्न मिलाए जाते हैं, स्कोर आपकी प्रगति रिपोर्ट में सहेजा जाता है' },
    { icon: '📊', title: 'प्रगति रिपोर्ट', desc: 'सभी डिवाइस पर क्लाउड में सहेजी गई प्रगति — कमज़ोरियाँ देखें, समय के साथ सुधार ट्रैक करें' },
  ],
  pa: [
    { icon: '🎯', title: 'ਅਫ਼ਸਰ ਸਵਾਲ-ਜਵਾਬ', desc: 'ਹਰ ਸੜਕ ਨਿਰੀਖਣ ਸਵਾਲ ਦੇ ਸਹੀ ਅੰਗਰੇਜ਼ੀ ਜਵਾਬ ਅਤੇ ਬਹੁ-ਭਾਸ਼ਾਈ ਵਿਆਖਿਆ' },
    { icon: '🚦', title: 'ਆਵਾਜਾਈ ਚਿੰਨ੍ਹ', desc: 'ਪੂਰੀ US MUTCD ਚਿੰਨ੍ਹ ਲਾਇਬ੍ਰੇਰੀ — ਪਛਾਣੋ, ਸਮਝਾਓ ਅਤੇ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਸਹੀ ਡਰਾਈਵਰ ਕਾਰਵਾਈ ਦੱਸੋ' },
    { icon: '🎧', title: 'ਸੁਣਨ ਦਾ ਅਭਿਆਸ', desc: 'ਹੌਲੀ, ਆਮ ਅਤੇ ਤੇਜ਼ ਰਫ਼ਤਾਰ ਤੇ ਅਫ਼ਸਰ ਦੀ ਆਵਾਜ਼ — ਅਸਲੀ ਸੜਕ ਹਾਲਾਤ ਲਈ ਆਪਣੇ ਕੰਨ ਤਿਆਰ ਕਰੋ' },
    { icon: '🎤', title: 'AI ਉਚਾਰਨ ਸਕੋਰਿੰਗ', desc: 'ਆਪਣਾ ਜਵਾਬ ਰਿਕਾਰਡ ਕਰੋ ਅਤੇ OpenAI Whisper ਤੋਂ ਸ਼ਬਦ-ਦਰ-ਸ਼ਬਦ ਉਚਾਰਨ ਸਕੋਰ ਪ੍ਰਾਪਤ ਕਰੋ' },
    { icon: '🚗', title: 'ਡ੍ਰਾਈਵ ਮੋਡ', desc: 'ਗੱਡੀ ਚਲਾਉਂਦੇ ਹੋਏ ਹੈਂਡਜ਼-ਫ੍ਰੀ ਗੱਲਬਾਤ ਦਾ ਅਭਿਆਸ — ਅਫ਼ਸਰ ਬੋਲਦੇ ਹਨ, ਤੁਸੀਂ ਜ਼ੁਬਾਨੀ ਜਵਾਬ ਦਿੰਦੇ ਹੋ' },
    { icon: '🚔', title: 'ਨਕਲੀ ਨਿਰੀਖਣ', desc: 'ਸਮੇਂ ਅਨੁਸਾਰ ਨਕਲੀ ਨਿਰੀਖਣ ਜੋ ਅਫ਼ਸਰ ਸਵਾਲਾਂ ਅਤੇ ਚਿੰਨ੍ਹਾਂ ਨੂੰ ਮਿਲਾਉਂਦਾ ਹੈ, ਸਕੋਰ ਤੁਹਾਡੀ ਪ੍ਰਗਤੀ ਰਿਪੋਰਟ ਵਿੱਚ ਸੰਭਾਲਿਆ ਜਾਂਦਾ ਹੈ' },
    { icon: '📊', title: 'ਪ੍ਰਗਤੀ ਰਿਪੋਰਟ', desc: 'ਸਾਰੇ ਡਿਵਾਈਸਾਂ ਤੇ ਕਲਾਉਡ ਵਿੱਚ ਸੰਭਾਲੀ ਪ੍ਰਗਤੀ — ਕਮਜ਼ੋਰੀਆਂ ਵੇਖੋ, ਸਮੇਂ ਨਾਲ ਸੁਧਾਰ ਟ੍ਰੈਕ ਕਰੋ' },
  ],
  vi: [
    { icon: '🎯', title: 'Hỏi đáp với cảnh sát', desc: 'Mọi câu hỏi kiểm tra trên đường kèm câu trả lời tiếng Anh chính xác và giải thích đa ngôn ngữ' },
    { icon: '🚦', title: 'Biển báo giao thông', desc: 'Thư viện biển báo MUTCD Hoa Kỳ đầy đủ — nhận diện, giải thích và nêu hành động đúng của tài xế bằng tiếng Anh' },
    { icon: '🎧', title: 'Luyện nghe', desc: 'Giọng cảnh sát ở tốc độ chậm, bình thường và nhanh — luyện tai cho tình huống thật trên đường' },
    { icon: '🎤', title: 'Chấm phát âm bằng AI', desc: 'Ghi âm câu trả lời, nhận điểm phát âm từng từ từ OpenAI Whisper' },
    { icon: '🚗', title: 'Chế độ Lái xe', desc: 'Luyện hội thoại rảnh tay khi đang lái — cảnh sát hỏi, bạn trả lời bằng giọng nói' },
    { icon: '🚔', title: 'Kiểm tra mô phỏng', desc: 'Bài mô phỏng có tính giờ kết hợp hỏi đáp cảnh sát và biển báo, được chấm điểm và lưu vào báo cáo tiến độ của bạn' },
    { icon: '📊', title: 'Báo cáo tiến độ', desc: 'Tiến độ lưu trên đám mây trên mọi thiết bị — nhận biết điểm yếu, theo dõi tiến bộ theo thời gian' },
  ],
}

// Last feature card kept untouched per user request — always English.
const FIVE_LANG_CARD = {
  icon: '🌍',
  title: '5 Languages',
  desc: 'Interface in Chinese, Spanish, Hindi, Punjabi, Vietnamese — practice answers in English',
}

export default function HomePage() {
  const [lang, setLang] = useState('en')
  const t = T[lang] || T.en
  const features = FEATURES_BY_LANG[lang] || FEATURES_BY_LANG.en

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: '#0f172a', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.6rem' }}>🚛</span>
          <div>
            <div style={{ fontWeight: 800, color: '#fff', fontSize: '1rem' }}>CDL English Pro</div>
            <div style={{ fontSize: '.68rem', color: '#64748b' }}>{t.tagline}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            aria-label="Interface language"
            style={{ padding: '7px 10px', borderRadius: 8, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '.82rem', fontWeight: 600 }}
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <SignedOut>
            <Link href="/sign-in" style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', color: '#94a3b8', fontSize: '.84rem', fontWeight: 500, textDecoration: 'none' }}>{t.signIn}</Link>
            <Link href="/sign-up" style={{ padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: '.84rem', fontWeight: 700, textDecoration: 'none' }}>{t.startFree}</Link>
          </SignedOut>
          <SignedIn>
            <Link href="/practice" style={{ padding: '8px 18px', borderRadius: 8, background: '#2563eb', color: '#fff', fontSize: '.84rem', fontWeight: 700, textDecoration: 'none' }}>{t.continue}</Link>
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(248,113,113,.3)', color: '#fca5a5', borderRadius: 999, padding: '5px 18px', fontSize: '.74rem', fontWeight: 600, marginBottom: 28 }}>
          {t.badge}
        </div>
        <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 22, letterSpacing: '-.02em' }}>
          {t.h1a}<br />
          <span style={{ background: 'linear-gradient(90deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t.h1b}
          </span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
          {t.sub}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <SignedOut>
            <Link href="/sign-up" style={{ padding: '15px 36px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 4px 24px rgba(99,102,241,.4)' }}>
              {t.ctaStart}
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/practice" style={{ padding: '15px 36px', borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 800, fontSize: '1rem', textDecoration: 'none' }}>{t.continue}</Link>
          </SignedIn>
          <Link href="/drive" style={{ padding: '15px 36px', borderRadius: 10, border: '1px solid #4338ca', color: '#c7d2fe', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }}>
            {t.ctaDrive}
          </Link>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
        {features.map(f => (
          <div key={f.title} style={{ background: '#1e293b', border: '1px solid #253347', borderRadius: 12, padding: '18px 16px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem', marginBottom: 5 }}>{f.title}</div>
            <div style={{ color: '#64748b', fontSize: '.8rem', lineHeight: 1.6 }}>{f.desc}</div>
          </div>
        ))}
        {/* Last card — intentionally left untouched (English) per user request */}
        <div key={FIVE_LANG_CARD.title} style={{ background: '#1e293b', border: '1px solid #253347', borderRadius: 12, padding: '18px 16px' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{FIVE_LANG_CARD.icon}</div>
          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem', marginBottom: 5 }}>{FIVE_LANG_CARD.title}</div>
          <div style={{ color: '#64748b', fontSize: '.8rem', lineHeight: 1.6 }}>{FIVE_LANG_CARD.desc}</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#334155', fontSize: '.72rem', padding: '0 24px 40px' }}>
        {t.footer1}<br />
        {t.footer2}
      </div>
    </div>
  )
}
