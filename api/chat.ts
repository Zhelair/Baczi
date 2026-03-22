/**
 * POST /api/chat
 * Body: { messages: [{role, content}], chart, language }
 * Auth: Bearer JWT (any tier)
 * Cost: 15 tokens per message
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { fetchRelevantKnowledge, chartSummary } from './_rag'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tier = 'free' | 'pro' | 'max' | 'admin'

const CHAT_COST = 15

const MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500, pro: 2000, max: 10000, admin: 999999,
}

function nextMonthReset() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
    .toISOString().split('T')[0]
}

async function deductTokens(hash: string, tier: Tier): Promise<{ ok: boolean; balance: number }> {
  if (tier === 'admin') return { ok: true, balance: MONTHLY_TOKENS.admin }
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('token_balances').select('balance, reset_date')
    .eq('passphrase_hash', hash).single()

  let balance = data && data.reset_date > today ? data.balance : MONTHLY_TOKENS[tier]
  if (balance < CHAT_COST) return { ok: false, balance }

  balance -= CHAT_COST
  await supabase.from('token_balances').upsert({
    passphrase_hash: hash, tier, balance,
    reset_date: data && data.reset_date > today ? data.reset_date : nextMonthReset(),
    updated_at: new Date().toISOString(),
  })
  return { ok: true, balance }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })

  let payload: { tier: Tier; hash: string }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload: p } = await jwtVerify(auth.slice(7), secret)
    payload = p as { tier: Tier; hash: string }
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  const { messages, chart, language } = req.body ?? {}
  if (!messages?.length || !chart) return res.status(400).json({ error: 'Missing fields' })

  // Deduct tokens
  const { ok, balance } = await deductTokens(payload.hash, payload.tier)
  if (!ok) return res.status(429).json({ error: 'Insufficient tokens', balance })

  // Build semantic query: last user message + chart context
  const lastUserMsg: string = [...messages].reverse().find(
    (m: { role: string; content: string }) => m.role === 'user'
  )?.content ?? ''
  const chartCtx = chartSummary(chart as Record<string, unknown>)
  const semanticQuery = `${lastUserMsg}\n\nChart context: ${chartCtx}`

  // Fetch semantically relevant knowledge (25 rules, vector search → tag fallback)
  // Capped at 5 seconds so a slow Supabase query never causes a Vercel timeout
  const knowledge = await Promise.race([
    fetchRelevantKnowledge(
      semanticQuery,
      chart as Record<string, unknown>,
      supabase,
      8,
    ),
    new Promise<string>(resolve => setTimeout(() => resolve(''), 5000)),
  ]).catch(err => { console.error('RAG failed, continuing without knowledge:', err); return '' })

  const lang = language === 'bg' ? 'Bulgarian' : language === 'ru' ? 'Russian' : 'English'

  const systemPrompt = [
    `You are a wise BaZi (Four Pillars of Destiny) master. Answer the user's questions about their personal BaZi chart.`,
    `Always respond in ${lang}.`,
    `The user's chart: ${JSON.stringify(chart)}`,
    knowledge,
    "Be warm, insightful, and specific to this person's chart. Keep answers concise (3-5 sentences) unless asked for detail.",
  ].filter(Boolean).join('\n\n')

  try {
    const useGroq = !!process.env.GROQ_API_KEY
    const apiUrl = useGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.deepseek.com/chat/completions'
    const apiKey = useGroq ? process.env.GROQ_API_KEY : process.env.DEEPSEEK_API_KEY
    const model = useGroq ? 'llama-3.1-70b-versatile' : 'deepseek-chat'

    const ac = new AbortController()
    const timeoutId = setTimeout(() => ac.abort(), 50_000)

    const response = await fetch(apiUrl, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10),
        ],
        temperature: 0.8,
        max_tokens: 400,
      }),
    })
    clearTimeout(timeoutId)

    if (!response.ok) throw new Error(`AI API ${response.status}`)
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const reply = data.choices[0].message.content

    return res.status(200).json({ reply, tokensRemaining: balance })
  } catch (err) {
    console.error('Chat error:', err)
    const msg = err instanceof Error && err.name === 'AbortError'
      ? 'AI request timed out – please try again'
      : 'AI request failed'
    return res.status(500).json({ error: msg })
  }
}
