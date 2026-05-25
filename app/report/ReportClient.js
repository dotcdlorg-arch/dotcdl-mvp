'use client'
import { useState } from 'react'

const LANGS = {
  en: 'English',
  zh: '中文',
  es: 'Español',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  vi: 'Tiếng Việt',
}

const RT = {
  en: {
    brandSub: 'Not affiliated with DOT, FMCSA, or CVSA',
    backToPractice: '← Back to Practice',
    pageTitle: '📊 Training Progress Report',
    pageSub: 'Training only. Not an official DOT, FMCSA, or CVSA assessment. No guarantee of passing any inspection.',
    overall: 'Overall Readiness Estimate',
    strong: 'Strong',
    developing: 'Developing',
    questionsSeen: 'Questions Seen',
    understood: 'Understood',
    needReview: 'Need Review',
    avgQ: 'Avg Q Score',
    avgS: 'Avg Sign Score',
    mocksTaken: 'Mocks Taken',
    bestMock: 'Best Mock',
    latestMock: 'Latest Mock',
    catPerf: 'Category Performance',
    seenSuffix: 'seen',
    coverage: 'Coverage',
    avgScore: 'Avg score',
    mockHistory: 'Mock Inspection History',
    nextSteps: 'Next Steps',
    reviewItem: (n) => `Review ${n} questions marked "needs review" in Text Practice`,
    focusItem: 'Focus on HOS/ELD and Vehicle Condition — most commonly tested',
    signItem: 'Practice traffic sign recognition daily — aim for 80+ on all categories',
    driveItem: 'Use Drive Mode for hands-free conversation practice while commuting',
    mockItem: 'Complete a full Mock Inspection after every batch of questions studied',
    targetItem: 'Target 80+ on mock inspections before any real roadside check',
    footerDisclaimer: '⚠️ Training only. Not affiliated with DOT, FMCSA, or CVSA. No guarantee of passing any inspection or exam.',
  },
  zh: {
    brandSub: '非 DOT、FMCSA 或 CVSA 官方',
    backToPractice: '← 返回练习',
    pageTitle: '📊 训练进度报告',
    pageSub: '仅供训练。非 DOT、FMCSA 或 CVSA 官方评估,不保证通过任何检查。',
    overall: '总体准备度评估',
    strong: '良好',
    developing: '需提升',
    questionsSeen: '已看题数',
    understood: '已理解',
    needReview: '需复习',
    avgQ: '问答平均分',
    avgS: '标志平均分',
    mocksTaken: '模拟次数',
    bestMock: '最佳模拟',
    latestMock: '最近模拟',
    catPerf: '分类表现',
    seenSuffix: '已看',
    coverage: '覆盖率',
    avgScore: '平均分',
    mockHistory: '模拟检查历史',
    nextSteps: '下一步',
    reviewItem: (n) => `在文字练习中复习 ${n} 道标记为"需复习"的题目`,
    focusItem: '重点学习 HOS/ELD 与车辆状况 — 是最常考察的内容',
    signItem: '每天练习识别交通标志 — 目标所有分类 80 分以上',
    driveItem: '通勤时使用驾驶模式进行免提对话练习',
    mockItem: '每学习一批题后完成一次完整模拟检查',
    targetItem: '在真实路检前,模拟分数应稳定在 80 以上',
    footerDisclaimer: '⚠️ 仅供训练。非 DOT、FMCSA 或 CVSA 官方,不保证通过任何检查或考试。',
  },
  es: {
    brandSub: 'No afiliado con DOT, FMCSA, ni CVSA',
    backToPractice: '← Volver a Práctica',
    pageTitle: '📊 Informe de progreso de entrenamiento',
    pageSub: 'Solo entrenamiento. No es una evaluación oficial DOT, FMCSA o CVSA. No garantiza aprobar ninguna inspección.',
    overall: 'Estimación general de preparación',
    strong: 'Sólido',
    developing: 'En desarrollo',
    questionsSeen: 'Preguntas vistas',
    understood: 'Entendidas',
    needReview: 'Para repasar',
    avgQ: 'Promedio Q',
    avgS: 'Promedio señales',
    mocksTaken: 'Simulacros',
    bestMock: 'Mejor simulacro',
    latestMock: 'Último simulacro',
    catPerf: 'Rendimiento por categoría',
    seenSuffix: 'vistas',
    coverage: 'Cobertura',
    avgScore: 'Promedio',
    mockHistory: 'Historial de inspecciones simuladas',
    nextSteps: 'Próximos pasos',
    reviewItem: (n) => `Repase ${n} preguntas marcadas como "para repasar" en Práctica de Texto`,
    focusItem: 'Enfóquese en HOS/ELD y Condición del Vehículo — los temas más evaluados',
    signItem: 'Practique señales diariamente — apunte a 80+ en todas las categorías',
    driveItem: 'Use Modo Conducción para conversación manos libres mientras maneja',
    mockItem: 'Complete una inspección simulada completa tras cada bloque de preguntas',
    targetItem: 'Apunte a 80+ en simulacros antes de cualquier inspección real',
    footerDisclaimer: '⚠️ Solo entrenamiento. No afiliado con DOT, FMCSA, o CVSA. No garantiza aprobar inspección o examen.',
  },
  hi: {
    brandSub: 'DOT, FMCSA, या CVSA से संबद्ध नहीं',
    backToPractice: '← अभ्यास पर वापस',
    pageTitle: '📊 प्रशिक्षण प्रगति रिपोर्ट',
    pageSub: 'केवल प्रशिक्षण। DOT, FMCSA, या CVSA का आधिकारिक मूल्यांकन नहीं। किसी निरीक्षण को पास करने की गारंटी नहीं।',
    overall: 'समग्र तत्परता अनुमान',
    strong: 'मजबूत',
    developing: 'विकसित हो रहा',
    questionsSeen: 'देखे गए प्रश्न',
    understood: 'समझे',
    needReview: 'समीक्षा करें',
    avgQ: 'औसत Q स्कोर',
    avgS: 'औसत चिह्न स्कोर',
    mocksTaken: 'मॉक टेस्ट',
    bestMock: 'सर्वश्रेष्ठ मॉक',
    latestMock: 'नवीनतम मॉक',
    catPerf: 'श्रेणी प्रदर्शन',
    seenSuffix: 'देखे',
    coverage: 'कवरेज',
    avgScore: 'औसत स्कोर',
    mockHistory: 'मॉक निरीक्षण इतिहास',
    nextSteps: 'अगले कदम',
    reviewItem: (n) => `पाठ अभ्यास में "समीक्षा करें" चिह्नित ${n} प्रश्नों की समीक्षा करें`,
    focusItem: 'HOS/ELD और वाहन स्थिति पर ध्यान दें — सबसे ज़्यादा परखे जाते हैं',
    signItem: 'रोज़ यातायात चिह्न पहचान का अभ्यास करें — हर श्रेणी में 80+ का लक्ष्य रखें',
    driveItem: 'सफर के दौरान हैंड्स-फ्री बातचीत के लिए ड्राइव मोड का उपयोग करें',
    mockItem: 'प्रश्नों के हर बैच के बाद एक पूरा मॉक निरीक्षण पूरा करें',
    targetItem: 'किसी असली सड़क जांच से पहले मॉक में 80+ का लक्ष्य रखें',
    footerDisclaimer: '⚠️ केवल प्रशिक्षण। DOT, FMCSA, या CVSA से संबद्ध नहीं। किसी परीक्षा को पास करने की गारंटी नहीं।',
  },
  pa: {
    brandSub: 'DOT, FMCSA, ਜਾਂ CVSA ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ',
    backToPractice: '← ਅਭਿਆਸ ਤੇ ਵਾਪਸ',
    pageTitle: '📊 ਸਿਖਲਾਈ ਪ੍ਰਗਤੀ ਰਿਪੋਰਟ',
    pageSub: 'ਸਿਰਫ਼ ਸਿਖਲਾਈ। DOT, FMCSA, ਜਾਂ CVSA ਦਾ ਅਧਿਕਾਰਤ ਮੁਲਾਂਕਣ ਨਹੀਂ। ਕਿਸੇ ਜਾਂਚ ਨੂੰ ਪਾਸ ਕਰਨ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ।',
    overall: 'ਕੁੱਲ ਤਿਆਰੀ ਅੰਦਾਜ਼ਾ',
    strong: 'ਮਜ਼ਬੂਤ',
    developing: 'ਵਿਕਾਸਸ਼ੀਲ',
    questionsSeen: 'ਦੇਖੇ ਸਵਾਲ',
    understood: 'ਸਮਝੇ',
    needReview: 'ਦੁਹਰਾਉਣ ਲਈ',
    avgQ: 'ਔਸਤ Q ਸਕੋਰ',
    avgS: 'ਔਸਤ ਚਿੰਨ੍ਹ ਸਕੋਰ',
    mocksTaken: 'ਮੌਕ ਟੈਸਟ',
    bestMock: 'ਬਿਹਤਰੀਨ ਮੌਕ',
    latestMock: 'ਨਵੀਨਤਮ ਮੌਕ',
    catPerf: 'ਸ਼੍ਰੇਣੀ ਪ੍ਰਦਰਸ਼ਨ',
    seenSuffix: 'ਦੇਖੇ',
    coverage: 'ਕਵਰੇਜ',
    avgScore: 'ਔਸਤ ਸਕੋਰ',
    mockHistory: 'ਮੌਕ ਨਿਰੀਖਣ ਇਤਿਹਾਸ',
    nextSteps: 'ਅਗਲੇ ਕਦਮ',
    reviewItem: (n) => `ਪਾਠ ਅਭਿਆਸ ਵਿੱਚ "ਦੁਹਰਾਉਣ ਲਈ" ਨਿਸ਼ਾਨਿਤ ${n} ਸਵਾਲਾਂ ਦੀ ਸਮੀਖਿਆ ਕਰੋ`,
    focusItem: 'HOS/ELD ਅਤੇ ਵਾਹਨ ਹਾਲਤ ਤੇ ਧਿਆਨ ਦਿਓ — ਸਭ ਤੋਂ ਵੱਧ ਪਰਖੇ ਜਾਂਦੇ ਵਿਸ਼ੇ',
    signItem: 'ਰੋਜ਼ ਆਵਾਜਾਈ ਚਿੰਨ੍ਹਾਂ ਦਾ ਅਭਿਆਸ ਕਰੋ — ਹਰ ਸ਼੍ਰੇਣੀ ਵਿੱਚ 80+ ਦਾ ਟੀਚਾ',
    driveItem: 'ਸਫ਼ਰ ਦੌਰਾਨ ਹੈਂਡਜ਼-ਫ੍ਰੀ ਗੱਲਬਾਤ ਲਈ ਡ੍ਰਾਈਵ ਮੋਡ ਵਰਤੋ',
    mockItem: 'ਸਵਾਲਾਂ ਦੇ ਹਰ ਬੈਚ ਤੋਂ ਬਾਅਦ ਪੂਰਾ ਮੌਕ ਨਿਰੀਖਣ ਪੂਰਾ ਕਰੋ',
    targetItem: 'ਅਸਲੀ ਸੜਕ ਜਾਂਚ ਤੋਂ ਪਹਿਲਾਂ ਮੌਕ ਵਿੱਚ 80+ ਦਾ ਟੀਚਾ ਰੱਖੋ',
    footerDisclaimer: '⚠️ ਸਿਰਫ਼ ਸਿਖਲਾਈ। DOT, FMCSA, ਜਾਂ CVSA ਨਾਲ ਸੰਬੰਧਿਤ ਨਹੀਂ। ਕਿਸੇ ਪ੍ਰੀਖਿਆ ਦੀ ਗਾਰੰਟੀ ਨਹੀਂ।',
  },
  vi: {
    brandSub: 'Không liên kết với DOT, FMCSA, hay CVSA',
    backToPractice: '← Quay lại Luyện tập',
    pageTitle: '📊 Báo cáo Tiến độ Đào tạo',
    pageSub: 'Chỉ để đào tạo. Không phải đánh giá chính thức DOT, FMCSA, hay CVSA. Không đảm bảo vượt qua bất kỳ kỳ kiểm tra nào.',
    overall: 'Ước lượng mức độ sẵn sàng tổng thể',
    strong: 'Vững',
    developing: 'Đang phát triển',
    questionsSeen: 'Câu đã xem',
    understood: 'Đã hiểu',
    needReview: 'Cần ôn lại',
    avgQ: 'Điểm TB câu hỏi',
    avgS: 'Điểm TB biển báo',
    mocksTaken: 'Số lần mô phỏng',
    bestMock: 'Mô phỏng cao nhất',
    latestMock: 'Mô phỏng gần nhất',
    catPerf: 'Hiệu suất theo nhóm',
    seenSuffix: 'đã xem',
    coverage: 'Độ bao phủ',
    avgScore: 'Điểm trung bình',
    mockHistory: 'Lịch sử kiểm tra mô phỏng',
    nextSteps: 'Bước tiếp theo',
    reviewItem: (n) => `Ôn lại ${n} câu hỏi đã đánh dấu "cần ôn lại" trong Luyện tập Văn bản`,
    focusItem: 'Tập trung HOS/ELD và Tình trạng xe — được kiểm tra nhiều nhất',
    signItem: 'Luyện nhận diện biển báo hằng ngày — mục tiêu 80+ ở mọi nhóm',
    driveItem: 'Dùng Chế độ Lái xe để luyện hội thoại rảnh tay khi đang lái',
    mockItem: 'Hoàn thành một bài kiểm tra mô phỏng đầy đủ sau mỗi lượt học câu hỏi',
    targetItem: 'Đạt 80+ ở mô phỏng trước bất kỳ kỳ kiểm tra đường bộ thực tế nào',
    footerDisclaimer: '⚠️ Chỉ để đào tạo. Không liên kết với DOT, FMCSA, hay CVSA. Không đảm bảo vượt qua kỳ kiểm tra hay kỳ thi nào.',
  },
}

function rt(lang, key) {
  return (RT[lang] || RT.en)[key] ?? RT.en[key] ?? key
}

const color = (v) => v >= 80 ? '#059669' : v >= 55 ? '#d97706' : '#dc2626'
const pct   = (v) => Math.max(0, Math.min(100, v))

export default function ReportClient({
  qpLength, totalQuestions, understood, review, avgQ, avgS,
  mocksLength, bestMock, latestMock, catStats, overall, mocks,
}) {
  const [lang, setLang] = useState('en')
  const t = (k) => rt(lang, k)

  const metrics = [
    { val: `${qpLength}/${totalQuestions}`, label: t('questionsSeen') },
    { val: understood, label: t('understood') },
    { val: review, label: t('needReview') },
    { val: avgQ ? `${avgQ}/100` : '—', label: t('avgQ') },
    { val: avgS ? `${avgS}/100` : '—', label: t('avgS') },
    { val: mocksLength, label: t('mocksTaken') },
    { val: bestMock ? `${bestMock}/100` : '—', label: t('bestMock') },
    { val: latestMock ? `${latestMock.score}/100` : '—', label: t('latestMock') },
  ]

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,sans-serif", background: 'var(--bg, #f0f4f8)', minHeight: '100vh', padding: '0 0 80px' }}>
      <header style={{ background: '#0f172a', color: '#fff', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '1.4rem' }}>🚛</span>
        <div>
          <div style={{ fontWeight: 800 }}>CDL English Pro</div>
          <div style={{ fontSize: '.7rem', color: '#475569' }}>{t('brandSub')}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            aria-label="Interface language"
            style={{ padding: '6px 10px', borderRadius: 8, background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', fontSize: '.78rem', fontWeight: 600 }}
          >
            {Object.entries(LANGS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <a href="/practice" style={{ padding: '7px 14px', background: '#1e293b', color: '#e2e8f0', borderRadius: 8, fontSize: '.82rem', textDecoration: 'none', border: '1px solid #334155' }}>
            {t('backToPractice')}
          </a>
        </div>
      </header>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px' }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6 }}>{t('pageTitle')}</h1>
        <p style={{ fontSize: '.75rem', color: '#64748b', marginBottom: 24 }}>{t('pageSub')}</p>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '24px', marginBottom: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{t('overall')}</div>
          <div style={{ fontSize: '3rem', fontWeight: 900, color: color(overall), fontFamily: 'monospace' }}>{overall || '—'}</div>
          <div style={{ fontSize: '.8rem', color: '#64748b', marginBottom: 12 }}>/100 · {overall >= 80 ? t('strong') : t('developing')}</div>
          <div style={{ height: 10, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
            <div style={{ height: '100%', width: pct(overall) + '%', background: color(overall), borderRadius: 999, transition: 'width .5s ease' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace' }}>{m.val}</div>
              <div style={{ fontSize: '.66rem', color: '#64748b', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>{t('catPerf')}</h2>
          {Object.entries(catStats).map(([cat, stat]) => (
            <div key={cat} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: '.85rem', fontWeight: 600 }}>{cat}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '.75rem', color: '#64748b' }}>{stat.seen}/{stat.total} {t('seenSuffix')}</span>
                  {stat.avg > 0 && <span style={{ fontSize: '.78rem', fontWeight: 700, color: color(stat.avg), padding: '1px 7px', background: stat.avg >= 80 ? '#ecfdf5' : stat.avg >= 55 ? '#fffbeb' : '#fef2f2', borderRadius: 999 }}>{stat.avg}/100</span>}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div>
                  <div style={{ fontSize: '.66rem', color: '#94a3b8', marginBottom: 2 }}>{t('coverage')}</div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct(Math.round(stat.seen / stat.total * 100)) + '%', background: '#2563eb', borderRadius: 999 }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '.66rem', color: '#94a3b8', marginBottom: 2 }}>{t('avgScore')}</div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct(stat.avg) + '%', background: color(stat.avg), borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {mocks?.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>{t('mockHistory')}</h2>
            {mocks.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '.78rem', color: '#94a3b8', width: 90, flexShrink: 0 }}>{new Date(m.created_at).toLocaleDateString()}</span>
                <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: m.score + '%', background: color(m.score), borderRadius: 999 }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '.85rem', color: color(m.score), width: 44, textAlign: 'right' }}>{m.score}/100</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>{t('nextSteps')}</h2>
          <ol style={{ paddingLeft: '1.4em', color: '#334155', fontSize: '.87rem', lineHeight: 2 }}>
            {review > 0 && <li>{t('reviewItem')(review)}</li>}
            {avgQ < 80 && <li>{t('focusItem')}</li>}
            {avgS < 80 && <li>{t('signItem')}</li>}
            <li>{t('driveItem')}</li>
            <li>{t('mockItem')}</li>
            <li>{t('targetItem')}</li>
          </ol>
          <p style={{ marginTop: 14, fontSize: '.72rem', color: '#94a3b8' }}>{t('footerDisclaimer')}</p>
        </div>
      </div>
    </div>
  )
}
