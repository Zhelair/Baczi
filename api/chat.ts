/**
 * POST /api/chat
 * Body: { messages: [{role, content}], chart, language }
 * Auth: Bearer JWT (any tier)
 * Cost: 15 tokens per message
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tier = 'free' | 'pro' | 'max' | 'admin'

const CHAT_COST = 15

const MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500, pro: 2000, max: 10000, admin: 999999,
}

const CHAR_TO_PINYIN: Record<string, string> = {
  '甲':'Jia','乙':'Yi','丙':'Bing','丁':'Ding','戊':'Wu',
  '己':'Ji','庚':'Geng','辛':'Xin','壬':'Ren','癸':'Gui',
  '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen',
  '巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai',
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

async function fetchKnowledge(chart: Record<string, unknown>): Promise<string> {
  const tags = new Set<string>()
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = chart[key] as Record<string, string> | null | undefined
    if (!p) continue
    if (p.gan && CHAR_TO_PINYIN[p.gan]) tags.add(CHAR_TO_PINYIN[p.gan])
    if (p.zhi && CHAR_TO_PINYIN[p.zhi]) tags.add(CHAR_TO_PINYIN[p.zhi])
  }
  if (!tags.size) return ''

  const tagArr = [...tags]

  // Prefer joey_yap (fourpillars.ru) school first, top 4 rules
  const { data: primary } = await supabase
    .from('bazi_knowledge')
    .select('rule_text')
    .overlaps('tags', tagArr)
    .eq('school', 'joey_yap')
    .in('confidence', ['high', 'medium'])
    .limit(4)

  // Fill remaining slots from any school (excluding already found patterns)
  const needed = 6 - (primary?.length ?? 0)
  let extra: { rule_text: string }[] = []
  if (needed > 0) {
    const { data } = await supabase
      .from('bazi_knowledge')
      .select('rule_text')
      .overlaps('tags', tagArr)
      .neq('school', 'joey_yap')
      .in('confidence', ['high', 'medium'])
      .limit(needed)
    extra = data ?? []
  }

  const all = [...(primary ?? []), ...extra]
  if (!all.length) return ''
  return 'Relevant BaZi rules (Joey Yap school):\n' + all.map(r => `• ${r.rule_text}`).join('\n')
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

  // Build system prompt with RAG
  const knowledge = await fetchKnowledge(chart as Record<string, unknown>)
  const lang = language === 'bg' ? 'Bulgarian' : language === 'ru' ? 'Russian' : 'English'

  const systemPrompt = [
    `You are a wise BaZi (Four Pillars of Destiny) master. Answer the user's questions about their personal BaZi chart.`,
    `Always respond in ${lang}.`,
    `The user's chart: ${JSON.stringify(chart)}`,
    knowledge,
    'Be warm, insightful, and specific to this person\'s chart. Keep answers concise (3-5 sentences) unless asked for detail.',
  ].filter(Boolean).join('\n\n')

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10), // keep last 10 messages for context
        ],
        temperature: 0.8,
        max_tokens: 600,
      }),
    })

    if (!response.ok) throw new Error(`DeepSeek ${response.status}`)
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const reply = data.choices[0].message.content

    return res.status(200).json({ reply, tokensRemaining: balance })
  } catch (err) {
    console.error('Chat error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
