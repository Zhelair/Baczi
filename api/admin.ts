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

  // GET /api/admin?key=ai|bazi|all
  if (req.method === 'GET') {
    const key = req.query.key as string | undefined
    const query = supabase.from('app_config').select('key, value')
    if (key && key !== 'all') query.eq('key', key)

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    // Return as flat map { ai: {...}, bazi: {...} }
    const result: Record<string, unknown> = {}
    for (const row of data ?? []) result[row.key] = row.value
    return res.status(200).json(result)
  }

  // POST /api/admin  body: { key: 'ai' | 'bazi', value: {...} }
  if (req.method === 'POST') {
    const { key, value } = req.body ?? {}
    if (!key || !value || !['ai', 'bazi'].includes(key)) {
      return res.status(400).json({ error: 'key must be "ai" or "bazi", value required' })
    }

    const { error } = await supabase
      .from('app_config')
      .upsert({ key, value, updated_at: new Date().toISOString() })

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true, key })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
