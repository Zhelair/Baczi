import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { fetchRelevantKnowledge, chartSummary } from './_rag'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tier = 'free' | 'pro' | 'max' | 'admin'
type ActionType = 'daily_reading' | 'luck_check' | 'lucky_dates'

// Default costs/limits — overridden by app_config when admin tunes them
const DEFAULT_TOKEN_COSTS: Record<ActionType, number> = {
  daily_reading: 50,
  luck_check: 20,
  lucky_dates: 30,
}

const DEFAULT_MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500,
  pro: 2000,
  max: 10000,
  admin: 999999,
}

interface AiConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPromptExtra: string
}

interface BaziConfig {
  tokenCosts: Record<ActionType, number>
  monthlyTokens: Record<Tier, number>
  knowledgeLimit: number
  confidenceLevels: string[]
}

// Cache config for 60 s to avoid Supabase overhead on every request
let configCache: { ai: AiConfig; bazi: BaziConfig; ts: number } | null = null

async function getConfig(): Promise<{ ai: AiConfig; bazi: BaziConfig }> {
  if (configCache && Date.now() - configCache.ts < 60_000) {
    return { ai: configCache.ai, bazi: configCache.bazi }
  }
  try {
    const { data } = await supabase.from('app_config').select('key, value')
    const map: Record<string, unknown> = {}
    for (const row of data ?? []) map[row.key] = row.value
    const ai: AiConfig = {
      model:             (map.ai as AiConfig | undefined)?.model             ?? 'deepseek-chat',
      temperature:       (map.ai as AiConfig | undefined)?.temperature       ?? 0.7,
      maxTokens:         (map.ai as AiConfig | undefined)?.maxTokens         ?? 1500,
      systemPromptExtra: (map.ai as AiConfig | undefined)?.systemPromptExtra ?? '',
    }
    const bazi: BaziConfig = {
      tokenCosts:       (map.bazi as BaziConfig | undefined)?.tokenCosts       ?? DEFAULT_TOKEN_COSTS,
      monthlyTokens:    (map.bazi as BaziConfig | undefined)?.monthlyTokens    ?? DEFAULT_MONTHLY_TOKENS,
      knowledgeLimit:   (map.bazi as BaziConfig | undefined)?.knowledgeLimit   ?? 6,
      confidenceLevels: (map.bazi as BaziConfig | undefined)?.confidenceLevels ?? ['high', 'medium'],
    }
    configCache = { ai, bazi, ts: Date.now() }
    return { ai, bazi }
  } catch {
    return {
      ai:   { model: 'deepseek-chat', temperature: 0.7, maxTokens: 1500, systemPromptExtra: '' },
      bazi: { tokenCosts: DEFAULT_TOKEN_COSTS, monthlyTokens: DEFAULT_MONTHLY_TOKENS, knowledgeLimit: 6, confidenceLevels: ['high', 'medium'] },
    }
  }
}

function nextMonthReset(): string {
  const now = new Date()
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return reset.toISOString().split('T')[0]
}

async function deductTokens(hash: string, tier: Tier, cost: number): Promise<{ ok: boolean; balance: number }> {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('token_balances')
    .select('balance, reset_date')
    .eq('passphrase_hash', hash)
    .single()

  const { bazi: baziCfg } = await getConfig()
  const monthlyTokens = baziCfg.monthlyTokens
  let balance = data && data.reset_date > today ? data.balance : (monthlyTokens[tier] ?? DEFAULT_MONTHLY_TOKENS[tier])

  if (balance < cost) {
    return { ok: false, balance }
  }

  balance -= cost
  await supabase
    .from('token_balances')
    .upsert({
      passphrase_hash: hash,
      tier,
      balance,
      reset_date: data && data.reset_date > today ? data.reset_date : nextMonthReset(),
      updated_at: new Date().toISOString(),
    })

  return { ok: true, balance }
}

async function callDeepSeek(prompt: string, systemPrompt?: string, aiCfg?: AiConfig): Promise<string> {
  const cfg = aiCfg ?? { model: 'deepseek-chat', temperature: 0.7, maxTokens: 800, systemPromptExtra: '' }
  const messages: Array<{ role: string; content: string }> = []

  const fullSystem = [systemPrompt, cfg.systemPromptExtra].filter(Boolean).join('\n\n')
  if (fullSystem) messages.push({ role: 'system', content: fullSystem })
  messages.push({ role: 'user', content: prompt })

  const useGroq = !!process.env.GROQ_API_KEY
  const apiUrl = useGroq
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.deepseek.com/chat/completions'
  const apiKey = useGroq ? process.env.GROQ_API_KEY : process.env.DEEPSEEK_API_KEY
  const model = useGroq ? 'llama-3.1-70b-versatile' : cfg.model

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
      messages,
      response_format: { type: 'json_object' },
      temperature: cfg.temperature,
      max_tokens: Math.min(cfg.maxTokens, 800),
    }),
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> }
  return data.choices[0].message.content
}

function buildDailyReadingPrompt(chart: unknown, today: unknown, language: string): string {
  return `You are a BaZi (Four Pillars of Destiny) master providing a personalized daily reading.

Person's BaZi chart: ${JSON.stringify(chart)}
Today's universal pillars: ${JSON.stringify(today)}

Provide a reading in language "${language}" (bg=Bulgarian, ru=Russian, en=English).

Respond ONLY with valid JSON in this exact format:
{
  "interpretation": "2-3 sentence overview of today's energy for this person",
  "lifeAreas": [
    {"key": "finance", "score": 4, "tip": "one sentence tip"},
    {"key": "work", "score": 3, "tip": "one sentence tip"},
    {"key": "love", "score": 5, "tip": "one sentence tip"},
    {"key": "health", "score": 3, "tip": "one sentence tip"},
    {"key": "travel", "score": 4, "tip": "one sentence tip"},
    {"key": "creativity", "score": 2, "tip": "one sentence tip"},
    {"key": "home", "score": 3, "tip": "one sentence tip"},
    {"key": "legal", "score": 2, "tip": "one sentence tip"}
  ],
  "luckyHours": ["HH:MM-HH:MM", "HH:MM-HH:MM"]
}

Score 1=bad, 2=avoid, 3=neutral, 4=good, 5=excellent.
All text must be in the requested language.`
}

function buildLuckCheckPrompt(chart: unknown, today: unknown, language: string): string {
  return `You are a BaZi master. Give a brief daily luck summary.

Chart: ${JSON.stringify(chart)}
Today: ${JSON.stringify(today)}
Language: ${language} (bg=Bulgarian, ru=Russian, en=English)

Respond ONLY with valid JSON:
{
  "summary": "one paragraph summary of today's luck",
  "topTip": "the single most important advice for today",
  "luckyHours": ["HH:MM-HH:MM", "HH:MM-HH:MM"]
}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify JWT
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }

  const token = authHeader.slice(7)
  let payload: { tier: Tier; hash: string }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload: p } = await jwtVerify(token, secret)
    payload = p as { tier: Tier; hash: string }
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }

  const { action, chart, today, language } = req.body ?? {}

  if (!action || !chart || !today || !language) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { ai: aiCfg, bazi: baziCfg } = await getConfig()
  const cost = (baziCfg.tokenCosts[action as ActionType] ?? DEFAULT_TOKEN_COSTS[action as ActionType]) ?? 50

  // Admin tier: skip token deduction entirely
  let finalBalance: number
  if (payload.tier === 'admin') {
    finalBalance = DEFAULT_MONTHLY_TOKENS.admin
  } else {
    const { ok, balance } = await deductTokens(payload.hash, payload.tier, cost)
    if (!ok) {
      return res.status(429).json({
        error: 'Insufficient tokens',
        balance,
        message: 'Monthly token limit reached. Resets on the 1st of next month.',
      })
    }
    finalBalance = balance
  }

  try {
    let prompt: string
    if (action === 'luck_check') {
      prompt = buildLuckCheckPrompt(chart, today, language)
    } else {
      prompt = buildDailyReadingPrompt(chart, today, language)
    }

    // RAG: semantic vector search for relevant classical rules
    // Capped at 5 seconds so slow Supabase queries never eat into DeepSeek's time budget
    const { bazi: baziCfg2 } = await getConfig()
    const actionDesc = action === 'luck_check'
      ? 'daily luck check, brief summary'
      : 'full daily reading with life area scores'
    const semanticQuery = `${actionDesc}\n\nChart: ${chartSummary(chart as Record<string, unknown>)}`
    const knowledge = await Promise.race([
      fetchRelevantKnowledge(
        semanticQuery,
        chart as Record<string, unknown>,
        supabase,
        baziCfg2.knowledgeLimit ?? 25,
        baziCfg2.confidenceLevels ?? ['high', 'medium'],
      ),
      new Promise<string>(resolve => setTimeout(() => resolve(''), 5000)),
    ]).catch(() => '')
    const baseSystem = knowledge
      ? `You are a BaZi (Four Pillars of Destiny) master with deep knowledge of classical Chinese metaphysics. Use the following classical rules when relevant to improve accuracy:\n\n${knowledge}`
      : undefined

    const result = await callDeepSeek(prompt, baseSystem, aiCfg)
    const parsed = JSON.parse(result)

    return res.status(200).json({ data: parsed, tokensRemaining: finalBalance })
  } catch (err) {
    console.error('DeepSeek error:', err)
    return res.status(500).json({ error: 'Interpretation failed, please try again' })
  }
}
