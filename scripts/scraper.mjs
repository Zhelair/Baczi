/**
 * BaZi Knowledge Scraper  —  run locally whenever you want
 *
 * First time setup:
 *   1. Run supabase/bazi_knowledge.sql in your Supabase SQL editor
 *   2. Copy .env.example to .env.local and fill in credentials
 *
 * Run:
 *   npm run scrape              — full run (local .md + web scraping)
 *   npm run scrape -- --local   — local .md files only (no web, no DeepSeek cost)
 *
 * Sources processed (in order):
 *   1. knowledge/*.md           — curated rules (direct parse, no DeepSeek cost)
 *   2. knowledge/html/*.html    — local HTML files you saved from your browser
 *   3. Web sources (see WEB_SOURCES below) — DeepSeek extraction
 *      Priority school: joey_yap (fourpillars.ru)
 *      Other schools tagged per source, stored alongside
 *
 * Contradiction handling:
 *   Rules from different schools coexist in the DB tagged by `school`.
 *   The app filters by preferred school (joey_yap first) at query time.
 *   Conflicting rules are never deleted — they stay for reference.
 *
 * Each run is safe to re-run — upserts on (pattern, source_url), never duplicates.
 */

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join, extname, basename } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')

const LOCAL_ONLY = process.argv.includes('--local')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ── School assignment per source domain ───────────────────────────────────────
// Rules extracted from a known source get this school tag automatically,
// overriding whatever DeepSeek guesses.

const SCHOOL_BY_DOMAIN = {
  'fourpillars.ru':    'joey_yap',
  'joeyap.com':        'joey_yap',
  'mingli.info':       'classical',
  'zi3.ru':            'classical',
  'feng-shui.ru':      'classical',
  'fatemaster.ai':     'unknown',
  'bazi-lab.com':      'unknown',
  'cantian.ai':        'unknown',
}

function schoolForUrl(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    for (const [domain, school] of Object.entries(SCHOOL_BY_DOMAIN)) {
      if (host.includes(domain)) return school
    }
  } catch {}
  return 'unknown'
}

// ── .md structured parser (no DeepSeek — direct load) ────────────────────────

function parseMdRules(content, filePath) {
  const sourceUrl = `local:${basename(filePath)}`
  const rules = []

  const blocks = content.split(/^## /m).slice(1)

  for (const block of blocks) {
    const lines = block.split('\n')
    const pattern = lines[0].trim()
    if (!pattern) continue

    let tags = []
    let school = 'unknown'
    let confidence = 'medium'
    let descLines = []
    let inDesc = false

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('---')) break

      if (!inDesc) {
        if (line.startsWith('tags:')) {
          tags = line.replace('tags:', '').split(',').map(t => t.trim()).filter(Boolean)
          continue
        }
        if (line.startsWith('school:')) {
          school = line.replace('school:', '').trim()
          continue
        }
        if (line.startsWith('confidence:')) {
          confidence = line.replace('confidence:', '').trim()
          continue
        }
        if (line.trim() === '') {
          inDesc = true
          continue
        }
      } else {
        descLines.push(line)
      }
    }

    const rule_text = descLines.join('\n').trim()
    if (!pattern || !rule_text) continue

    rules.push({
      pattern:    pattern.slice(0, 200),
      rule_text:  rule_text.slice(0, 1000),
      school:     school.slice(0, 50),
      source_url: sourceUrl,
      confidence: ['high', 'medium', 'low'].includes(confidence) ? confidence : 'medium',
      tags,
      lang: 'en',
    })
  }

  return rules
}

async function processLocalMd(filePath) {
  const content = await readFile(filePath, 'utf8')
  const rules = parseMdRules(content, filePath)
  console.log(`  Parsed ${rules.length} rules from ${basename(filePath)}`)
  return rules
}

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

function extractArticleLinks(html, baseUrl) {
  const links = new Set()
  const patterns = [
    /href="(\/(?:articles?|sections?|posts?|bazi|theory|knowledge|wiki|guide|blog|ten-gods|branches|stems|school)[^"]*?)"/gi,
    /href="(https?:\/\/(?:fourpillars\.ru|mingli\.info|zi3\.ru|feng-shui\.ru|fatemaster\.ai|bazi-lab\.com|cantian\.ai)[^"]*?)"/gi,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const href = match[1]
      const full = href.startsWith('http') ? href : new URL(href, baseUrl).href
      if (!full.match(/\?|#/) && full !== baseUrl) links.add(full)
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
      if (!res.ok) { console.log(`  HTTP ${res.status} for ${url}`); return null }
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

// ── DeepSeek extraction ───────────────────────────────────────────────────────
// schoolHint: tells DeepSeek which school this source belongs to, so extracted
// rules get the correct school tag instead of being guessed.

async function extractRules(text, sourceUrl, lang, schoolHint = 'unknown') {
  const trimmed = text.slice(0, 5000)

  const schoolNote = schoolHint !== 'unknown'
    ? `This source belongs to the "${schoolHint}" school. Set school="${schoolHint}" for ALL rules extracted from it.`
    : 'Detect the school from context (classical | zi_ping | dong_gong | joey_yap | unknown).'

  const prompt = `You are a BaZi (Four Pillars of Destiny) expert. Extract structured BaZi rules from the article text below.

Article source: ${sourceUrl}
Language: ${lang === 'ru' ? 'Russian' : 'English'}
School note: ${schoolNote}

Article text:
"""
${trimmed}
"""

Extract every distinct BaZi rule, relationship, interaction, or principle mentioned.

Respond ONLY with valid JSON:
{
  "rules": [
    {
      "pattern": "short identifier using pinyin e.g. Zi_Wu_clash or strong_Jia_daymaster",
      "rule_text": "clear description of the rule in English",
      "school": "${schoolHint !== 'unknown' ? schoolHint : 'classical'}",
      "confidence": "high",
      "tags": ["Zi", "Wu", "clash", "earthly_branch"]
    }
  ]
}

- pattern: pinyin names (Jia Yi Bing Ding Wu Ji Geng Xin Ren Gui / Zi Chou Yin Mao Chen Si Wu Wei Shen You Xu Hai)
- rule_text: always in English even if source is Russian
- confidence: "high" if clearly stated, "medium" if implied, "low" if uncertain
- school: use the school note above — do not override a known school
- If no rules found: {"rules": []}`

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

    if (!res.ok) { console.log(`  DeepSeek error ${res.status}`); return [] }

    const data = await res.json()
    const parsed = JSON.parse(data.choices[0].message.content)
    const rules = parsed.rules ?? []

    // Hard-override school for known sources — don't trust DeepSeek to get it right
    const finalSchool = schoolHint !== 'unknown' ? schoolHint : null

    return rules.map(r => ({
      pattern:    String(r.pattern || '').slice(0, 200),
      rule_text:  String(r.rule_text || '').slice(0, 1000),
      school:     finalSchool ?? String(r.school || 'unknown').slice(0, 50),
      source_url: sourceUrl,
      confidence: ['high', 'medium', 'low'].includes(r.confidence) ? r.confidence : 'medium',
      tags:       Array.isArray(r.tags) ? r.tags.map(t => String(t).slice(0, 50)) : [],
      lang: 'en',  // rule_text is always English (DeepSeek translates)
    }))
  } catch (err) {
    console.log(`  Extraction error: ${err.message}`)
    return []
  }
}

// ── Supabase storage ──────────────────────────────────────────────────────────

async function storeRules(rules) {
  if (rules.length === 0) return 0
  const { error } = await supabase
    .from('bazi_knowledge')
    .upsert(rules, { onConflict: 'pattern,source_url', ignoreDuplicates: false })
  if (error) { console.log(`  Supabase error: ${error.message}`); return 0 }
  return rules.length
}

// ── File scanning helpers ─────────────────────────────────────────────────────

async function findFiles(dir, ext) {
  const results = []
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return results }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await findFiles(full, ext))
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ext) {
      results.push(full)
    }
  }
  return results
}

// ── Web sources ───────────────────────────────────────────────────────────────
//
// school field here becomes the hard-override school for all rules from that source.
// 'unknown' means DeepSeek detects it from context.
//
// Priority:
//   joey_yap  — fourpillars.ru (primary school for this app)
//   classical — mingli.info, zi3.ru, forum.feng-shui.ru
//   unknown   — fatemaster.ai, bazi-lab.com, cantian.ai (English, mixed schools)

const WEB_SOURCES = [
  // ── Joey Yap school (primary) ─────────────────────────────────────────────
  { url: 'https://fourpillars.ru/articles',  lang: 'ru', school: 'joey_yap', discover: true },
  ...Array.from({ length: 9 }, (_, i) => ({
    url: `https://fourpillars.ru/sections/${i + 1}`,
    lang: 'ru', school: 'joey_yap', discover: true,
  })),

  // ── Classical Russian sources ─────────────────────────────────────────────
  { url: 'https://mingli.info/articles',     lang: 'ru', school: 'classical', discover: true },
  { url: 'https://mingli.info/bazi-theory',  lang: 'ru', school: 'classical', discover: true },
  { url: 'https://mingli.info/theory',       lang: 'ru', school: 'classical', discover: true },
  { url: 'https://zi3.ru',                   lang: 'ru', school: 'classical', discover: true },
  { url: 'https://forum.feng-shui.ru',       lang: 'ru', school: 'classical', discover: true },

  // ── English sources (mixed schools, DeepSeek detects) ────────────────────
  { url: 'https://www.fatemaster.ai',        lang: 'en', school: 'unknown',  discover: true },
  { url: 'https://www.bazi-lab.com',         lang: 'en', school: 'unknown',  discover: true },
  { url: 'https://cantian.ai',               lang: 'en', school: 'unknown',  discover: true },
]

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== BaZi Knowledge Scraper ===')
  console.log(`Time: ${new Date().toISOString()}`)
  if (LOCAL_ONLY) console.log('Mode: LOCAL ONLY (--local flag set, skipping web)\n')
  else console.log('Mode: FULL (local + web)\n')

  let totalRules = 0

  // ── 1. Local .md files (direct parse, no DeepSeek) ──────────────────────────
  const knowledgeDir = join(ROOT, 'knowledge')
  const mdFiles = (await findFiles(knowledgeDir, '.md'))
    .filter(f => basename(f) !== 'README.md')

  if (mdFiles.length > 0) {
    console.log(`── Local .md files (${mdFiles.length} found) ──`)
    for (const file of mdFiles) {
      console.log(`  ${basename(file)}`)
      const rules = await processLocalMd(file)
      const stored = await storeRules(rules)
      totalRules += stored
    }
  } else {
    console.log('── No .md files in knowledge/ ──')
  }

  if (LOCAL_ONLY) {
    console.log('\n=== Done (local only) ===')
    console.log(`Total rules stored/updated: ${totalRules}`)
    return
  }

  // ── 2. Local HTML files (DeepSeek extraction) ────────────────────────────────
  const htmlDir = join(ROOT, 'knowledge', 'html')
  const htmlFiles = await findFiles(htmlDir, '.html')

  if (htmlFiles.length > 0) {
    console.log(`\n── Local HTML files (${htmlFiles.length} found) ──`)
    for (const file of htmlFiles) {
      console.log(`  ${basename(file)}`)
      const html = await readFile(file, 'utf8')
      const text = htmlToText(html)
      if (text.length < 300) { console.log(`  Too short, skipping`); continue }
      const school = schoolForUrl(`local:${basename(file)}`)
      console.log(`  Extracting from ${text.length} chars (school: ${school})...`)
      const rules = await extractRules(text, `local:${basename(file)}`, 'en', school)
      console.log(`  Found ${rules.length} rules`)
      totalRules += await storeRules(rules)
    }
  }

  // ── 3. Web scraping ──────────────────────────────────────────────────────────
  console.log('\n── Web sources ──')
  const visited = new Set()

  for (const { url, lang, school, discover } of WEB_SOURCES) {
    if (visited.has(url)) continue
    visited.add(url)

    console.log(`\n[${school}] Index: ${url}`)
    const html = await fetchPage(url)
    if (!html) continue

    const indexRules = await extractRules(htmlToText(html), url, lang, school)
    console.log(`  Extracted ${indexRules.length} rules from index page`)
    totalRules += await storeRules(indexRules)

    if (discover) {
      const links = extractArticleLinks(html, url)
      console.log(`  Discovered ${links.length} article links`)

      for (const link of links) {
        if (visited.has(link)) continue
        visited.add(link)

        console.log(`\n  [${school}] Article: ${link}`)
        const pageHtml = await fetchPage(link)
        if (!pageHtml) continue
        const text = htmlToText(pageHtml)
        if (text.length < 300) { console.log(`  Too short, skipping`); continue }
        console.log(`  Extracting from ${text.length} chars...`)
        const rules = await extractRules(text, link, lang, school)
        console.log(`  Found ${rules.length} rules`)
        totalRules += await storeRules(rules)

        await sleep(1500)
      }
    }
  }

  console.log('\n=== Done ===')
  console.log(`Total rules stored/updated: ${totalRules}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
