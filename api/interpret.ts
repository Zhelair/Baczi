import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Chinese char → English pinyin mapping for RAG tag lookup ─────────────────
const CHAR_TO_PINYIN: Record<string, string> = {
  // Heavenly Stems
  '甲': 'Jia', '乙': 'Yi', '丙': 'Bing', '丁': 'Ding', '戊': 'Wu',
  '己': 'Ji', '庚': 'Geng', '辛': 'Xin', '壬': 'Ren', '癸': 'Gui',
  // Earthly Branches
  '子': 'Zi', '丑': 'Chou', '寅': 'Yin', '卯': 'Mao', '辰': 'Chen',
  '巳': 'Si', '午': 'Wu', '未': 'Wei', '申': 'Shen', '酉': 'You',
  '戌': 'Xu', '亥': 'Hai',
}

function extractPinyinTags(chart: Record<string, unknown>): string[] {
  const tags = new Set<string>()
  const pillars = ['year', 'month', 'day', 'hour']
  for (const pillar of pillars) {
    const p = chart[pillar] as Record<string, string> | null | undefined
    if (!p) continue
    if (p.gan && CHAR_TO_PINYIN[p.gan]) tags.add(CHAR_TO_PINYIN[p.gan])
    if (p.zhi && CHAR_TO_PINYIN[p.zhi]) tags.add(CHAR_TO_PINYIN[p.zhi])
  }
  const dm = chart.dayMaster as Record<string, string> | undefined
  if (dm?.gan && CHAR_TO_PINYIN[dm.gan]) tags.add(CHAR_TO_PINYIN[dm.gan])
  return [...tags]
}

async function fetchRelevantKnowledge(chart: Record<string, unknown>): Promise<string> {
  const tags = extractPinyinTags(chart)
  if (tags.length === 0) return ''

  const { data, error } = await supabase
    .from('bazi_knowledge')
    .select('pattern, rule_text, school, confidence')
    .overlaps('tags', tags)
    .in('confidence', ['high', 'medium'])
    .order('confidence', { ascending: true }) // high first (alphabetically h < m)
    .limit(6)

  if (error || !data || data.length === 0) return ''

  const lines = data.map(r =>
    `• [${r.school}] ${r.pattern}: ${r.rule_text}`
  )
  return `Classical BaZi knowledge relevant to this chart:\n${lines.join('\n')}`
}

type Tier = 'free' | 'pro' | 'max'
type ActionType = 'daily_reading' | 'luck_check' | 'lucky_dates'

const TOKEN_COSTS: Record<ActionType, number> = {
  daily_reading: 50,
  luck_check: 20,
  lucky_dates: 30,
}

const MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500,
  pro: 2000,
  max: 10000,
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

  let balance = data && data.reset_date > today ? data.balance : MONTHLY_TOKENS[tier]

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

async function callDeepSeek(prompt: string, systemPrompt?: string): Promise<string> {
  const messages: Array<{ role: string; content: string }> = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`)
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

  const cost = TOKEN_COSTS[action as ActionType] ?? 50
  const { ok, balance } = await deductTokens(payload.hash, payload.tier, cost)

  if (!ok) {
    return res.status(429).json({
      error: 'Insufficient tokens',
      balance,
      message: 'Monthly token limit reached. Resets on the 1st of next month.',
    })
  }

  try {
    let prompt: string
    if (action === 'luck_check') {
      prompt = buildLuckCheckPrompt(chart, today, language)
    } else {
      prompt = buildDailyReadingPrompt(chart, today, language)
    }

    // RAG: inject relevant classical knowledge into system prompt
    const knowledge = await fetchRelevantKnowledge(chart as Record<string, unknown>)
    const systemPrompt = knowledge
      ? `You are a BaZi (Four Pillars of Destiny) master with deep knowledge of classical Chinese metaphysics. Use the following classical rules when relevant to improve accuracy:\n\n${knowledge}`
      : undefined

    const result = await callDeepSeek(prompt, systemPrompt)
    const parsed = JSON.parse(result)

    return res.status(200).json({ data: parsed, tokensRemaining: balance })
  } catch (err) {
    console.error('DeepSeek error:', err)
    return res.status(500).json({ error: 'Interpretation failed, please try again' })
  }
}
