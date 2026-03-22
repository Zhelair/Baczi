/**
 * Shared RAG (Retrieval-Augmented Generation) utilities.
 *
 * Strategy:
 *  1. Embed the query text with OpenAI text-embedding-3-small (1536 dims).
 *  2. Call the match_knowledge Supabase RPC for cosine similarity search.
 *  3. Fall back to tag-overlap query if no embeddings are available yet.
 */
import { createClient } from '@supabase/supabase-js'

const CHAR_TO_PINYIN: Record<string, string> = {
  '甲':'Jia','乙':'Yi','丙':'Bing','丁':'Ding','戊':'Wu',
  '己':'Ji','庚':'Geng','辛':'Xin','壬':'Ren','癸':'Gui',
  '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen',
  '巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai',
}

// ── OpenAI embedding ─────────────────────────────────────────────────────────

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  if (!res.ok) throw new Error(`OpenAI embeddings ${res.status}`)
  const data = await res.json() as { data: Array<{ embedding: number[] }> }
  return data.data[0].embedding
}

// ── Chart helpers ─────────────────────────────────────────────────────────────

/** Build a compact natural-language summary of a BaZi chart for embedding. */
export function chartSummary(chart: Record<string, unknown>): string {
  const parts: string[] = []
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = chart[key] as Record<string, string> | null | undefined
    if (!p) continue
    parts.push(`${key} pillar ${p.gan ?? ''}${p.zhi ?? ''}`)
  }
  const dm = chart.dayMaster as Record<string, string> | undefined
  if (dm) parts.push(`day master ${dm.gan ?? ''} (${dm.element ?? ''} ${dm.polarity ?? ''})`)
  const lp = chart.luckyPillar as Record<string, string> | undefined
  if (lp?.gan) parts.push(`luck pillar ${lp.gan}${lp.zhi ?? ''}`)
  return parts.join(', ')
}

/** Extract pinyin tags from chart pillars (for fallback tag-overlap search). */
function extractPinyinTags(chart: Record<string, unknown>): string[] {
  const tags = new Set<string>()
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = chart[key] as Record<string, string> | null | undefined
    if (!p) continue
    if (p.gan && CHAR_TO_PINYIN[p.gan]) tags.add(CHAR_TO_PINYIN[p.gan])
    if (p.zhi && CHAR_TO_PINYIN[p.zhi]) tags.add(CHAR_TO_PINYIN[p.zhi])
  }
  const dm = chart.dayMaster as Record<string, string> | undefined
  if (dm?.gan && CHAR_TO_PINYIN[dm.gan]) tags.add(CHAR_TO_PINYIN[dm.gan])
  return [...tags]
}

// ── Knowledge retrieval ───────────────────────────────────────────────────────

interface KnowledgeRow {
  pattern: string
  rule_text: string
  school: string
  similarity?: number
}

/**
 * Fetch semantically relevant BaZi rules using vector search.
 *
 * @param queryText  - The user question + chart context (combined for embedding)
 * @param chart      - Full chart object (used for tag-overlap fallback)
 * @param supabase   - Supabase client with service-role key
 * @param limit      - Max rules to return (default 25)
 * @param confidence - Which confidence levels to include
 * @returns Formatted string to inject into LLM system prompt, or '' if empty.
 */
export async function fetchRelevantKnowledge(
  queryText: string,
  chart: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  limit = 25,
  confidence = ['high', 'medium'],
): Promise<string> {

  // ── 1. Try semantic vector search ──────────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    try {
      const embedding = await embedText(queryText)

      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: embedding,
        match_count: limit,
        confidence_filter: confidence,
      }) as { data: KnowledgeRow[] | null; error: unknown }

      if (!error && data && data.length > 0) {
        const lines = data.map(r =>
          `• ${r.pattern ? r.pattern + ': ' : ''}${r.rule_text}`
        )
        return `Relevant classical BaZi rules (semantic match):\n${lines.join('\n')}`
      }
    } catch (err) {
      // Log but don't crash — fall through to tag-overlap
      console.warn('RAG vector search failed, falling back to tag overlap:', err)
    }
  }

  // ── 2. Fallback: tag-overlap (works before embeddings are generated) ────────
  const tags = extractPinyinTags(chart)
  if (tags.length === 0) return ''

  try {
    const { data: fallback } = await supabase
      .from('bazi_knowledge')
      .select('pattern, rule_text, school')
      .overlaps('tags', tags)
      .in('confidence', confidence)
      .limit(limit)

    if (!fallback || fallback.length === 0) return ''
    const lines = (fallback as KnowledgeRow[]).map(r =>
      `• ${r.pattern ? r.pattern + ': ' : ''}${r.rule_text}`
    )
    return `Relevant BaZi rules (tag match):\n${lines.join('\n')}`
  } catch (err) {
    console.warn('RAG tag fallback failed:', err)
    return ''
  }
}
