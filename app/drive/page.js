'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import AppShell from '@/components/AppShell'
import { QUESTIONS, SCENARIOS } from '@/lib/data'

// ── Officer voice profiles ────────────────────────────────────
const OFFICER_VOICES = [
  { id: 'north_m', label: '🎙️ Northern US — Male',    region: 'Northern', gender: 'male'   },
  { id: 'south_m', label: '🎙️ Southern US — Male',    region: 'Southern', gender: 'male'   },
  { id: 'east_m',  label: '🎙️ Eastern US — Male',     region: 'Eastern',  gender: 'male'   },
  { id: 'west_m',  label: '🎙️ Western US — Male',     region: 'Western',  gender: 'male'   },
  { id: 'north_f', label: '👩‍✈️ Northern US — Female',  region: 'Northern', gender: 'female' },
  { id: 'south_f', label: '👩‍✈️ Southern US — Female',  region: 'Southern', gender: 'female' },
  { id: 'east_f',  label: '👩‍✈️ Eastern US — Female',   region: 'Eastern',  gender: 'female' },
  { id: 'west_f',  label: '👩‍✈️ Western US — Female',   region: 'Western',  gender: 'female' },
]

// ── i18n ──────────────────────────────────────────────────────
const DT = {
  zh: {
    title: '🚗 驾驶模式 — 边开车边练习',
    subtitle: '警官用真实人声说话，你用英语口头回答。专为 CDL 驾驶员设计的语音练习。',
    selectVoice: '选择警官声音',
    voicePreview: '▶ 试听',
    previewing: '正在播放…',
    selectScenario: '选择场景',
    start: '▶ 开始对话',
    restart: '🔄 重新开始',
    officerSays: '警官说',
    yourTurn: '你的回答',
    sessionResult: '会话结果',
    excellent: '非常出色！你已准备好通过路检。',
    good: '表现良好。继续练习弱项。',
    needsPractice: '需要更多练习。每天练习这些场景。',
    disclaimer: '⚠️ 训练用途，非 DOT/FMCSA/CVSA 官方产品。',
    aiScore: 'AI 评分', perfectAns: '参考答案',
    easy: '简单', medium: '中等', hard: '困难',
    listening: '正在录音…', processing: '处理中…', speaking: '警官说话中…',
    tap2speak: '🎤 点击录音', stopRec: '⏹ 停止录音',
    replayQ: '🔊 重播', endEarly: '提前结束',
    tryAgain: '再试一次', fullReport: '📊 完整报告',
    loadingVoice: '加载声音…',
    voiceError: '声音加载失败，使用系统声音',
    previewAll: '▶ 预听所有问题', stopPlay: '⏸ 暂停',
    autoConv: '▶ 自动循环播放', practicing: '跟读练习 — 请跟读发音',
  },
  es: {
    title: '🚗 Modo Conducción — Practica mientras manejas',
    subtitle: 'El oficial habla con voz humana real. Responde en inglés verbalmente.',
    selectVoice: 'Seleccionar voz del oficial',
    voicePreview: '▶ Vista previa',
    previewing: 'Reproduciendo…',
    selectScenario: 'Seleccionar escenario',
    start: '▶ Iniciar conversación',
    restart: '🔄 Reiniciar',
    officerSays: 'El oficial dice',
    yourTurn: 'Tu turno',
    sessionResult: 'Resultado de sesión',
    excellent: '¡Excelente! Listo para inspección.',
    good: 'Buen desempeño. Practica áreas débiles.',
    needsPractice: 'Necesita más práctica diaria.',
    disclaimer: '⚠️ Solo entrenamiento. No garantiza aprobar inspecciones.',
    aiScore: 'Puntuación AI', perfectAns: 'Respuesta modelo',
    easy: 'Fácil', medium: 'Medio', hard: 'Difícil',
    listening: 'Grabando…', processing: 'Procesando…', speaking: 'Oficial hablando…',
    tap2speak: '🎤 Grabar respuesta', stopRec: '⏹ Detener',
    replayQ: '🔊 Repetir', endEarly: 'Terminar sesión',
    tryAgain: 'Intentar de nuevo', fullReport: '📊 Informe completo',
    loadingVoice: 'Cargando voz…',
    voiceError: 'Error de voz, usando sistema',
    previewAll: '▶ Vista previa de preguntas', stopPlay: '⏸ Pausar',
    autoConv: '▶ Auto repetir todo', practicing: 'Repite la pronunciación',
  },
  hi: {
    title: '🚗 ड्राइव मोड — गाड़ी चलाते हुए अभ्यास',
    subtitle: 'अधिकारी असली आवाज़ में बोलते हैं। अंग्रेज़ी में मौखिक उत्तर दें।',
    selectVoice: 'अधिकारी की आवाज़ चुनें',
    voicePreview: '▶ पूर्वावलोकन',
    previewing: 'चल रहा है…',
    selectScenario: 'परिदृश्य चुनें',
    start: '▶ बातचीत शुरू करें',
    restart: '🔄 फिर से शुरू करें',
    officerSays: 'अधिकारी ने कहा',
    yourTurn: 'आपकी बारी',
    sessionResult: 'सत्र परिणाम',
    excellent: 'बहुत बढ़िया! निरीक्षण के लिए तैयार।',
    good: 'अच्छा प्रदर्शन। अभ्यास जारी रखें।',
    needsPractice: 'और अभ्यास की ज़रूरत है।',
    disclaimer: '⚠️ केवल प्रशिक्षण। DOT/FMCSA/CVSA से संबद्ध नहीं।',
    aiScore: 'AI स्कोर', perfectAns: 'सही उत्तर',
    easy: 'आसान', medium: 'मध्यम', hard: 'कठिन',
    listening: 'रिकॉर्ड हो रहा है…', processing: 'प्रसंस्करण…', speaking: 'अधिकारी बोल रहे हैं…',
    tap2speak: '🎤 रिकॉर्ड करें', stopRec: '⏹ रोकें',
    replayQ: '🔊 दोबारा', endEarly: 'सत्र समाप्त',
    tryAgain: 'फिर कोशिश', fullReport: '📊 पूरी रिपोर्ट',
    loadingVoice: 'आवाज़ लोड हो रही है…',
    voiceError: 'आवाज़ त्रुटि, सिस्टम उपयोग कर रहे हैं',
    previewAll: '▶ सभी प्रश्न सुनें', stopPlay: '⏸ रोकें',
    autoConv: '▶ स्वतः दोहराएं', practicing: 'उच्चारण का अभ्यास करें',
  },
  pa: {
    title: '🚗 ਡ੍ਰਾਈਵ ਮੋਡ — ਗੱਡੀ ਚਲਾਉਂਦੇ ਅਭਿਆਸ',
    subtitle: 'ਅਫਸਰ ਅਸਲ ਆਵਾਜ਼ ਵਿੱਚ ਬੋਲਦੇ ਹਨ। ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਜ਼ੁਬਾਨੀ ਜਵਾਬ ਦਿਓ।',
    selectVoice: 'ਅਫਸਰ ਦੀ ਆਵਾਜ਼ ਚੁਣੋ',
    voicePreview: '▶ ਝਲਕ',
    previewing: 'ਚੱਲ ਰਿਹਾ ਹੈ…',
    selectScenario: 'ਦ੍ਰਿਸ਼ ਚੁਣੋ',
    start: '▶ ਗੱਲਬਾਤ ਸ਼ੁਰੂ',
    restart: '🔄 ਮੁੜ ਸ਼ੁਰੂ',
    officerSays: 'ਅਫਸਰ ਨੇ ਕਿਹਾ',
    yourTurn: 'ਤੁਹਾਡੀ ਵਾਰੀ',
    sessionResult: 'ਸੈਸ਼ਨ ਨਤੀਜਾ',
    excellent: 'ਬਹੁਤ ਵਧੀਆ! ਤੁਸੀਂ ਜਾਂਚ ਲਈ ਤਿਆਰ ਹੋ।',
    good: 'ਚੰਗਾ ਪ੍ਰਦਰਸ਼ਨ। ਅਭਿਆਸ ਜਾਰੀ ਰੱਖੋ।',
    needsPractice: 'ਹੋਰ ਅਭਿਆਸ ਚਾਹੀਦਾ ਹੈ।',
    disclaimer: '⚠️ ਕੇਵਲ ਸਿਖਲਾਈ। DOT/FMCSA/CVSA ਨਾਲ ਕੋਈ ਸੰਬੰਧ ਨਹੀਂ।',
    aiScore: 'AI ਸਕੋਰ', perfectAns: 'ਸਹੀ ਜਵਾਬ',
    easy: 'ਆਸਾਨ', medium: 'ਦਰਮਿਆਨਾ', hard: 'ਔਖਾ',
    listening: 'ਰਿਕਾਰਡ ਹੋ ਰਿਹਾ ਹੈ…', processing: 'ਪ੍ਰੋਸੈਸਿੰਗ…', speaking: 'ਅਫਸਰ ਬੋਲ ਰਹੇ ਹਨ…',
    tap2speak: '🎤 ਰਿਕਾਰਡ ਕਰੋ', stopRec: '⏹ ਰੋਕੋ',
    replayQ: '🔊 ਦੁਬਾਰਾ', endEarly: 'ਸੈਸ਼ਨ ਖਤਮ',
    tryAgain: 'ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼', fullReport: '📊 ਪੂਰੀ ਰਿਪੋਰਟ',
    loadingVoice: 'ਆਵਾਜ਼ ਲੋਡ ਹੋ ਰਹੀ ਹੈ…',
    voiceError: 'ਆਵਾਜ਼ ਗਲਤੀ, ਸਿਸਟਮ ਵਰਤ ਰਹੇ ਹਾਂ',
    previewAll: '▶ ਸਾਰੇ ਸਵਾਲ ਸੁਣੋ', stopPlay: '⏸ ਰੋਕੋ',
    autoConv: '▶ ਆਪਣੇ ਆਪ ਦੋਹਰਾਓ', practicing: 'ਉਚਾਰਣ ਅਭਿਆਸ ਕਰੋ',
  },
  vi: {
    title: '🚗 Chế độ lái xe — Luyện tập khi lái',
    subtitle: 'Viên chức nói bằng giọng người thật. Trả lời bằng tiếng Anh qua giọng nói.',
    selectVoice: 'Chọn giọng viên chức',
    voicePreview: '▶ Xem trước',
    previewing: 'Đang phát…',
    selectScenario: 'Chọn kịch bản',
    start: '▶ Bắt đầu hội thoại',
    restart: '🔄 Bắt đầu lại',
    officerSays: 'Viên chức nói',
    yourTurn: 'Đến lượt bạn',
    sessionResult: 'Kết quả phiên',
    excellent: 'Xuất sắc! Bạn đã sẵn sàng.',
    good: 'Tốt. Tiếp tục luyện điểm yếu.',
    needsPractice: 'Cần luyện thêm mỗi ngày.',
    disclaimer: '⚠️ Chỉ để đào tạo. Không liên kết với DOT/FMCSA/CVSA.',
    aiScore: 'Điểm AI', perfectAns: 'Câu trả lời mẫu',
    easy: 'Dễ', medium: 'Trung bình', hard: 'Khó',
    listening: 'Đang ghi âm…', processing: 'Đang xử lý…', speaking: 'Viên chức đang nói…',
    tap2speak: '🎤 Ghi âm', stopRec: '⏹ Dừng',
    replayQ: '🔊 Phát lại', endEarly: 'Kết thúc sớm',
    tryAgain: 'Thử lại', fullReport: '📊 Xem báo cáo',
    loadingVoice: 'Đang tải giọng nói…',
    voiceError: 'Lỗi giọng nói, dùng hệ thống',
    previewAll: '▶ Nghe trước tất cả câu hỏi', stopPlay: '⏸ Dừng',
    autoConv: '▶ Tự động lặp lại', practicing: 'Luyện phát âm theo',
  },
}

function dt(lang, key) {
  const t = DT[lang] || DT.zh
  return t[key] !== undefined ? t[key] : (DT.zh[key] || key)
}

const DIFFICULTY_COLORS = { Easy: 'badge-green', Medium: 'badge-amber', Hard: 'badge-red' }

const PREVIEW_TEXT = 'Good afternoon, driver. May I see your CDL and logbook please?'

export default function DrivePage() {
  const [lang, setLang] = useState('zh')
  const [selectedVoice, setSelectedVoice] = useState(OFFICER_VOICES[0])
  const [phase, setPhase] = useState('select')
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx] = useState(0)
  const [convHistory, setConvHistory] = useState([])
  const [driverState, setDriverState] = useState('idle')
  const [sessionScores, setSessionScores] = useState([])
  const [previewing, setPreviewing] = useState(null)
  const [voiceError, setVoiceError] = useState(false)
  const mrRef = useRef(null)
  const audioRef = useRef(null)
  const questionsRef = useRef([])
  const autoPlayRef = useRef(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const autoConvRef = useRef(false)
  const [isAutoConv, setIsAutoConv] = useState(false)
  const [autoConvIdx, setAutoConvIdx] = useState(0)

  // Keep questionsRef in sync so askQuestion closure always has fresh list
  useEffect(() => { questionsRef.current = questions }, [questions])

  // ── Real human TTS via OpenAI API ─────────────────────────
  const speak = useCallback(async (text, onEnd) => {
    // Stop any playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setDriverState('speaking')
    setVoiceError(false)

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoice.id }),
      })

      if (!res.ok) throw new Error(`TTS API failed: ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        setDriverState('idle')
        onEnd?.()
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        audioRef.current = null
        setDriverState('idle')
        onEnd?.()
      }
      await audio.play()
    } catch (e) {
      console.error('TTS error, falling back to browser synthesis:', e)
      setVoiceError(true)
      // Fallback to browser synthesis if API fails
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'; u.rate = 0.93; u.pitch = selectedVoice.gender === 'female' ? 1.1 : 0.88
        u.onend = () => { setDriverState('idle'); onEnd?.() }
        u.onerror = () => { setDriverState('idle'); onEnd?.() }
        window.speechSynthesis.speak(u)
      } else {
        setDriverState('idle')
        onEnd?.()
      }
    }
  }, [selectedVoice])

  // ── Preview voice ────────────────────────────────────────
  async function previewVoice(voiceProfile) {
    if (previewing) return
    setPreviewing(voiceProfile.id)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: PREVIEW_TEXT, voiceId: voiceProfile.id }),
      })
      if (!res.ok) throw new Error(`preview failed: ${res.status}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; setPreviewing(null) }
      audio.onerror = () => { URL.revokeObjectURL(url); audioRef.current = null; setPreviewing(null) }
      await audio.play()
    } catch {
      setPreviewing(null)
      // Fallback preview
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(PREVIEW_TEXT)
        u.lang = 'en-US'
        u.pitch = voiceProfile.gender === 'female' ? 1.15 : 0.85
        u.rate = 0.93
        u.onend = () => setPreviewing(null)
        window.speechSynthesis.speak(u)
      }
    }
  }

  // ── Scenario preview (continuous play) ──────────────────
  function stopDrivePreview() {
    autoPlayRef.current = false
    setIsAutoPlaying(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setDriverState('idle')
  }

  function playPreviewList(list, idx) {
    if (!autoPlayRef.current || idx >= list.length) {
      autoPlayRef.current = false
      setIsAutoPlaying(false)
      return
    }
    speak(list[idx].officer_question_en, () => {
      setTimeout(() => playPreviewList(list, idx + 1), 4000)
    })
  }

  function startDrivePreview() {
    if (!selectedScenario) return
    const qs = []
    selectedScenario.categories.forEach(cat => {
      const catQs = QUESTIONS.filter(q => q.category === cat)
      const shuffled = [...catQs].sort(() => Math.random() - .5).slice(0, Math.ceil(8 / selectedScenario.categories.length))
      qs.push(...shuffled)
    })
    const list = qs.slice(0, 8)
    autoPlayRef.current = true
    setIsAutoPlaying(true)
    playPreviewList(list, 0)
  }

  // ── Auto-loop conversation (开始对话 hands-free) ──────────
  function stopAutoConv() {
    autoConvRef.current = false
    setIsAutoConv(false)
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setDriverState('idle')
  }

  function playAutoConvItem(idx) {
    if (!autoConvRef.current) return
    const list = questionsRef.current
    if (!list.length) { stopAutoConv(); return }
    const realIdx = idx % list.length
    setAutoConvIdx(realIdx)
    speak(list[realIdx].officer_question_en, () => {
      setTimeout(() => playAutoConvItem(realIdx + 1), 4000)
    })
  }

  function startAutoConv() {
    autoConvRef.current = true
    setIsAutoConv(true)
    playAutoConvItem(0)
  }

  // ── Scenario & conversation logic ────────────────────────
  function startScenario(scenario) {
    stopDrivePreview()
    const qs = []
    scenario.categories.forEach(cat => {
      const catQs = QUESTIONS.filter(q => q.category === cat)
      const shuffled = [...catQs].sort(() => Math.random() - .5).slice(0, Math.ceil(8 / scenario.categories.length))
      qs.push(...shuffled)
    })
    const final = qs.slice(0, 8)
    setSelectedScenario(scenario)
    setQuestions(final)
    questionsRef.current = final
    setQIdx(0)
    setConvHistory([])
    setSessionScores([])
    setPhase('conversation')
    setTimeout(() => askQuestion(0, final), 300)
  }

  function askQuestion(idx, qs) {
    const list = qs || questionsRef.current
    if (idx >= list.length) { setPhase('result'); return }
    const q = list[idx]
    setConvHistory(prev => [...prev, { role: 'officer', text: q.officer_question_en }])
    speak(q.officer_question_en, null)
  }

  async function startListening() {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      })
      const chunks = []
      mr.ondataavailable = e => e.data.size > 0 && chunks.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setDriverState('processing')
        const blob = new Blob(chunks, { type: mr.mimeType })
        const fd = new FormData()
        fd.append('audio', blob, 'drive.webm')
        let text = ''
        try {
          const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
          if (res.ok) { const d = await res.json(); text = d.text || '' }
        } catch {}
        if (text) await scoreAndAdvance(text)
        else setDriverState('idle')
      }
      mr.start()
      mrRef.current = mr
      setDriverState('listening')
    } catch (e) {
      console.error('Mic error:', e)
      setDriverState('idle')
    }
  }

  function stopListening() {
    if (mrRef.current && mrRef.current.state !== 'inactive') mrRef.current.stop()
  }

  async function scoreAndAdvance(text) {
    const qs = questionsRef.current
    const q = qs[qIdx]
    if (!q) return
    let scoreResult = { score: 0, feedback: null, wordScores: null }
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCode: q.question_code,
          officerQuestion: q.officer_question_en,
          correctAnswer: q.simple_driver_answer_en,
          keywords: q.required_keywords || [],
          userAnswer: text,
          userLanguage: lang,
        })
      })
      if (res.ok) scoreResult = await res.json()
    } catch {}

    setConvHistory(prev => [...prev, {
      role: 'driver', text,
      score: scoreResult.score,
      feedback: scoreResult.feedback,
      wordScores: scoreResult.wordScores,
      correctAnswer: q.simple_driver_answer_en,
    }])
    setSessionScores(prev => [...prev, scoreResult.score])
    setDriverState('idle')

    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionCode: q.question_code, status: 'viewed', lastScore: scoreResult.score, lastTranscript: text })
    }).catch(() => {})

    const nextIdx = qIdx + 1
    setQIdx(nextIdx)
    if (nextIdx < qs.length) {
      setTimeout(() => askQuestion(nextIdx, qs), 900)
    } else {
      setTimeout(() => setPhase('result'), 900)
    }
  }

  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length) : 0

  // ── PHASE: SELECT ─────────────────────────────────────────
  if (phase === 'select') return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="drive-header">
        <h1>{dt(lang, 'title')}</h1>
        <p>{dt(lang, 'subtitle')}</p>
      </div>

      {voiceError && (
        <div className="notice warn" style={{ marginBottom: 12 }}>
          <span className="ni">⚠️</span>
          <span>{dt(lang, 'voiceError')}</span>
        </div>
      )}

      {/* Voice selector */}
      <div className="card">
        <h2 className="card-title">🎙️ {dt(lang, 'selectVoice')}</h2>
        <p className="text-muted text-sm" style={{ marginBottom: 14 }}>
          Powered by OpenAI TTS — real human-quality voices
        </p>
        <div className="voice-grid">
          {OFFICER_VOICES.map(v => (
            <div
              key={v.id}
              className={`voice-card ${selectedVoice.id === v.id ? 'selected' : ''}`}
              onClick={() => setSelectedVoice(v)}
            >
              <div style={{ fontSize: '.82rem', fontWeight: 700 }}>{v.label}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 2 }}>{v.region} · {v.gender}</div>
              <button
                className={`btn btn-sm ${previewing === v.id ? 'btn-primary' : ''}`}
                style={{ marginTop: 8, fontSize: '.7rem', padding: '3px 10px' }}
                onClick={e => { e.stopPropagation(); previewVoice(v) }}
                disabled={!!previewing}
              >
                {previewing === v.id ? dt(lang, 'previewing') : dt(lang, 'voicePreview')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scenario selector */}
      <div className="card">
        <h2 className="card-title">🎭 {dt(lang, 'selectScenario')}</h2>
        <div className="scenario-grid">
          {SCENARIOS.map(s => (
            <div
              key={s.id}
              className={`scenario-card ${selectedScenario?.id === s.id ? 'selected' : ''}`}
              onClick={() => setSelectedScenario(s)}
            >
              <div className="scenario-icon">{s.icon}</div>
              <div className="scenario-name">{s.name}</div>
              <div className="scenario-desc">{s.description}</div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge ${DIFFICULTY_COLORS[s.difficulty] || 'badge-gray'}`}>
                  {dt(lang, s.difficulty?.toLowerCase()) || s.difficulty}
                </span>
              </div>
            </div>
          ))}
        </div>
        {selectedScenario && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button className="btn btn-drive btn-lg" onClick={() => startScenario(selectedScenario)}>
              {selectedScenario.icon} {dt(lang, 'start')}: {selectedScenario.name}
            </button>
            <div style={{ marginTop: 10 }}>
              {isAutoPlaying
                ? <button className="btn btn-sm btn-danger" onClick={stopDrivePreview}>{dt(lang, 'stopPlay')}</button>
                : <button className="btn btn-sm" onClick={startDrivePreview}>{dt(lang, 'previewAll')}</button>
              }
            </div>
          </div>
        )}
      </div>

      <p className="disclaimer">{dt(lang, 'disclaimer')}</p>
    </AppShell>
  )

  // ── PHASE: CONVERSATION ───────────────────────────────────
  if (phase === 'conversation') {
    const currentQ = questions[qIdx]
    return (
      <AppShell lang={lang} setLang={setLang}>
        <div className="drive-header" style={{ marginBottom: 12 }}>
          <div className="between">
            <div>
              <h1 style={{ fontSize: '.95rem' }}>{selectedScenario?.icon} {selectedScenario?.name}</h1>
              <p>Q {Math.min(qIdx + 1, questions.length)} / {questions.length} · {selectedVoice.label}</p>
            </div>
            <div className="bar" style={{ width: 160, marginBottom: 0 }}>
              <div className="bar-fill brand" style={{ width: Math.round(qIdx / questions.length * 100) + '%' }} />
            </div>
          </div>
        </div>

        {/* Conversation thread */}
        <div className="conv-thread">
          {convHistory.map((msg, i) => (
            <div key={i} className={`msg ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === 'officer' ? (selectedVoice.gender === 'female' ? '👮‍♀️' : '👮') : '🧑'}
              </div>
              <div>
                <div className="msg-bubble">{msg.text}</div>
                {msg.role === 'driver' && (
                  <div style={{ marginTop: 4 }}>
                    {msg.score != null && (
                      <span className={`msg-score-chip ${msg.score >= 80 ? 'badge-green' : msg.score >= 55 ? 'badge-amber' : 'badge-red'}`}>
                        {dt(lang, 'aiScore')}: {msg.score}/100
                      </span>
                    )}
                    {msg.wordScores?.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {msg.wordScores.map((w, wi) => (
                          <span key={wi} className={`pron-word ${w.score >= 80 ? 'good' : w.score >= 55 ? 'ok' : 'miss'}`}
                            style={{ fontSize: '.72rem', padding: '1px 5px' }}>{w.word}</span>
                        ))}
                      </div>
                    )}
                    {msg.feedback && <div style={{ fontSize: '.77rem', color: 'var(--muted)', marginTop: 3 }}>{msg.feedback}</div>}
                    {msg.correctAnswer && (
                      <div style={{ fontSize: '.77rem', color: 'var(--green)', marginTop: 2 }}>
                        💡 {dt(lang, 'perfectAns')}: {msg.correctAnswer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {driverState === 'processing' && (
            <div className="msg driver">
              <div className="msg-avatar">🧑</div>
              <div className="msg-bubble" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, display: 'inline-block' }} />
                &nbsp;{dt(lang, 'processing')}
              </div>
            </div>
          )}
        </div>

        {/* Auto-conv loop card */}
        {isAutoConv && (
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
              {autoConvIdx + 1} / {questions.length} · {dt(lang, 'practicing')}
            </div>
            {driverState === 'speaking' ? (
              <>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{selectedVoice.gender === 'female' ? '👮‍♀️' : '👮'}</div>
                <div style={{ fontWeight: 600, color: 'var(--brand)', marginBottom: 8 }}>{dt(lang, 'speaking')}</div>
                <div className="waveform" style={{ margin: '0 auto 12px', width: 'fit-content' }}>
                  {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ background: 'var(--brand)' }} />)}
                </div>
              </>
            ) : (
              <>
                <div className="q-officer" style={{ marginBottom: 12 }}>{questions[autoConvIdx]?.officer_question_en}</div>
                <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 12 }}>{dt(lang, 'practicing')}</div>
              </>
            )}
            <button className="btn btn-sm btn-danger" onClick={stopAutoConv}>{dt(lang, 'stopPlay')}</button>
          </div>
        )}

        {/* Controls */}
        {!isAutoConv && driverState === 'idle' && currentQ && qIdx < questions.length && (
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: 10 }}>{dt(lang, 'yourTurn')}</div>
            <div className="q-officer" style={{ marginBottom: 16 }}>{currentQ.officer_question_en}</div>
            <div className="flex-c" style={{ justifyContent: 'center' }}>
              <button className="btn btn-drive btn-lg" onClick={startListening}>
                {dt(lang, 'tap2speak')}
              </button>
              <button className="btn btn-sm" onClick={() => speak(currentQ.officer_question_en, null)}>
                {dt(lang, 'replayQ')}
              </button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn btn-sm btn-success" onClick={startAutoConv}>{dt(lang, 'autoConv')}</button>
            </div>
          </div>
        )}

        {!isAutoConv && driverState === 'speaking' && (
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>
              {selectedVoice.gender === 'female' ? '👮‍♀️' : '👮'}
            </div>
            <div style={{ fontWeight: 600, color: 'var(--brand)' }}>{dt(lang, 'speaking')}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 4 }}>{selectedVoice.label}</div>
            <div className="waveform" style={{ margin: '10px auto', width: 'fit-content' }}>
              {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ background: 'var(--brand)' }} />)}
            </div>
          </div>
        )}

        {driverState === 'listening' && (
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div className="rec-zone recording">
              <span className="rec-dot" />
              <span style={{ fontWeight: 600, color: 'var(--red)' }}>{dt(lang, 'listening')}</span>
              <div className="waveform" style={{ margin: '8px auto' }}>
                {[1, 2, 3, 4, 5].map(i => <span key={i} />)}
              </div>
              <button className="btn btn-danger btn-sm" style={{ marginTop: 8 }} onClick={stopListening}>
                {dt(lang, 'stopRec')}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button className="btn btn-sm text-muted" onClick={() => { stopAutoConv(); setPhase('result') }}>
            {dt(lang, 'endEarly')}
          </button>
        </div>
      </AppShell>
    )
  }

  // ── PHASE: RESULT ─────────────────────────────────────────
  if (phase === 'result') return (
    <AppShell lang={lang} setLang={setLang}>
      <div className="drive-header">
        <h1>🏆 {dt(lang, 'sessionResult')}</h1>
        <p>{selectedScenario?.icon} {selectedScenario?.name} · {sessionScores.length} questions</p>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
        <div className="score-ring" style={{
          width: 100, height: 100, margin: '0 auto 16px', borderWidth: 5,
          borderColor: avgScore >= 80 ? 'var(--green)' : avgScore >= 55 ? 'var(--amber)' : 'var(--red)'
        }}>
          <span className="score-num-big" style={{ fontSize: '2rem', color: avgScore >= 80 ? 'var(--green)' : avgScore >= 55 ? 'var(--amber)' : 'var(--red)' }}>
            {avgScore}
          </span>
          <span className="score-label-sm">/100</span>
        </div>
        <div className="bar" style={{ maxWidth: 300, margin: '0 auto 12px' }}>
          <div className="bar-fill" style={{ width: avgScore + '%', background: avgScore >= 80 ? 'var(--green)' : avgScore >= 55 ? 'var(--amber)' : 'var(--red)' }} />
        </div>
        <p style={{ fontWeight: 700, marginBottom: 20, fontSize: '.95rem' }}>
          {avgScore >= 80 ? dt(lang, 'excellent') : avgScore >= 55 ? dt(lang, 'good') : dt(lang, 'needsPractice')}
        </p>

        <div style={{ textAlign: 'left', maxWidth: 480, margin: '0 auto' }}>
          {sessionScores.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: '.8rem', color: 'var(--muted)', width: 24, flexShrink: 0 }}>Q{i + 1}</span>
              <div className="bar" style={{ flex: 1, marginBottom: 0 }}>
                <div className="bar-fill" style={{ width: s + '%', background: s >= 80 ? 'var(--green)' : s >= 55 ? 'var(--amber)' : 'var(--red)' }} />
              </div>
              <span style={{ fontSize: '.8rem', fontWeight: 700, width: 40, textAlign: 'right', color: s >= 80 ? 'var(--green)' : s >= 55 ? 'var(--amber)' : 'var(--red)' }}>
                {s}/100
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="actions" style={{ justifyContent: 'center', marginTop: 16 }}>
        <button className="btn btn-drive" onClick={() => { setPhase('select'); setSelectedScenario(null) }}>
          {dt(lang, 'restart')}
        </button>
        <button className="btn btn-primary" onClick={() => {
          const qs = [...questions].sort(() => Math.random() - .5)
          setQuestions(qs); questionsRef.current = qs
          setQIdx(0); setConvHistory([]); setSessionScores([])
          setPhase('conversation')
          setTimeout(() => askQuestion(0, qs), 300)
        }}>
          {dt(lang, 'tryAgain')}
        </button>
        <a href="/report" className="btn">{dt(lang, 'fullReport')}</a>
      </div>
      <p className="disclaimer" style={{ marginTop: 20 }}>{dt(lang, 'disclaimer')}</p>
    </AppShell>
  )

  return null
}
