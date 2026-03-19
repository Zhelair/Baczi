/**
 * BaZi Knowledge Scraper
 * Scrapes fourpillars.ru and mingli.info, extracts structured BaZi rules
 * via DeepSeek, and stores them in Supabase bazi_knowledge table.
 *
 * Run via GitHub Actions (weekly cron) or manually:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEEPSEEK_API_KEY=... node scripts/scraper.mjs
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── HTML helpers ──────────────────────────────────────────────────────────────

function htmlToText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract article links from an index/listing page
function extractArticleLinks(html, baseUrl) {
  const links = new Set()
  const patterns = [
    /href="(\/(?:articles?|sections?|posts?|bazi|theory|knowledge)[^"]*?)"/gi,
    /href="(https?:\/\/(?:fourpillars\.ru|mingli\.info)\/[^"]*?)"/gi,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const href = match[1]
      const full = href.startsWith('http') ? href : new URL(href, baseUrl).href
      // Only include content pages, not the index pages themselves
      if (!full.match(/\?|#/) && full !== baseUrl) {
        links.add(full)
      }
    }
  }
  return [...links]
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BaZiKnowledgeBot/1.0; educational research)',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'ru,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        console.log(`  HTTP ${res.status} for ${url}`)
        return null
      }
      return await res.text()
    } catch (err) {
      console.log(`  Fetch attempt ${i + 1} failed for ${url}: ${err.message}`)
      if (i < retries - 1) await sleep(2000 * (i + 1))
    }
  }
  return null
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── DeepSeek rule extraction ──────────────────────────────────────────────────

async function extractRules(text, sourceUrl, lang) {
  // Trim to fit context — keep up to 5000 chars of meaningful content
  const trimmed = text.slice(0, 5000)

  const prompt = `You are a BaZi (Four Pillars of Destiny) expert. Extract structured BaZi rules from the article text below.

Article source: ${sourceUrl}
Language: ${lang === 'ru' ? 'Russian' : 'English'}

Article text:
"""
${trimmed}
"""

Extract every distinct BaZi rule, relationship, interaction, or principle mentioned (clashes, combinations, punishments, destructions, element interactions, day master strengths, luck cycle effects, etc.).

Respond ONLY with valid JSON object in this exact format:
{
  "rules": [
    {
      "pattern": "short identifier like 'Geng+Yi_combine' or 'Zi_Wu_clash' or 'strong_Jia_daymaster'",
      "rule_text": "clear description of the rule in English",
      "school": "classical",
      "confidence": "high",
      "tags": ["Geng", "Yi", "combine", "heavenly_stem"]
    }
  ]
}

Guidelines:
- pattern: use English pinyin names (Jia Yi Bing Ding Wu Ji Geng Xin Ren Gui / Zi Chou Yin Mao Chen Si Wu Wei Shen You Xu Hai)
- tags: include all stems/branches involved + topic words (clash, combine, punishment, destruction, element, daymaster, luck_cycle, year, month, day, hour)
- confidence: "high" if clearly stated, "medium" if implied, "low" if uncertain
- school: "classical" for traditional texts, "dong_gong", "joey_yap", "zi_ping", or "unknown"
- If no BaZi rules found, return {"rules": []}`

  try {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) {
      console.log(`  DeepSeek error ${res.status} for ${sourceUrl}`)
      return []
    }

    const data = await res.json()
    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)
    const rules = parsed.rules ?? []

    return rules.map(r => ({
      pattern: String(r.pattern || '').slice(0, 200),
      rule_text: String(r.rule_text || '').slice(0, 1000),
      school: String(r.school || 'unknown').slice(0, 50),
      source_url: sourceUrl,
      confidence: ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'medium',
      tags: Array.isArray(r.tags) ? r.tags.map(t => String(t).slice(0, 50)) : [],
      lang,
    }))
  } catch (err) {
    console.log(`  Extraction error for ${sourceUrl}: ${err.message}`)
    return []
  }
}

// ── Supabase storage ──────────────────────────────────────────────────────────

async function storeRules(rules) {
  if (rules.length === 0) return 0

  const { error, count } = await supabase
    .from('bazi_knowledge')
    .upsert(rules, { onConflict: 'pattern,source_url', ignoreDuplicates: false })
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.log(`  Supabase error: ${error.message}`)
    return 0
  }
  return rules.length
}

// ── Scraping targets ──────────────────────────────────────────────────────────

const INDEX_PAGES = [
  // fourpillars.ru index pages (will discover article links)
  { url: 'https://fourpillars.ru/articles', lang: 'ru', discover: true },
  ...Array.from({ length: 9 }, (_, i) => ({
    url: `https://fourpillars.ru/sections/${i + 1}`,
    lang: 'ru',
    discover: true,
  })),
  // mingli.info index pages
  { url: 'https://mingli.info/articles', lang: 'ru', discover: true },
  { url: 'https://mingli.info/bazi-theory', lang: 'ru', discover: true },
  { url: 'https://mingli.info/theory', lang: 'ru', discover: true },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function processPage(url, lang) {
  const html = await fetchPage(url)
  if (!html) return 0

  const text = htmlToText(html)
  if (text.length < 300) {
    console.log(`  Too short (${text.length} chars), skipping`)
    return 0
  }

  console.log(`  Extracting from ${text.length} chars...`)
  const rules = await extractRules(text, url, lang)
  console.log(`  Found ${rules.length} rules`)

  const stored = await storeRules(rules)
  return stored
}

async function main() {
  console.log('=== BaZi Knowledge Scraper started ===')
  console.log(`Time: ${new Date().toISOString()}`)

  let totalPages = 0
  let totalRules = 0
  const visited = new Set()

  for (const { url, lang, discover } of INDEX_PAGES) {
    if (visited.has(url)) continue
    visited.add(url)

    console.log(`\nIndex: ${url}`)
    const html = await fetchPage(url)
    if (!html) continue

    // Process the index page itself
    const indexRules = await storeRules(
      await extractRules(htmlToText(html), url, lang)
    )
    totalRules += indexRules

    // Discover and process article sub-pages
    if (discover) {
      const links = extractArticleLinks(html, url)
      console.log(`  Discovered ${links.length} article links`)

      for (const link of links) {
        if (visited.has(link)) continue
        visited.add(link)

        console.log(`\n  Article: ${link}`)
        const stored = await processPage(link, lang)
        totalRules += stored
        totalPages++

        // Be polite to servers: 1.5s between requests
        await sleep(1500)
      }
    }
  }

  console.log('\n=== Scraper complete ===')
  console.log(`Pages processed: ${totalPages}`)
  console.log(`Rules stored: ${totalRules}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
