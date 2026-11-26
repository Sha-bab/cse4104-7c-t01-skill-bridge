import { env } from '../config/env'
import { AppError } from '../utils/AppError'

const LOCAL_EMBEDDING_DIMS = 64

/**
 * Deterministic lightweight trigram embedding fallback used when GEMINI_API_KEY
 * is not configured in development/testing.
 */
const buildLocalFallbackEmbedding = (text: string): number[] => {
  const vec = new Array<number>(LOCAL_EMBEDDING_DIMS).fill(0)
  const clean = text.toLowerCase().replace(/\s+/g, ' ').trim()
  for (let i = 0; i < clean.length - 2; i += 1) {
    const code =
      (clean.charCodeAt(i) * 31 +
        clean.charCodeAt(i + 1) * 17 +
        clean.charCodeAt(i + 2)) %
      LOCAL_EMBEDDING_DIMS
    vec[code] += 1
  }
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1
  return vec.map((v) => v / norm)
}

export const createEmbedding = async (text: string): Promise<number[]> => {
  if (!env.GEMINI_API_KEY) {
    if (env.NODE_ENV === 'production') {
      throw new AppError('AI embedding service is not configured', 500)
    }
    return buildLocalFallbackEmbedding(text)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('❌ Gemini embedding error:', response.status, body)
    throw new AppError('Failed to generate text embedding', 502)
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] }
  }
  if (!data.embedding?.values) {
    throw new AppError('Invalid embedding response from AI service', 502)
  }

  return data.embedding.values
}

export const generateAiText = async (
  systemInstruction: string,
  userPrompt: string,
): Promise<string> => {
  if (!env.GEMINI_API_KEY) {
    if (env.NODE_ENV === 'production') {
      throw new AppError('AI generation service is not configured', 500)
    }
    return [
      '[DEV AI FALLBACK — set GEMINI_API_KEY in server/.env for live Gemini responses]',
      `Task Instruction: ${systemInstruction}`,
      '',
      userPrompt.slice(0, 1500),
    ].join('\n')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_CHAT_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('❌ Gemini generation error:', response.status, body)
    throw new AppError('AI service failed to generate a response', 502)
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new AppError('AI service returned an empty response', 502)
  }

  return text
}
