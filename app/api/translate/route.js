import { auth } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rate-limit'

const LANG_NAMES = {
  zh: 'Chinese (Simplified)',
  es: 'Spanish',
  hi: 'Hindi',
  pa: 'Punjabi (Gurmukhi script)',
  vi: 'Vietnamese',
}

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })
  if (checkRateLimit(userId, 'translate', 60)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const { strings, targetLang } = await req.json()
  if (!Array.isArray(strings) || strings.length === 0) {
    return Response.json({ error: 'Bad input' }, { status: 400 })
  }
  const langName = LANG_NAMES[targetLang]
  if (!langName) return Response.json({ error: 'Unsupported language' }, { status: 400 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        temperature: 0.2,
        messages: [{
          role: 'system',
          content: `Translate each English string into ${langName}. Keep CDL trucking acronyms (CDL, DOT, FMCSA, CVSA, ELD, HOS, BOL, MC, USDOT, PC, IFTA, IRP) and proper nouns in English. Keep the translation natural, conversational, and appropriate for a roadside inspection context. Reply ONLY with valid JSON in this exact shape: {"translations": ["...", "..."]} — one entry per input string, in order.`,
        }, {
          role: 'user',
          content: JSON.stringify(strings),
        }],
      }),
    })
    if (!res.ok) return Response.json({ error: 'Upstream failed' }, { status: 502 })
    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content || ''
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed?.translations) || parsed.translations.length !== strings.length) {
      return Response.json({ error: 'Bad model output' }, { status: 502 })
    }
    return Response.json({ translations: parsed.translations })
  } catch (e) {
    console.error('Translate error:', e)
    return Response.json({ error: 'Translate failed' }, { status: 500 })
  }
}
