import { useState } from 'react'
import { Lock, Compass, Zap, Hexagon } from 'lucide-react'
import { authenticate } from '../utils/api'
import { t } from '../engine/translations'
import type { Language } from '../engine/types'

type FeatureKey = 'activations' | 'fengshui' | 'qmdj'

interface Props {
  feature: FeatureKey
  lang: Language
  onUpgrade: () => void
}

const FEATURE_META: Record<FeatureKey, { icon: typeof Compass; titleKey: string; descKey: string }> = {
  activations: { icon: Zap,     titleKey: 'lockedActivationsTitle', descKey: 'lockedActivationsDesc' },
  fengshui:    { icon: Compass, titleKey: 'lockedFengshuiTitle',    descKey: 'lockedFengshuiDesc'    },
  qmdj:        { icon: Hexagon, titleKey: 'lockedQmdjTitle',        descKey: 'lockedQmdjDesc'        },
}

export default function LockedFeature({ feature, lang, onUpgrade }: Props) {
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const meta = FEATURE_META[feature]
  const Icon = meta.icon

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!passphrase.trim()) return
    setError('')
    setLoading(true)
    try {
      await authenticate(passphrase.trim())
      onUpgrade()
    } catch (err: unknown) {
      const e = err as { status?: number }
      setError(e.status === 401 ? t('errorInvalid', lang) : t('errorGeneral', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Lock badge */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Icon size={36} className="text-amber-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <Lock size={13} className="text-zinc-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-2">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full mb-3">
            {t('lockedProOnly', lang)}
          </span>
          <h2 className="text-2xl font-bold text-zinc-100">
            {t(meta.titleKey, lang)}
          </h2>
        </div>

        {/* Description */}
        <p className="text-center text-zinc-400 text-sm leading-relaxed mb-8 px-2">
          {t(meta.descKey, lang)}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs">{t('lockedSubtitle', lang)}</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* CTA / inline passphrase */}
        {!showInput ? (
          <button
            onClick={() => setShowInput(true)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl py-3 transition-colors"
          >
            {t('lockedCta', lang)}
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">{t('lockedPassLabel', lang)}</label>
              <input
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                autoFocus
                autoComplete="off"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowInput(false); setError(''); setPassphrase('') }}
                className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 font-semibold rounded-xl py-3 transition-colors"
              >
                {lang === 'bg' ? 'Назад' : lang === 'ru' ? 'Назад' : 'Back'}
              </button>
              <button
                type="submit"
                disabled={loading || !passphrase.trim()}
                className="flex-2 flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 transition-colors"
              >
                {loading ? t('loading', lang) : t('enter', lang)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
