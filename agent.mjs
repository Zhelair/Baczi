/**
 * BaZi Local Agent  — private CLI
 *
 * Usage:
 *   node agent.mjs
 *
 * Requires .env.local with:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY (or DEEPSEEK_API_KEY)
 *
 * The agent reads your BaZi chart, queries Supabase for relevant classical
 * rules (same RAG pipeline as the web app), then lets you have a conversation
 * with the AI about your chart.
 */

import { readFileSync } from 'fs'
import { createInterface } from 'readline'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Load .env.local ───────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const file = readFileSync(join(__dirname, '.env.local'), 'utf8')
    for (const line of file.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      process.env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim()
    }
  } catch {
    console.error('❌  .env.local not found — copy .env.example and fill it in.')
    process.exit(1)
  }
}

// ── Supabase REST ─────────────────────────────────────────────────────────────
async function sbGet(path) {
  const url = `${process.env.SUPABASE_URL}/rest/v1${path}`
  const r = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
    },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}`)
  return r.json()
}

// ── RAG: fetch relevant classical rules ───────────────────────────────────────
const CHAR_TO_PINYIN = {
  '甲':'Jia','乙':'Yi','丙':'Bing','丁':'Ding','戊':'Wu',
  '己':'Ji','庚':'Geng','辛':'Xin','壬':'Ren','癸':'Gui',
  '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen',
  '巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai',
}

async function fetchKnowledge(chart) {
  const tags = new Set()
  for (const key of ['year','month','day','hour']) {
    const p = chart[key]
    if (!p) continue
    if (CHAR_TO_PINYIN[p.gan]) tags.add(CHAR_TO_PINYIN[p.gan])
    if (CHAR_TO_PINYIN[p.zhi]) tags.add(CHAR_TO_PINYIN[p.zhi])
  }
  if (!tags.size) return ''

  const tagParam = '{' + [...tags].join(',') + '}'
  try {
    const rows = await sbGet(
      `/bazi_rules?select=rule_text,source&tags=ov.${encodeURIComponent(tagParam)}&confidence=in.(high,medium)&limit=8`
    )
    if (!rows?.length) return ''
    return 'Classical BaZi rules relevant to this chart:\n' +
      rows.map(r => `• ${r.rule_text}`).join('\n')
  } catch {
    return ''
  }
}

// ── AI call ───────────────────────────────────────────────────────────────────
async function callAI(messages) {
  // Try Anthropic first, fallback to DeepSeek
  if (process.env.ANTHROPIC_API_KEY) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: messages[0]?.role === 'system' ? messages[0].content : undefined,
        messages: messages.filter(m => m.role !== 'system'),
      }),
    })
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${await r.text()}`)
    const d = await r.json()
    return d.content[0].text
  }

  if (process.env.DEEPSEEK_API_KEY) {
    const r = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 1024 }),
    })
    if (!r.ok) throw new Error(`DeepSeek ${r.status}`)
    const d = await r.json()
    return d.choices[0].message.content
  }

  throw new Error('No AI key found. Add ANTHROPIC_API_KEY or DEEPSEEK_API_KEY to .env.local')
}

// ── Simple chart builder (no lunar-js dep in CLI) ─────────────────────────────
function buildSimpleChart(year, month, day, hour) {
  // Heavenly Stems cycle (year pillar base 1924 = 甲子)
  const STEMS  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const BRANCH = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
  const stem  = s => STEMS[((s % 10) + 10) % 10]
  const branch = b => BRANCH[((b % 12) + 12) % 12]

  const yOff = year - 1924
  const yG = stem(yOff), yZ = branch(yOff)

  return {
    year:  { gan: yG, zhi: yZ },
    month: { gan: '—', zhi: '—' }, // simplified
    day:   { gan: '—', zhi: '—' },
    hour:  hour != null ? { gan: '—', zhi: branch(Math.floor((hour + 1) / 2)) } : null,
    dayMaster: { gan: yG },
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = q => new Promise(r => rl.question(q, r))

  console.log('\n  ☯  BaZi Local Agent\n  ' + '─'.repeat(30))

  // Collect birth data
  const name  = await ask('  Name: ')
  const bdate = await ask('  Birth date (DD.MM.YYYY): ')
  const btime = await ask('  Birth time (HH:MM, or Enter to skip): ')

  const [d, m, y] = bdate.split('.').map(Number)
  let hour = null
  if (btime.trim()) {
    const [h] = btime.split(':').map(Number)
    hour = h
  }

  const chart = buildSimpleChart(y, m, d, hour)
  const knowledge = await fetchKnowledge(chart)

  const systemPrompt = [
    `You are a wise BaZi (Four Pillars of Destiny) master. The user's name is ${name}.`,
    `Their birth data: ${bdate}${btime ? ' ' + btime : ''}.`,
    `Their approximate chart: Year stem ${chart.year.gan} (${chart.year.zhi}).`,
    knowledge,
    'Answer questions about their chart honestly and with depth. Be conversational.',
  ].filter(Boolean).join('\n\n')

  const messages = [{ role: 'system', content: systemPrompt }]

  console.log('\n  Ready! Type your question (or "exit" to quit).\n')

  while (true) {
    const input = await ask('  You: ')
    if (!input.trim() || input.toLowerCase() === 'exit') break

    messages.push({ role: 'user', content: input })
    process.stdout.write('  BaZi: ')

    try {
      const reply = await callAI(messages)
      console.log(reply + '\n')
      messages.push({ role: 'assistant', content: reply })
    } catch (e) {
      console.error('  ❌ ' + e.message + '\n')
      messages.pop()
    }
  }

  rl.close()
  console.log('\n  Goodbye ☯\n')
}

main().catch(e => { console.error(e.message); process.exit(1) })
