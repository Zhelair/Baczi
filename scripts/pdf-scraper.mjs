#!/usr/bin/env node
/**
 * Baczi PDF Knowledge Scraper
 *
 * Reads PDF files, extracts BaZi / Qi Men / Feng Shui rules using DeepSeek AI,
 * and inserts them into the Supabase `bazi_knowledge` table.
 *
 * Usage:
 *   node --env-file=.env.local scripts/pdf-scraper.mjs [pdf-folder]
 *   node --env-file=.env.local scripts/pdf-scraper.mjs ~/Downloads
 *
 * Default folder: ./pdfs/
 *
 * Required env vars (in .env.local):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY
 *
 * Notes:
 *   - Scanned / image-only PDFs won't have extractable text. Use OCR first.
 *   - Duplicates are skipped (same pattern + school + rule_text).
 *   - source_url is set to "pdf:<filename>" for easy filtering later.
 */

import { readdir, mkdir } from 'fs/promises'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !DEEPSEEK_KEY) {
  console.error('❌ Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEEPSEEK_API_KEY')
  console.error('   Make sure .env.local exists and run with: node --env-file=.env.local scripts/pdf-scraper.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const pdfFolder = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'pdfs')

const CHUNK_SIZE    = 3500   // chars per DeepSeek call
const CHUNK_OVERLAP = 300    // overlap to avoid cutting rules mid-sentence
const DELAY_MS      = 1200   // ms between AI calls (rate limit safety)

// ─── Valid values matching existing DB conventions ────────────────────────────

const VALID_SCHOOLS = new Set([
  'classical', 'zi_ping', 'dong_gong', 'joey_yap',
  'qi_men', 'feng_shui', 'unknown',
])

const VALID_CONFIDENCE = new Set(['high', 'medium', 'low'])

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = []
  let start = 0
  while (start < text.length) {
    chunks.push(text.slice(start, start + size))
    start += size - overlap
  }
  return chunks
}

// ─── PDF extraction ───────────────────────────────────────────────────────────

async function extractTextFromPdf(filePath) {
  // pdf-parse is CJS; use createRequire in ESM context
  const require = createRequire(import.meta.url)
  const pdfParse = require('pdf-parse')
  const buffer = readFileSync(filePath)
  const data = await pdfParse(buffer)
  return data.text
}

// ─── AI rule extraction ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert in Chinese metaphysics: BaZi (Four Pillars of Destiny), Qi Men Dun Jia (QMDJ), Feng Shui, and related classical arts.

Your task: extract structured knowledge rules from the provided text and return them as a JSON array.

Each rule object must have exactly these fields:
- "pattern": The main subject (e.g. a Stem-Branch combo like "甲子", a QMDJ gate "休門", a star, an element interaction, a timing rule, etc.)
- "rule_text": Clear, standalone English interpretation (2-5 sentences). Must make sense without the surrounding text.
- "school": One of exactly: "classical", "zi_ping", "dong_gong", "qi_men", "feng_shui", "joey_yap", "unknown"
- "confidence": One of exactly: "high" (authoritative classical source), "medium" (practitioner notes/commentary), "low" (speculative or unclear source)
- "tags": Array of English/pinyin search tags, e.g. ["Jia", "Zi", "Rat", "Wood", "Day Master"]

Rules:
- Only extract genuine metaphysical rules/interpretations. Skip table of contents, page numbers, author bios, unrelated content.
- If the chunk contains no relevant metaphysical content, return an empty array [].
- Aim for 3-15 rules per chunk. Do not invent rules not present in the text.
- Keep rule_text self-contained and informative.

Return ONLY a valid JSON array (no markdown, no code fences, no explanations).`

async function extractRulesFromChunk(chunk, sourceFile) {
  const userMsg = `Extract knowledge rules from this text (source: ${path.basename(sourceFile)}):\n\n${chunk}`

  const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMsg },
      ],
      temperature: 0.1,
      max_tokens:  2048,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API ${res.status}: ${err}`)
  }

  const json    = await res.json()
  const content = json.choices?.[0]?.message?.content?.trim() ?? '[]'

  try {
    // Strip accidental markdown fences
    const cleaned = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '')
    const parsed  = JSON.parse(cleaned)
    return Array.isArray(parsed)
      ? parsed
      : (parsed.rules ?? parsed.data ?? [])
  } catch {
    console.warn('    ⚠ Could not parse AI response as JSON, skipping chunk')
    return []
  }
}

// ─── Supabase insertion with dedup ────────────────────────────────────────────

async function insertRules(rules, sourceFile) {
  let inserted = 0
  let skipped  = 0

  for (const rule of rules) {
    const { pattern, rule_text, school, confidence } = rule ?? {}

    // Validate required fields
    if (!pattern?.trim() || !rule_text?.trim()) { skipped++; continue }
    const safeSchool     = VALID_SCHOOLS.has(school)     ? school     : 'unknown'
    const safeConfidence = VALID_CONFIDENCE.has(confidence) ? confidence : 'medium'

    // Dedup: same pattern + school + identical rule_text
    const { data: existing } = await supabase
      .from('bazi_knowledge')
      .select('id')
      .eq('pattern',   pattern.trim())
      .eq('school',    safeSchool)
      .eq('rule_text', rule_text.trim())
      .limit(1)

    if (existing?.length) { skipped++; continue }

    const tags = Array.isArray(rule.tags) ? rule.tags.filter(t => typeof t === 'string') : []

    const { error } = await supabase
      .from('bazi_knowledge')
      .insert({
        pattern:    pattern.trim(),
        rule_text:  rule_text.trim(),
        school:     safeSchool,
        confidence: safeConfidence,
        tags,
        source_url: `pdf:${path.basename(sourceFile)}`,
      })

    if (error) {
      console.warn(`    ⚠ Insert failed for "${pattern}": ${error.message}`)
      skipped++
    } else {
      inserted++
    }
  }

  return { inserted, skipped }
}

// ─── Per-file processing ──────────────────────────────────────────────────────

async function processPdf(filePath) {
  console.log(`\n📄 ${path.basename(filePath)}`)

  let text
  try {
    text = await extractTextFromPdf(filePath)
    console.log(`   Extracted ${text.length.toLocaleString()} chars`)
  } catch (err) {
    console.error(`   ❌ Could not read PDF: ${err.message}`)
    console.error('   (Scanned / image PDFs need OCR before they can be processed)')
    return { inserted: 0, skipped: 0, error: true }
  }

  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (trimmed.length < 150) {
    console.log('   ⏭ Skipping: too little text (likely a scanned/image-only PDF)')
    return { inserted: 0, skipped: 0 }
  }

  const chunks = chunkText(trimmed)
  console.log(`   Split into ${chunks.length} chunk(s)`)

  let totalInserted = 0
  let totalSkipped  = 0

  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`   Chunk ${i + 1}/${chunks.length} → `)

    try {
      const rules = await extractRulesFromChunk(chunks[i], filePath)
      process.stdout.write(`${rules.length} rules → `)

      const { inserted, skipped } = await insertRules(rules, filePath)
      console.log(`✅ inserted ${inserted}, skipped ${skipped}`)

      totalInserted += inserted
      totalSkipped  += skipped
    } catch (err) {
      console.error(`ERROR: ${err.message}`)
    }

    if (i < chunks.length - 1) await sleep(DELAY_MS)
  }

  return { inserted: totalInserted, skipped: totalSkipped }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════╗')
  console.log('║  Baczi PDF Knowledge Scraper         ║')
  console.log('╚══════════════════════════════════════╝')
  console.log(`Folder: ${pdfFolder}\n`)

  if (!existsSync(pdfFolder)) {
    if (process.argv[2]) {
      console.error(`❌ Folder not found: ${pdfFolder}`)
      process.exit(1)
    }
    await mkdir(pdfFolder, { recursive: true })
    console.log('Created ./pdfs/ folder.')
    console.log('Drop your PDF files there and run again:\n')
    console.log('  npm run scrape:pdf\n')
    process.exit(0)
  }

  const files = (await readdir(pdfFolder))
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(pdfFolder, f))

  if (files.length === 0) {
    console.log(`No .pdf files found in ${pdfFolder}`)
    console.log('You can also pass a folder as argument:')
    console.log('  node --env-file=.env.local scripts/pdf-scraper.mjs ~/Downloads')
    process.exit(0)
  }

  console.log(`Found ${files.length} PDF file(s)`)

  let grandInserted = 0
  let grandSkipped  = 0

  for (const file of files) {
    const { inserted = 0, skipped = 0 } = await processPdf(file)
    grandInserted += inserted
    grandSkipped  += skipped
  }

  console.log('\n══════════════════════════════════════')
  console.log(`Total inserted : ${grandInserted}`)
  console.log(`Total skipped  : ${grandSkipped}  (duplicates or invalid)`)
  console.log('══════════════════════════════════════')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
