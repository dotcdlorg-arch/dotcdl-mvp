import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  if (checkRateLimit(userId, 'transcribe', 10)) {
    return Response.json({ text: '', error: 'Rate limit exceeded' }, { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ text: '', error: 'OpenAI not configured' })

  try {
    const formData = await req.formData()
    const audio = formData.get('audio')
    if (!audio) return Response.json({ text: '', error: 'No audio' })

    const fd = new FormData()
    fd.append('file', audio, 'recording.webm')
    fd.append('model', 'whisper-1')
    fd.append('language', 'en')
    fd.append('response_format', 'json')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Whisper error:', err)
      return Response.json({ text: '', error: 'Transcription failed' })
    }

    const data = await res.json()
    return Response.json({ text: data.text || '' })
  } catch (e) {
    console.error('Transcribe error:', e)
    return Response.json({ text: '', error: e.message })
  }
}
