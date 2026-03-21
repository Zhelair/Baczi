/**
 * embed-knowledge.mjs
 *
 * One-time batch script: generates OpenAI text-embedding-3-small embeddings
 * for all rows in bazi_knowledge that don't have an embedding yet, then
 * stores them back in Supabase.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/embed-knowledge.mjs
 *
 * Or with a .env file (requires dotenv):
 *   node --env-file=.env scripts/embed-knowledge.mjs
 *
 * Rate limits: OpenAI text-embedding-3-small allows ~1M tokens/min on tier 1.
 * We use batch size 100 with a 500ms pause between batches to stay safe.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY   = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const BATCH_SIZE  = 100   // rows to embed per OpenAI call
const PAUSE_MS    = 500   // ms between batches (rate-limit buffer)
const MODEL       = 'text-embedding-3-small'

/**
 * Build the text to embed for a single knowledge row.
 * Combining pattern + rule_text gives the model richer semantic signal.
 */
function rowToText(row) {
  const parts = []
  if (row.pattern)   parts.push(row.pattern)
  if (row.rule_text) parts.push(row.rule_text)
  if (row.tags?.length) parts.push(row.tags.join(' '))
  return parts.join('. ')
}

/** Call OpenAI embeddings API for up to 2048 texts at once. */
async function embedBatch(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error ${res.status}: ${err}`)
  }
  const data = await res.json()
  // data.data is sorted by index
  return data.data.map(d => d.embedding)
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function main() {
  console.log('Fetching rows without embeddings...')

  // Paginate through all rows without embeddings
  let offset = 0
  let totalProcessed = 0
  let totalSkipped = 0

  while (true) {
    const { data: rows, error } = await supabase
      .from('bazi_knowledge')
      .select('id, pattern, rule_text, tags')
      .is('embedding', null)
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('Supabase fetch error:', error)
      process.exit(1)
    }

    if (!rows || rows.length === 0) {
      console.log('No more rows to process.')
      break
    }

    console.log(`Processing batch: rows ${offset + 1}–${offset + rows.length}`)

    const texts = rows.map(rowToText)

    let embeddings
    try {
      embeddings = await embedBatch(texts)
    } catch (err) {
      console.error('Embedding batch failed:', err.message)
      console.log('Retrying after 5s...')
      await sleep(5000)
      try {
        embeddings = await embedBatch(texts)
      } catch (err2) {
        console.error('Retry also failed, skipping batch:', err2.message)
        totalSkipped += rows.length
        offset += rows.length
        continue
      }
    }

    // Update each row individually (Supabase JS doesn't support bulk vector upserts cleanly)
    // We use Promise.all in sub-batches of 10 to avoid overwhelming Supabase
    const updates = rows.map((row, i) => ({ id: row.id, embedding: embeddings[i] }))
    const SUB = 10
    for (let i = 0; i < updates.length; i += SUB) {
      const chunk = updates.slice(i, i + SUB)
      await Promise.all(
        chunk.map(({ id, embedding }) =>
          supabase
            .from('bazi_knowledge')
            .update({ embedding: `[${embedding.join(',')}]` })
            .eq('id', id)
        )
      )
    }

    totalProcessed += rows.length
    console.log(`  ✓ Embedded and stored ${rows.length} rows (total: ${totalProcessed})`)

    // If we got fewer rows than batch size, we're done
    if (rows.length < BATCH_SIZE) break

    offset += rows.length
    await sleep(PAUSE_MS)
  }

  console.log(`\nDone. Processed: ${totalProcessed}, Skipped: ${totalSkipped}`)
  if (totalSkipped > 0) {
    console.log('Re-run the script to retry skipped rows.')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
