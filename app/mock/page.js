'use client'
import { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import AppShell from '@/components/AppShell'
import { QUESTIONS, SIGNS, scoreKeywords } from '@/lib/data'

function shuffle(arr) { return [...arr].sort(() => Math.random() - .5) }

function buildMock() {
  const items = []
  const plan = [
    ['Basic Identity / Documents', 3],
    ['Route / Cargo', 3],
    ['HOS / ELD', 3],
    ['Vehicle Condition', 3],
    ['Accident / Emergency', 2],
  ]
  plan.forEach(([cat, n]) => {
    shuffle(QUESTIONS.filter(q => q.category === cat)).slice(0, n)
      .forEach(q => items.push({ type: 'question', data: q }))
  })
  shuffle(SIGNS).slice(0, 5).forEach(s => items.push({ type: 'sign', data: s }))
  return shuffle(items)
}

// i18n
const MT = {
  en: {
    title: '🚔 Mock Roadside Inspection',
    subtitle: 'Randomized officer Q&A and traffic signs. Answer verbally in English to get AI scoring and a readiness assessment.',
    mode: 'Choose answer mode',
    modeWrite: '✍️ Written mode — type answers',
    modeSpeak: '🎤 Speaking mode — voice answers',
    modeWriteDesc: 'Good for learning and review. Submit typed English answers for scoring.',
    modeSpeakDesc: 'Real-world practice for drivers. Record each answer and get AI scoring.',
    startWrite: '▶ Start written inspection',
    startSpeak: '▶ Start spoken inspection',
    answered: 'answered',
    submit: '🏆 Submit inspection',
    result: '🏆 Inspection result',
    excellent: 'Ready for the road!', good: 'Keep practicing.', poor: 'Needs more practice',
    breakdown: 'Per-question breakdown',
    tryAgain: 'Try again', fullReport: '📊 Full report', practice: 'Keep practicing',
    disclaimer: '⚠️ Training only. Not an official DOT assessment.',
    typeHere: 'Type your answer in English…',
    signQ: 'What does this sign mean? What should you do?',
    tap2speak: '🎤 Record answer',
    stopRec: '⏹ Stop',
    listening: 'Recording…', processing: 'Processing…',
    score: 'AI score',
    yourAns: 'Your answer', modelAns: 'Model answer',
    nextQ: 'Next →', skip: 'Skip',
    complete: 'Complete',
    officerQ: 'Officer question', signLabel: 'Traffic sign',
    autoPlay: '▶ Play all', stopPlay: '⏸ Pause',
  },
  zh: {
    title: '🚔 模拟路边检查',
    subtitle: '19道随机题：14道警官问答 + 5道交通标志。用英语口头回答，获得 AI 评分和准备度评估。',
    mode: '选择答题模式',
    modeWrite: '✍️ 书面模式 — 打字作答',
    modeSpeak: '🎤 口语模式 — 语音作答',
    modeWriteDesc: '适合学习和复习。输入英文回答后提交评分。',
    modeSpeakDesc: '适合驾驶员实战练习。对每个问题录音并获得 AI 评分。',
    startWrite: '▶ 开始书面检查',
    startSpeak: '▶ 开始口语检查',
    answered: '已回答',
    submit: '🏆 提交检查',
    result: '🏆 检查结果',
    excellent: '准备充分！', good: '继续练习。', poor: '需要大量练习',
    breakdown: '逐题分析',
    tryAgain: '再试一次', fullReport: '📊 完整报告', practice: '继续练习',
    disclaimer: '⚠️ 仅供训练，非官方 DOT 评估。',
    typeHere: '用英语输入您的回答…',
    signQ: '这个标志是什么意思？你应该怎么做？',
    tap2speak: '🎤 录音回答',
    stopRec: '⏹ 停止',
    listening: '录音中…', processing: '处理中…',
    score: 'AI 评分',
    yourAns: '你的回答', modelAns: '参考答案',
    nextQ: '下一题 →', skip: '跳过',
    complete: '已完成',
    officerQ: '警官问题', signLabel: '交通标志',
    autoPlay: '▶ 连续播放', stopPlay: '⏸ 暂停',
  },
  es: {
    title: '🚔 Inspección simulada de carretera',
    subtitle: '19 preguntas aleatorias: 14 Q&A de oficial + 5 señales de tráfico.',
    mode: 'Seleccionar modo',
    modeWrite: '✍️ Modo escrito — escribir respuestas',
    modeSpeak: '🎤 Modo oral — respuestas de voz',
    modeWriteDesc: 'Ideal para aprender y repasar.',
    modeSpeakDesc: 'Práctica real para conductores CDL.',
    startWrite: '▶ Iniciar inspección escrita',
    startSpeak: '▶ Iniciar inspección oral',
    answered: 'Respondidas',
    submit: '🏆 Enviar inspección',
    result: '🏆 Resultado de inspección',
    excellent: '¡Excelente preparación!', good: 'Siga practicando.', poor: 'Necesita más práctica',
    breakdown: 'Desglose por pregunta',
    tryAgain: 'Intentar de nuevo', fullReport: '📊 Informe completo', practice: 'Seguir practicando',
    disclaimer: '⚠️ Solo entrenamiento. No es evaluación oficial DOT.',
    typeHere: 'Escriba su respuesta en inglés…',
    signQ: '¿Qué significa esta señal? ¿Qué debe hacer?',
    tap2speak: '🎤 Grabar respuesta',
    stopRec: '⏹ Detener',
    listening: 'Grabando…', processing: 'Procesando…',
    score: 'Puntuación AI',
    yourAns: 'Su respuesta', modelAns: 'Respuesta modelo',
    nextQ: 'Siguiente →', skip: 'Omitir',
    complete: 'Completado',
    officerQ: 'Pregunta del oficial', signLabel: 'Señal de tráfico',
    autoPlay: '▶ Reproducir todo', stopPlay: '⏸ Pausar',
  },
  hi: {
    title: '🚔 नकली सड़क जाँच',
    subtitle: '19 यादृच्छिक प्रश्न: 14 अधिकारी Q&A + 5 यातायात चिह्न।',
    mode: 'मोड चुनें',
    modeWrite: '✍️ लिखित मोड — टाइप करके जवाब दें',
    modeSpeak: '🎤 मौखिक मोड — आवाज़ से जवाब दें',
    modeWriteDesc: 'सीखने और दोहराने के लिए।',
    modeSpeakDesc: 'CDL ड्राइवरों के लिए व्यावहारिक अभ्यास।',
    startWrite: '▶ लिखित जाँच शुरू करें',
    startSpeak: '▶ मौखिक जाँच शुरू करें',
    answered: 'उत्तर दिए',
    submit: '🏆 जाँच जमा करें',
    result: '🏆 जाँच परिणाम',
    excellent: 'उत्कृष्ट!', good: 'अभ्यास जारी रखें।', poor: 'अधिक अभ्यास चाहिए',
    breakdown: 'प्रश्नवार विश्लेषण',
    tryAgain: 'फिर कोशिश करें', fullReport: '📊 पूरी रिपोर्ट', practice: 'अभ्यास जारी रखें',
    disclaimer: '⚠️ केवल प्रशिक्षण। आधिकारिक DOT मूल्यांकन नहीं।',
    typeHere: 'अंग्रेज़ी में जवाब टाइप करें…',
    signQ: 'इस चिह्न का क्या मतलब है? आपको क्या करना चाहिए?',
    tap2speak: '🎤 जवाब रिकॉर्ड करें',
    stopRec: '⏹ रोकें',
    listening: 'रिकॉर्ड हो रहा है…', processing: 'प्रसंस्करण…',
    score: 'AI स्कोर',
    yourAns: 'आपका जवाब', modelAns: 'सही जवाब',
    nextQ: 'अगला →', skip: 'छोड़ें',
    complete: 'पूर्ण',
    officerQ: 'अधिकारी प्रश्न', signLabel: 'यातायात चिह्न',
    autoPlay: '▶ सभी चलाएं', stopPlay: '⏸ रोकें',
  },
  pa: {
    title: '🚔 ਨਕਲੀ ਸੜਕ ਜਾਂਚ',
    subtitle: '19 ਬੇਤਰਤੀਬੇ ਸਵਾਲ: 14 ਅਫਸਰ Q&A + 5 ਆਵਾਜਾਈ ਚਿੰਨ੍ਹ।',
    mode: 'ਮੋਡ ਚੁਣੋ',
    modeWrite: '✍️ ਲਿਖਤੀ ਮੋਡ — ਟਾਈਪ ਕਰੋ',
    modeSpeak: '🎤 ਜ਼ੁਬਾਨੀ ਮੋਡ — ਆਵਾਜ਼ ਨਾਲ ਜਵਾਬ ਦਿਓ',
    modeWriteDesc: 'ਸਿੱਖਣ ਅਤੇ ਦੁਹਰਾਉਣ ਲਈ।',
    modeSpeakDesc: 'CDL ਡ੍ਰਾਈਵਰਾਂ ਲਈ ਅਸਲ ਅਭਿਆਸ।',
    startWrite: '▶ ਲਿਖਤੀ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    startSpeak: '▶ ਜ਼ੁਬਾਨੀ ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    answered: 'ਜਵਾਬ ਦਿੱਤੇ',
    submit: '🏆 ਜਾਂਚ ਜਮ੍ਹਾ ਕਰੋ',
    result: '🏆 ਜਾਂਚ ਨਤੀਜਾ',
    excellent: 'ਬਹੁਤ ਵਧੀਆ!', good: 'ਅਭਿਆਸ ਜਾਰੀ ਰੱਖੋ।', poor: 'ਹੋਰ ਅਭਿਆਸ ਚਾਹੀਦਾ ਹੈ',
    breakdown: 'ਸਵਾਲ-ਦਰ-ਸਵਾਲ ਵਿਸ਼ਲੇਸ਼ਣ',
    tryAgain: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼', fullReport: '📊 ਪੂਰੀ ਰਿਪੋਰਟ', practice: 'ਅਭਿਆਸ ਜਾਰੀ ਰੱਖੋ',
    disclaimer: '⚠️ ਕੇਵਲ ਸਿਖਲਾਈ। ਅਧਿਕਾਰਤ DOT ਮੁਲਾਂਕਣ ਨਹੀਂ।',
    typeHere: 'ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਜਵਾਬ ਟਾਈਪ ਕਰੋ…',
    signQ: 'ਇਸ ਚਿੰਨ੍ਹ ਦਾ ਕੀ ਮਤਲਬ ਹੈ? ਤੁਹਾਨੂੰ ਕੀ ਕਰਨਾ ਚਾਹੀਦਾ ਹੈ?',
    tap2speak: '🎤 ਜਵਾਬ ਰਿਕਾਰਡ ਕਰੋ',
    stopRec: '⏹ ਰੋਕੋ',
    listening: 'ਰਿਕਾਰਡ ਹੋ ਰਿਹਾ ਹੈ…', processing: 'ਪ੍ਰੋਸੈਸਿੰਗ…',
    score: 'AI ਸਕੋਰ',
    yourAns: 'ਤੁਹਾਡਾ ਜਵਾਬ', modelAns: 'ਸਹੀ ਜਵਾਬ',
    nextQ: 'ਅਗਲਾ →', skip: 'ਛੱਡੋ',
    complete: 'ਪੂਰਾ ਹੋਇਆ',
    officerQ: 'ਅਫਸਰ ਸਵਾਲ', signLabel: 'ਆਵਾਜਾਈ ਚਿੰਨ੍ਹ',
    autoPlay: '▶ ਸਾਰੇ ਚਲਾਓ', stopPlay: '⏸ ਰੋਕੋ',
  },
  vi: {
    title: '🚔 Kiểm tra đường bộ mô phỏng',
    subtitle: '19 câu hỏi ngẫu nhiên: 14 Q&A viên chức + 5 biển báo.',
    mode: 'Chọn chế độ',
    modeWrite: '✍️ Chế độ viết — gõ câu trả lời',
    modeSpeak: '🎤 Chế độ nói — trả lời bằng giọng nói',
    modeWriteDesc: 'Thích hợp để học và ôn tập.',
    modeSpeakDesc: 'Luyện tập thực tế cho tài xế CDL.',
    startWrite: '▶ Bắt đầu kiểm tra viết',
    startSpeak: '▶ Bắt đầu kiểm tra nói',
    answered: 'Đã trả lời',
    submit: '🏆 Nộp bài kiểm tra',
    result: '🏆 Kết quả kiểm tra',
    excellent: 'Xuất sắc!', good: 'Tiếp tục luyện tập.', poor: 'Cần luyện thêm nhiều',
    breakdown: 'Phân tích từng câu',
    tryAgain: 'Thử lại', fullReport: '📊 Báo cáo đầy đủ', practice: 'Tiếp tục luyện tập',
    disclaimer: '⚠️ Chỉ để đào tạo. Không phải đánh giá DOT chính thức.',
    typeHere: 'Nhập câu trả lời bằng tiếng Anh…',
    signQ: 'Biển báo này có nghĩa gì? Bạn phải làm gì?',
    tap2speak: '🎤 Ghi âm câu trả lời',
    stopRec: '⏹ Dừng',
    listening: 'Đang ghi âm…', processing: 'Đang xử lý…',
    score: 'Điểm AI',
    yourAns: 'Câu trả lời của bạn', modelAns: 'Câu trả lời mẫu',
    nextQ: 'Tiếp theo →', skip: 'Bỏ qua',
    complete: 'Hoàn thành',
    officerQ: 'Câu hỏi viên chức', signLabel: 'Biển báo giao thông',
    autoPlay: '▶ Phát tất cả', stopPlay: '⏸ Dừng',
  },
}

function mt(lang, key) {
  const t = MT[lang] || MT.en
  return t[key] !== undefined ? t[key] : (MT.en[key] || key)
}

// ── Speak helper — real OpenAI voice with browser-synth fallback ─────
let currentMockAudio = null

function stopCurrentMockAudio() {
  if (currentMockAudio) { try { currentMockAudio.pause() } catch {} ; currentMockAudio = null }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
}

async function speakText(text, onEnd) {
  stopCurrentMockAudio()
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId: 'north_m', speed: 0.92 }),
    })
    if (!res.ok) throw new Error('TTS ' + res.status)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    currentMockAudio = audio
    audio.onended = () => { URL.revokeObjectURL(url); if (currentMockAudio === audio) currentMockAudio = null; onEnd?.() }
    audio.onerror = () => { URL.revokeObjectURL(url); if (currentMockAudio === audio) currentMockAudio = null; onEnd?.() }
    await audio.play()
  } catch (e) {
    console.error('Mock TTS fallback:', e)
    if (typeof window === 'undefined' || !window.speechSynthesis) { setTimeout(() => onEnd?.(), 100); return }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = 0.92; u.pitch = 0.88
    if (onEnd) { u.onend = () => onEnd(); u.onerror = () => onEnd() }
    window.speechSynthesis.speak(u)
  }
}

export default function MockPage() {
  const [lang, setLang] = useState('zh')
  const [mode, setMode] = useState(null) // null | 'write' | 'speak'
  const [phase, setPhase] = useState('intro') // intro | active | result
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Speak mode state
  const [speakIdx, setSpeakIdx] = useState(0)
  const [recState, setRecState] = useState('idle') // idle | listening | processing | done
  const [speakScores, setSpeakScores] = useState([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [currentScore, setCurrentScore] = useState(null)
  const mrRef = useRef(null)
  const autoPlayRef = useRef(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const items = useMemo(() => buildMock(), [])

  function setAns(i, v) { setAnswers(prev => ({ ...prev, [i]: v })) }
  const answeredCount = Object.values(answers).filter(v => v?.trim?.().length > 0).length

  // ── Written submit ────────────────────────────
  async function submitWritten() {
    setSaving(true)
    let total = 0
    const details = items.map((item, i) => {
      const ans = answers[i] || ''
      const kws = item.type === 'question' ? (item.data.required_keywords || []) : (item.data.keywords || [])
      const score = scoreKeywords(ans, kws)
      total += score
      return {
        idx: i, type: item.type, score,
        question: item.type === 'question' ? item.data.officer_question_en : item.data.name,
        userAnswer: ans,
        correctAnswer: item.type === 'question' ? item.data.simple_driver_answer_en : `${item.data.meaning} | Action: ${item.data.action}`
      }
    })
    const avg = Math.round(total / items.length)
    setResult({ avg, details })
    setPhase('result')
    try { await fetch('/api/mock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: avg, totalItems: items.length, details }) }) } catch {}
    setSaving(false)
  }

  // ── Speak mode: record one answer ────────────
  async function startRec() {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' })
      const chunks = []
      mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setRecState('processing')
        const blob = new Blob(chunks, { type: mr.mimeType })
        const fd = new FormData()
        fd.append('audio', blob, 'mock.webm')
        let text = ''
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          if (res.ok) { const d = await res.json(); text = d.text || '' }
        } catch {}
        setCurrentTranscript(text)
        // Score it
        const item = items[speakIdx]
        const kws = item.type === 'question' ? (item.data.required_keywords || []) : (item.data.keywords || [])
        let score = 0
        try {
          const res = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              questionCode: item.type === 'question' ? item.data.question_code : item.data.sign_code,
              officerQuestion: item.type === 'question' ? item.data.officer_question_en : item.data.name,
              correctAnswer: item.type === 'question' ? item.data.simple_driver_answer_en : item.data.meaning,
              keywords: kws,
              userAnswer: text,
              userLanguage: lang,
            })
          })
          if (res.ok) { const d = await res.json(); score = d.score || 0 }
        } catch { score = scoreKeywords(text, kws) }
        setCurrentScore(score)
        setRecState('done')
      }
      mr.start()
      mrRef.current = mr
      setRecState('listening')
    } catch { setRecState('idle') }
  }

  function stopRec() {
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop()
  }

  function nextSpeakQ() {
    setSpeakScores(prev => [...prev, currentScore ?? 0])
    setAnswers(prev => ({ ...prev, [speakIdx]: currentTranscript }))
    const next = speakIdx + 1
    if (next >= items.length) {
      // Build result from speakScores + currentScore
      const allScores = [...speakScores, currentScore ?? 0]
      const details = items.map((item, i) => ({
        idx: i, type: item.type,
        score: allScores[i] ?? 0,
        question: item.type === 'question' ? item.data.officer_question_en : item.data.name,
        userAnswer: i === speakIdx ? currentTranscript : (answers[i] || ''),
        correctAnswer: item.type === 'question' ? item.data.simple_driver_answer_en : `${item.data.meaning} | Action: ${item.data.action}`
      }))
      const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / items.length)
      setResult({ avg, details })
      setPhase('result')
      fetch('/api/mock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ score: avg, totalItems: items.length, details }) }).catch(() => {})
    } else {
      setSpeakIdx(next)
      setRecState('idle')
      setCurrentTranscript('')
      setCurrentScore(null)
      // Auto-speak the next question
      const nextItem = items[next]
      const qText = nextItem.type === 'question' ? nextItem.data.officer_question_en : (mt(lang, 'signQ'))
      setTimeout(() => speakText(qText), 300)
    }
  }

  function skipSpeakQ() {
    setSpeakScores(prev => [...prev, 0])
    const next = speakIdx + 1
    if (next >= items.length) {
      const allScores = [...speakScores, 0]
      const details = items.map((item, i) => ({
        idx: i, type: item.type, score: allScores[i] ?? 0,
        question: item.type === 'question' ? item.data.officer_question_en : item.data.name,
        userAnswer: answers[i] || '',
        correctAnswer: item.type === 'question' ? item.data.simple_driver_answer_en : `${item.data.meaning} | Action: ${item.data.action}`
      }))
      const avg = Math.round(allScores.reduce((a, b) => a + b, 0) / items.length)
      setResult({ avg, details })
      setPhase('result')
    } else {
      setSpeakIdx(next)
      setRecState('idle')
      setCurrentTranscript('')
      setCurrentScore(null)
      const nextItem = items[next]
      setTimeout(() => speakText(nextItem.type === 'question' ? nextItem.data.officer_question_en : mt(lang, 'signQ')), 300)
    }
  }

  // ── Continuous play ───────────────────────────
  function startAutoPlay() {
    autoPlayRef.current = true
    setIsAutoPlaying(true)
    playMockItem(items, 0)
  }
  function stopAutoPlay() {
    autoPlayRef.current = false
    setIsAutoPlaying(false)
    stopCurrentMockAudio()
  }
  function playMockItem(list, idx) {
    if (!autoPlayRef.current || idx >= list.length) {
      autoPlayRef.current = false
      setIsAutoPlaying(false)
      return
    }
    const item = list[idx]
    const text = item.type === 'question' ? item.data.officer_question_en : item.data.name
    speakText(text, () => {
      if (!autoPlayRef.current) return
      setTimeout(() => playMockItem(list, idx + 1), 4000)
    })
  }

  // ── INTRO ──────────────────────────────────────
  if (phase === 'intro') return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚔</div>
        <h2 className="card-title" style={{ justifyContent: 'center' }}>{mt(lang, 'title')}</h2>
        <p className="text-muted" style={{ maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>{mt(lang, 'subtitle')}</p>

        <div className="grid-3" style={{ maxWidth: 420, margin: '0 auto 24px', textAlign: 'left' }}>
          {[['📋 Documents', '3 Q'], ['📦 Route/Cargo', '3 Q'], ['⏱ HOS/ELD', '3 Q'], ['🔧 Vehicle', '3 Q'], ['🚨 Emergency', '2 Q'], ['🚦 Signs', '5 Q']].map(([k, v]) => (
            <div key={k} style={{ background: 'var(--bg3)', borderRadius: 'var(--rs)', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '.8rem', fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Mode selection (fix #3) */}
        <h3 style={{ marginBottom: 14, fontSize: '.9rem' }}>{mt(lang, 'mode')}</h3>
        <div className="grid-2" style={{ maxWidth: 520, margin: '0 auto 20px', textAlign: 'left' }}>
          <div
            className={`mode-card ${mode === 'write' ? 'selected' : ''}`}
            onClick={() => setMode('write')}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>✍️</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{mt(lang, 'modeWrite')}</div>
            <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{mt(lang, 'modeWriteDesc')}</div>
          </div>
          <div
            className={`mode-card ${mode === 'speak' ? 'selected' : ''}`}
            onClick={() => setMode('speak')}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🎤</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{mt(lang, 'modeSpeak')}</div>
            <div style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{mt(lang, 'modeSpeakDesc')}</div>
          </div>
        </div>

        <div className="notice warn" style={{ maxWidth: 480, margin: '0 auto 20px', textAlign: 'left' }}>
          <span className="ni">⚠️</span>
          <span>{mt(lang, 'disclaimer')}</span>
        </div>

        {mode === 'write' && (
          <button className="btn btn-primary btn-lg" onClick={() => setPhase('active')}>
            {mt(lang, 'startWrite')}
          </button>
        )}
        {mode === 'speak' && (
          <button className="btn btn-drive btn-lg" onClick={() => {
            setPhase('active')
            setSpeakIdx(0)
            setSpeakScores([])
            setRecState('idle')
            setCurrentTranscript('')
            setCurrentScore(null)
            const firstItem = items[0]
            setTimeout(() => speakText(firstItem.type === 'question' ? firstItem.data.officer_question_en : mt(lang, 'signQ')), 600)
          }}>
            {mt(lang, 'startSpeak')}
          </button>
        )}
      </div>
    </AppShell>
  )

  // ── ACTIVE: Written mode ────────────────────────────────────
  if (phase === 'active' && mode === 'write') return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="between mb-12">
        <h2 style={{ fontWeight: 800 }}>🚔 {mt(lang, 'title')}</h2>
        <div className="flex-c">
          {isAutoPlaying
            ? <button className="btn btn-sm btn-danger" onClick={stopAutoPlay}>{mt(lang, 'stopPlay')}</button>
            : <button className="btn btn-sm btn-success" onClick={startAutoPlay}>{mt(lang, 'autoPlay')}</button>
          }
          <span className="badge badge-blue">{answeredCount} / {items.length} {mt(lang, 'answered')}</span>
        </div>
      </div>
      <div className="bar" style={{ marginBottom: 16 }}>
        <div className="bar-fill brand" style={{ width: Math.round(answeredCount / items.length * 100) + '%' }} />
      </div>

      {items.map((item, i) => (
        <div key={i} className="mock-item">
          <div className="mock-num">
            {i + 1}. {item.type === 'question' ? `👮 ${mt(lang, 'officerQ')} · ${item.data.category}` : `🚦 ${mt(lang, 'signLabel')}`}
          </div>
          {item.type === 'question' ? (
            <div>
              <p className="mock-q">{item.data.officer_question_en}</p>
              <button className="btn btn-sm" style={{ marginBottom: 6 }} onClick={() => speakText(item.data.officer_question_en)}>🔊</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 80, height: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', borderRadius: 'var(--rs)', border: '1px solid var(--line)' }}>
                <Image src={`/signs/${item.data.sign_code}.png`} alt={item.data.name} width={68} height={68} style={{ objectFit: 'contain' }} />
              </div>
              <div>
                <p className="mock-q">{item.data.name}</p>
                <p className="text-muted text-sm">{mt(lang, 'signQ')}</p>
              </div>
            </div>
          )}
          <textarea value={answers[i] || ''} onChange={e => setAns(i, e.target.value)} placeholder={mt(lang, 'typeHere')} style={{ minHeight: 70, marginTop: 6 }} />
        </div>
      ))}

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', padding: '12px 0', borderTop: '1px solid var(--line)' }}>
        <div className="between">
          <span className="text-muted text-sm">{answeredCount}/{items.length} {mt(lang, 'answered')}</span>
          <button className="btn btn-primary btn-lg" onClick={submitWritten} disabled={saving}>
            {saving ? '…' : mt(lang, 'submit')}
          </button>
        </div>
      </div>
    </AppShell>
  )

  // ── ACTIVE: Speak mode — one question at a time (fix #3) ────
  if (phase === 'active' && mode === 'speak') {
    const item = items[speakIdx]
    const qText = item.type === 'question' ? item.data.officer_question_en : item.data.name
    const correctAns = item.type === 'question' ? item.data.simple_driver_answer_en : `${item.data.meaning} | Action: ${item.data.action}`

    return (
      <AppShell lang={lang} setLang={setLang}>
        <div className="between mb-12">
          <h2 style={{ fontWeight: 800 }}>🚔 {mt(lang, 'title')}</h2>
          <span className="badge badge-blue">{speakIdx + 1} / {items.length}</span>
        </div>
        <div className="bar" style={{ marginBottom: 16 }}>
          <div className="bar-fill brand" style={{ width: Math.round(speakIdx / items.length * 100) + '%' }} />
        </div>

        {/* Officer question card */}
        <div className="card" style={{ background: 'linear-gradient(135deg,#0f0c29,#1e1b4b)', border: '1px solid #4338ca', color: '#fff', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>👮</span>
            <div>
              <div style={{ fontSize: '.7rem', opacity: .7, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {item.type === 'question' ? mt(lang, 'officerQ') : mt(lang, 'signLabel')}
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{qText}</div>
            </div>
          </div>
          {item.type === 'sign' && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: 12 }}>
                <Image src={`/signs/${item.data.sign_code}.png`} alt={item.data.name} width={80} height={80} style={{ objectFit: 'contain' }} />
              </div>
            </div>
          )}
          <div className="flex-c">
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }} onClick={() => speakText(qText)}>
              🔊 {item.type === 'sign' ? mt(lang, 'signQ') : 'Replay question'}
            </button>
          </div>
        </div>

        {/* Recording controls */}
        {recState === 'idle' && (
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <p className="text-muted" style={{ marginBottom: 16, fontSize: '.88rem' }}>
              {mt(lang, 'yourAns')}
            </p>
            <button className="btn btn-drive btn-lg" onClick={startRec}>
              {mt(lang, 'tap2speak')}
            </button>
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-sm text-muted" onClick={skipSpeakQ}>{mt(lang, 'skip')}</button>
            </div>
          </div>
        )}

        {recState === 'listening' && (
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div className="rec-zone recording">
              <span className="rec-dot" />
              <span style={{ fontWeight: 600, color: 'var(--red)' }}>{mt(lang, 'listening')}</span>
              <div className="waveform" style={{ margin: '8px auto' }}>
                {[1, 2, 3, 4, 5].map(i => <span key={i} />)}
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={stopRec}>
                {mt(lang, 'stopRec')}
              </button>
            </div>
          </div>
        )}

        {recState === 'processing' && (
          <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div className="spinner" style={{ marginBottom: 10 }} />
            <p className="text-muted">{mt(lang, 'processing')}</p>
          </div>
        )}

        {recState === 'done' && (
          <div className="card">
            {currentTranscript && (
              <div style={{ marginBottom: 12 }}>
                <label>{mt(lang, 'yourAns')}</label>
                <div style={{ background: 'var(--brand-light)', borderRadius: 'var(--rs)', padding: '10px 12px', fontSize: '.88rem', color: 'var(--ink)' }}>
                  {currentTranscript}
                </div>
              </div>
            )}
            {currentScore != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div className="score-ring" style={{ width: 64, height: 64, borderWidth: 4, borderColor: currentScore >= 80 ? 'var(--green)' : currentScore >= 55 ? 'var(--amber)' : 'var(--red)' }}>
                  <span className="score-num-big" style={{ fontSize: '1.2rem', color: currentScore >= 80 ? 'var(--green)' : currentScore >= 55 ? 'var(--amber)' : 'var(--red)' }}>{currentScore}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{mt(lang, 'score')}</div>
                  <div className="bar" style={{ width: 120, marginBottom: 0 }}>
                    <div className="bar-fill" style={{ width: currentScore + '%', background: currentScore >= 80 ? 'var(--green)' : currentScore >= 55 ? 'var(--amber)' : 'var(--red)' }} />
                  </div>
                </div>
              </div>
            )}
            <div className="answer-block" style={{ marginBottom: 10 }}>
              <label style={{ color: 'var(--green)' }}>✓ {mt(lang, 'modelAns')}</label>
              <div style={{ fontSize: '.88rem', marginTop: 4 }}>{correctAns}</div>
            </div>
            <div className="flex-c" style={{ justifyContent: 'center', marginTop: 14 }}>
              <button className="btn btn-drive" onClick={() => { setRecState('idle'); setCurrentTranscript(''); setCurrentScore(null) }}>
                🔄 Re-record
              </button>
              <button className="btn btn-primary" onClick={nextSpeakQ}>
                {speakIdx + 1 < items.length ? mt(lang, 'nextQ') : mt(lang, 'submit')}
              </button>
            </div>
          </div>
        )}
      </AppShell>
    )
  }

  // ── RESULT ─────────────────────────────────────
  if (phase === 'result' && result) {
    const { avg, details } = result
    const color = avg >= 80 ? 'var(--green)' : avg >= 55 ? 'var(--amber)' : 'var(--red)'
    return (
      <AppShell lang={lang} setLang={setLang}>
        <div className="card" style={{ textAlign: 'center', padding: '28px 24px', marginBottom: 16 }}>
          <h2 className="card-title" style={{ justifyContent: 'center' }}>{mt(lang, 'result')}</h2>
          <div className="score-ring" style={{ width: 100, height: 100, margin: '0 auto 16px', borderWidth: 5, borderColor: color }}>
            <span className="score-num-big" style={{ fontSize: '2rem', color }}>{avg}</span>
            <span className="score-label-sm">/100</span>
          </div>
          <div className="bar" style={{ maxWidth: 260, margin: '0 auto 12px' }}>
            <div className="bar-fill" style={{ width: avg + '%', background: color }} />
          </div>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>
            {avg >= 80 ? mt(lang, 'excellent') : avg >= 55 ? mt(lang, 'good') : mt(lang, 'poor')}
          </p>
          <p className="text-muted text-sm">{mt(lang, 'disclaimer')}</p>
        </div>

        <div className="card">
          <h3 className="card-title">{mt(lang, 'breakdown')}</h3>
          {details.map((d, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <div className="between" style={{ marginBottom: 5 }}>
                <span style={{ fontSize: '.8rem', fontWeight: 600 }}>
                  {i + 1}. {d.type === 'sign' ? '🚦' : '👮'} {d.question.length > 60 ? d.question.slice(0, 60) + '…' : d.question}
                </span>
                <span className={`badge ${d.score >= 80 ? 'badge-green' : d.score >= 55 ? 'badge-amber' : 'badge-red'}`}>{d.score}/100</span>
              </div>
              <div className="bar bar-thin" style={{ marginBottom: d.userAnswer ? 4 : 0 }}>
                <div className="bar-fill" style={{ width: d.score + '%', background: d.score >= 80 ? 'var(--green)' : d.score >= 55 ? 'var(--amber)' : 'var(--red)' }} />
              </div>
              {d.userAnswer && <p style={{ fontSize: '.77rem', color: 'var(--muted)' }}>{mt(lang, 'yourAns')}: {d.userAnswer}</p>}
              <p style={{ fontSize: '.77rem', color: 'var(--green)', marginTop: 2 }}>✓ {d.correctAnswer}</p>
            </div>
          ))}
        </div>

        <div className="actions" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-primary" onClick={() => { setPhase('intro'); setMode(null); setSpeakIdx(0); setSpeakScores([]); setAnswers({}) }}>{mt(lang, 'tryAgain')}</button>
          <a href="/report" className="btn">{mt(lang, 'fullReport')}</a>
          <a href="/practice" className="btn">{mt(lang, 'practice')}</a>
        </div>
      </AppShell>
    )
  }
  return null
}
