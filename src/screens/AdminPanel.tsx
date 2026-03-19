import { useState, useEffect, useCallback } from 'react'
import { Settings2, Zap, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { loadAuth } from '../utils/storage'

interface AiConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPromptExtra: string
}

interface BaziConfig {
  tokenCosts: { daily_reading: number; luck_check: number; lucky_dates: number }
  monthlyTokens: { free: number; pro: number; max: number; admin: number }
  knowledgeLimit: number
  confidenceLevels: string[]
}

interface Config {
  ai: AiConfig
  bazi: BaziConfig
}

const DEFAULT_CONFIG: Config = {
  ai: { model: 'deepseek-chat', temperature: 0.7, maxTokens: 1500, systemPromptExtra: '' },
  bazi: {
    tokenCosts: { daily_reading: 50, luck_check: 20, lucky_dates: 30 },
    monthlyTokens: { free: 500, pro: 2000, max: 10000, admin: 999999 },
    knowledgeLimit: 6,
    confidenceLevels: ['high', 'medium'],
  },
}

async function adminFetch(method: string, body?: unknown) {
  const auth = loadAuth()
  const res = await fetch(method === 'GET' ? '/api/admin?key=all' : '/api/admin', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth?.token ?? ''}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-300 font-medium text-sm">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-zinc-400 mb-1">
        {label}
        {hint && <span className="ml-2 text-zinc-600">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors'

export default function AdminPanel() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'ai' | 'bazi' | null>(null)
  const [saved, setSaved] = useState<'ai' | 'bazi' | null>(null)
  const [error, setError] = useState('')
  const [jsonView, setJsonView] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminFetch('GET') as Partial<Config>
      setConfig({
        ai:   { ...DEFAULT_CONFIG.ai,   ...(data.ai   ?? {}) },
        bazi: { ...DEFAULT_CONFIG.bazi, ...(data.bazi ?? {}) },
      })
    } catch (e) {
      setError('Failed to load config: ' + String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function save(key: 'ai' | 'bazi') {
    setSaving(key)
    setError('')
    try {
      await adminFetch('POST', { key, value: config[key] })
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
    } catch (e) {
      setError('Save failed: ' + String(e))
    } finally {
      setSaving(null)
    }
  }

  function setAi<K extends keyof AiConfig>(k: K, v: AiConfig[K]) {
    setConfig(c => ({ ...c, ai: { ...c.ai, [k]: v } }))
  }

  function setBazi<K extends keyof BaziConfig>(k: K, v: BaziConfig[K]) {
    setConfig(c => ({ ...c, bazi: { ...c.bazi, [k]: v } }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-zinc-500 text-sm">
        Loading admin config...
      </div>
    )
  }

  return (
    <div className="pb-28 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Admin Panel</h2>
          <p className="text-xs text-zinc-500 mt-0.5">AI tuning · BaZi tuning · JSON config</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setJsonView(v => !v)}
            className="text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            {jsonView ? 'Form view' : 'JSON view'}
          </button>
          <button
            onClick={load}
            className="text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} />
            Reload
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-950/50 border border-red-900 px-4 py-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {jsonView ? (
        // ── Raw JSON view ──────────────────────────────────────────────────
        <div className="space-y-4">
          {(['ai', 'bazi'] as const).map(key => (
            <div key={key} className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-sm font-medium text-zinc-300">{key.toUpperCase()} config</span>
                <SaveBtn key={key} section={key} saving={saving} saved={saved} onSave={() => save(key)} />
              </div>
              <textarea
                className="w-full bg-zinc-950 text-zinc-300 font-mono text-xs p-4 h-56 focus:outline-none resize-none"
                value={JSON.stringify(config[key], null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    if (key === 'ai') setConfig(c => ({ ...c, ai: parsed as AiConfig }))
                    else setConfig(c => ({ ...c, bazi: parsed as BaziConfig }))
                    setError('')
                  } catch {
                    setError('Invalid JSON')
                  }
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* ── AI Tuning ────────────────────────────────────────────────── */}
          <Section title="AI Tuning" icon={<Zap size={14} />}>
            <Field label="Model" hint="e.g. deepseek-chat, deepseek-reasoner">
              <input
                className={INPUT}
                value={config.ai.model}
                onChange={e => setAi('model', e.target.value)}
              />
            </Field>
            <Field label="Temperature" hint={`${config.ai.temperature} (0.0 = focused · 1.0 = creative)`}>
              <input
                type="range" min="0" max="1" step="0.05"
                value={config.ai.temperature}
                onChange={e => setAi('temperature', parseFloat(e.target.value))}
                className="w-full accent-amber-500"
              />
            </Field>
            <Field label="Max tokens" hint="per response">
              <input
                type="number" min="200" max="4000" step="100"
                className={INPUT}
                value={config.ai.maxTokens}
                onChange={e => setAi('maxTokens', parseInt(e.target.value))}
              />
            </Field>
            <Field label="System prompt append" hint="appended to every request">
              <textarea
                rows={4}
                className={INPUT + ' resize-none leading-relaxed'}
                placeholder="e.g. Always respond in a warm, mystical tone."
                value={config.ai.systemPromptExtra}
                onChange={e => setAi('systemPromptExtra', e.target.value)}
              />
            </Field>
            <div className="pt-1">
              <SaveBtn section="ai" saving={saving} saved={saved} onSave={() => save('ai')} />
            </div>
          </Section>

          {/* ── BaZi Tuning ─────────────────────────────────────────────── */}
          <Section title="BaZi Tuning" icon={<Settings2 size={14} />}>
            <p className="text-xs text-zinc-500 -mt-1 mb-2">Token costs per action</p>
            {(['daily_reading', 'luck_check', 'lucky_dates'] as const).map(action => (
              <Field key={action} label={action.replace('_', ' ')}>
                <input
                  type="number" min="0" max="500"
                  className={INPUT}
                  value={config.bazi.tokenCosts[action]}
                  onChange={e => setBazi('tokenCosts', {
                    ...config.bazi.tokenCosts,
                    [action]: parseInt(e.target.value),
                  })}
                />
              </Field>
            ))}

            <p className="text-xs text-zinc-500 mt-4 mb-2">Monthly token limits per tier</p>
            {(['free', 'pro', 'max', 'admin'] as const).map(tier => (
              <Field key={tier} label={tier}>
                <input
                  type="number" min="0"
                  className={INPUT}
                  value={config.bazi.monthlyTokens[tier]}
                  onChange={e => setBazi('monthlyTokens', {
                    ...config.bazi.monthlyTokens,
                    [tier]: parseInt(e.target.value),
                  })}
                />
              </Field>
            ))}

            <Field label="Knowledge rules limit" hint="RAG rules injected per request">
              <input
                type="number" min="1" max="20"
                className={INPUT}
                value={config.bazi.knowledgeLimit}
                onChange={e => setBazi('knowledgeLimit', parseInt(e.target.value))}
              />
            </Field>

            <Field label="Confidence levels" hint="comma-separated: high, medium, low">
              <input
                className={INPUT}
                value={config.bazi.confidenceLevels.join(', ')}
                onChange={e => setBazi('confidenceLevels',
                  e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                )}
              />
            </Field>

            <div className="pt-1">
              <SaveBtn section="bazi" saving={saving} saved={saved} onSave={() => save('bazi')} />
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

function SaveBtn({ section, saving, saved, onSave }: {
  section: 'ai' | 'bazi'; saving: 'ai' | 'bazi' | null; saved: 'ai' | 'bazi' | null; onSave: () => void
}) {
  const isSaving = saving === section
  const isSaved  = saved  === section
  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isSaved
          ? 'bg-green-900/60 text-green-400 border border-green-800'
          : 'bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50'
      }`}
    >
      <Save size={13} />
      {isSaving ? 'Saving…' : isSaved ? 'Saved ✓' : `Save ${section.toUpperCase()}`}
    </button>
  )
}
