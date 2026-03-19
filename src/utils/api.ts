import { loadAuth, saveAuth } from './storage'

async function apiFetch(path: string, body: unknown): Promise<unknown> {
  const auth = loadAuth()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`

  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) })
  const json = await res.json() as Record<string, unknown>

  if (!res.ok) throw Object.assign(new Error((json.error as string) ?? 'API error'), { status: res.status, json })
  return json
}

export async function authenticate(passphrase: string) {
  const data = await apiFetch('/api/auth', { passphrase }) as {
    token: string; tier: string; balance: number; resetDate: string
  }
  const auth = { token: data.token, tier: data.tier as import('../engine/types').Tier, balance: data.balance, resetDate: data.resetDate }
  saveAuth(auth)
  return auth
}

export async function getInterpretation(action: string, chart: unknown, today: unknown, language: string) {
  const data = await apiFetch('/api/interpret', { action, chart, today, language }) as {
    data: unknown; tokensRemaining: number
  }

  // Update stored balance
  const auth = loadAuth()
  if (auth) saveAuth({ ...auth, balance: data.tokensRemaining })

  return data
}
