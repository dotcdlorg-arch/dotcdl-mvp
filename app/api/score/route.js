import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { scoreKeywords } from '@/lib/data'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthenticated' }, { status: 401 })

  if (checkRateLimit(userId, 'score', 30)) {
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await req.json()
  const { questionCode, officerQuestion, correctAnswer, keywords, userAnswer, userLanguage } = body

  if (!userAnswer?.trim()) return Response.json({ score: 0, feedback: null, wordScores: null })

  // Fast keyword score (always runs, no API cost)
  const kwScore = scoreKeywords(userAnswer, keywords || [])
  let finalScore = kwScore
  let feedback = null
  let wordScores = null

  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    const langNames = { zh:'Chinese', es:'Spanish', hi:'Hindi', pa:'Punjabi', vi:'Vietnamese' }
    const feedbackLang = langNames[userLanguage] || 'Chinese'

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 300,
          temperature: 0.3,
          messages: [{
            role: 'system',
            content: `You are scoring a CDL truck driver's English answer during a simulated DOT roadside inspection.

Score the driver's spoken answer on two dimensions:
1. semantic_score (0-40): How well does it answer the officer's question? Is meaning correct and complete?
2. pronunciation_words: For each word in the driver's answer, estimate pronunciation quality as a score 0-100.

Provide feedback in ${feedbackLang}.

Reply ONLY with valid JSON, no markdown:
{
  "semantic_score": NUMBER,
  "feedback": "brief feedback in ${feedbackLang}",
  "word_scores": [{"word": "WORD", "score": NUMBER}, ...]
}`
          }, {
            role: 'user',
            content: `Officer asked: "${officerQuestion}"\nCorrect answer: "${correctAnswer}"\nDriver said: "${userAnswer}"\n\nScore it.`
          }]
        })
      })

      if (res.ok) {
        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content || ''
        const cleaned = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        finalScore = Math.min(100, kwScore + (parsed.semantic_score || 0))
        feedback = parsed.feedback || null
        wordScores = parsed.word_scores || null
      }
    } catch (e) {
      // Fall back to keyword score
      console.error('GPT score error:', e)
    }
  }

  // Save to Supabase
  try {
    const db = createServerClient()
    await db.from('question_progress').upsert({
      user_id: userId,
      question_code: questionCode,
      last_score: finalScore,
      last_transcript: userAnswer,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,question_code' })
  } catch (e) {}

  return Response.json({ score: finalScore, feedback, wordScores })
}
