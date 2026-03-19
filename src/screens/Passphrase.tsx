import { useState } from 'react'
import { authenticate } from '../utils/api'
import { t } from '../engine/translations'
import type { Language } from '../engine/types'

interface Props {
  lang: Language
  onSuccess: () => void
}

export default function Passphrase({ lang, onSuccess }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setError('')
    setLoading(true)
    try {
      await authenticate(value.trim())
      onSuccess()
    } catch (err: unknown) {
      const e = err as { status?: number }
      setError(e.status === 401 ? t('errorInvalid', lang) : t('errorGeneral', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="chinese text-7xl mb-4">🔮</div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('passphraseTitle', lang)}</h1>
          <p className="text-zinc-500 mt-2 text-sm">{t('passphraseHint', lang)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">{t('passphraseLabel', lang)}</label>
            <input
              type="password"
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="off"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
              placeholder="••••••••••"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 transition-colors"
          >
            {loading ? t('loading', lang) : t('enter', lang)}
          </button>
        </form>
      </div>
    </div>
  )
}
