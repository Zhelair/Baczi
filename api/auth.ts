import type { VercelRequest, VercelResponse } from '@vercel/node'
import { SignJWT } from 'jose'
import { createHash } from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tier = 'free' | 'pro' | 'max'

const MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500,
  pro: 2000,
  max: 10000,
}

function getPassphraseTier(passphrase: string): Tier | null {
  const free = (process.env.FREE_PASSPHRASES ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const pro = (process.env.PRO_PASSPHRASES ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const max = (process.env.MAX_PASSPHRASES ?? '').split(',').map(s => s.trim()).filter(Boolean)

  if (max.includes(passphrase)) return 'max'
  if (pro.includes(passphrase)) return 'pro'
  if (free.includes(passphrase)) return 'free'
  return null
}

function hashPassphrase(passphrase: string): string {
  return createHash('sha256').update(passphrase).digest('hex')
}

function nextMonthReset(): string {
  const now = new Date()
  const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return reset.toISOString().split('T')[0]
}

async function getOrInitBalance(hash: string, tier: Tier) {
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('token_balances')
    .select('balance, tier, reset_date')
    .eq('passphrase_hash', hash)
    .single()

  if (!data || data.reset_date <= today) {
    // First use or new month — upsert with fresh balance
    const fresh = { balance: MONTHLY_TOKENS[tier], tier, reset_date: nextMonthReset() }
    await supabase
      .from('token_balances')
      .upsert({ passphrase_hash: hash, ...fresh, updated_at: new Date().toISOString() })
    return { balance: fresh.balance, resetDate: fresh.reset_date }
  }

  return { balance: data.balance, resetDate: data.reset_date }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { passphrase } = req.body ?? {}

  if (!passphrase || typeof passphrase !== 'string') {
    return res.status(400).json({ error: 'Passphrase required' })
  }

  const tier = getPassphraseTier(passphrase.trim())
  if (!tier) {
    return res.status(401).json({ error: 'Invalid passphrase' })
  }

  const hash = hashPassphrase(passphrase.trim())
  const balance = await getOrInitBalance(hash, tier)

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const token = await new SignJWT({ tier, hash })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  return res.status(200).json({
    token,
    tier,
    balance: balance.balance,
    resetDate: balance.resetDate,
  })
}
