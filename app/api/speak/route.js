import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rate-limit'

// Map voice profile IDs to OpenAI TTS voices
// OpenAI voices: alloy (neutral), echo (warm male), fable (expressive male),
//                onyx (deep male), nova (warm female), shimmer (clear female)
const VOICE_MAP = {
  north_m: 'onyx',    // Deep authoritative Northern male
  south_m: 'echo',    // Warm Southern male
  east_m:  'fable',   // Clear Eastern male
  west_m:  'alloy',   // Neutral Western male
  north_f: 'shimmer', // Clear Northern female
  south_f: 'nova',    // Warm Southern female
  east_f:  'shimmer', // Clear Eastern female
  west_f:  'nova',    // Warm Western female
}

// Slightly different speeds per region for realism
const SPEED_MAP = {
  north_m: 0.95, south_m: 0.88, east_m: 0.97, west_m: 1.00,
  north_f: 0.95, south_f: 0.88, east_f: 0.97, west_f: 1.00,
}

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  if (checkRateLimit(userId, 'speak', 20)) {
    return new Response('Rate limit exceeded', { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return new Response('OpenAI not configured', { status: 500 })

  let body
  try { body = await req.json() } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { text, voiceId } = body
  if (!text?.trim()) return new Response('No text provided', { status: 400 })

  const voice = VOICE_MAP[voiceId] || 'onyx'
  const speed = SPEED_MAP[voiceId] || 0.95

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',      // tts-1 for speed, tts-1-hd for higher quality
        voice,
        input: text.slice(0, 4096), // OpenAI limit
        speed,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('OpenAI TTS error:', err)
      return new Response('TTS failed', { status: 502 })
    }

    const audioBuffer = await res.arrayBuffer()

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
  } catch (e) {
    console.error('Speak route error:', e)
    return new Response('Internal error', { status: 500 })
  }
}
