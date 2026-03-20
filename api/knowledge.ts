import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(auth.slice(7), secret)
    return (payload as { tier: string }).tier === 'admin'
  } catch {
    return false
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await verifyAdmin(req))) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  // GET /api/knowledge?page=0&limit=20&school=&confidence=&search=
  if (req.method === 'GET') {
    const page    = parseInt((req.query.page   as string) ?? '0')
    const limit   = Math.min(parseInt((req.query.limit  as string) ?? '30'), 100)
    const school  = (req.query.school as string | undefined)?.trim()
    const confidence = (req.query.confidence as string | undefined)?.trim()
    const search  = (req.query.search as string | undefined)?.trim()
    const from    = page * limit

    let query = supabase
      .from('bazi_knowledge')
      .select('id, pattern, rule_text, school, confidence, tags, source', { count: 'exact' })
      .order('confidence', { ascending: true })  // high < low alphabetically: high first
      .range(from, from + limit - 1)

    if (school)     query = query.eq('school', school)
    if (confidence) query = query.eq('confidence', confidence)
    if (search)     query = query.or(`pattern.ilike.%${search}%,rule_text.ilike.%${search}%`)

    const { data, error, count } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data, total: count ?? 0, page, limit })
  }

  // POST /api/knowledge — create a new rule
  if (req.method === 'POST') {
    const { pattern, rule_text, school, confidence, tags, source } = req.body ?? {}

    if (!pattern || !rule_text || !school || !confidence) {
      return res.status(400).json({ error: 'pattern, rule_text, school, confidence are required' })
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []

    const { data, error } = await supabase
      .from('bazi_knowledge')
      .insert({
        pattern,
        rule_text,
        school,
        confidence,
        tags: parsedTags,
        source: source ?? 'admin',
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json({ data })
  }

  // DELETE /api/knowledge?id=123
  if (req.method === 'DELETE') {
    const id = req.query.id as string | undefined
    if (!id) return res.status(400).json({ error: 'id required' })

    const { error } = await supabase
      .from('bazi_knowledge')
      .delete()
      .eq('id', id)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // PATCH /api/knowledge?id=123 — update a rule
  if (req.method === 'PATCH') {
    const id = req.query.id as string | undefined
    if (!id) return res.status(400).json({ error: 'id required' })

    const { pattern, rule_text, school, confidence, tags, source } = req.body ?? {}
    const updates: Record<string, unknown> = {}
    if (pattern    !== undefined) updates.pattern    = pattern
    if (rule_text  !== undefined) updates.rule_text  = rule_text
    if (school     !== undefined) updates.school     = school
    if (confidence !== undefined) updates.confidence = confidence
    if (source     !== undefined) updates.source     = source
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
          ? tags.split(',').map((s: string) => s.trim()).filter(Boolean)
          : []
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const { data, error } = await supabase
      .from('bazi_knowledge')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ data })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
