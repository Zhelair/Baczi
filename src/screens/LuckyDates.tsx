import { useState } from 'react'
import { calculateChart, calculateTodayPillars, serializeChart, serializeToday } from '../engine/baziCalculator'
import { t } from '../engine/translations'
import { getInterpretation } from '../utils/api'
import { loadAuth, saveAuth } from '../utils/storage'
import TokenBadge from '../components/TokenBadge'
import ThinkingOrb from '../components/ThinkingOrb'
import AiStatusBadge from '../components/AiStatusBadge'
import type { Language, UserProfile } from '../engine/types'

interface Props {
  profile: UserProfile
  lang: Language
}

interface LuckyDatesResult {
  summary: string
  topTip: string
  luckyHours: string[]
}

export default function LuckyDates({ profile, lang }: Props) {
  const [result, setResult] = useState<LuckyDatesResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = loadAuth()

  async function handleCheck() {
    setError('')
    setLoading(true)
    try {
      const chart = calculateChart(
        profile.birthYear, profile.birthMonth, profile.birthDay,
        profile.birthHour, profile.birthMinute, profile.gender, lang,
        profile.birthLongitude, profile.birthUtcOffset
      )
      const today = calculateTodayPillars(lang)
      const { data, tokensRemaining } = await getInterpretation(
        'luck_check',
        serializeChart(chart),
        serializeToday(today),
        lang
      ) as { data: LuckyDatesResult; tokensRemaining: number }
      setResult(data)
      const a = loadAuth()
      if (a) saveAuth({ ...a, balance: tokensRemaining })
    } catch (err: unknown) {
      const e = err as { status?: number }
      if (e.status === 429) setError(t('errorTokens', lang))
      else setError(t('errorGeneral', lang))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">{t('lucky', lang)}</h2>
        <div className="flex items-center gap-2">
          <AiStatusBadge loading={loading} lang={lang} />
          {auth && <TokenBadge balance={auth.balance} tier={auth.tier} resetDate={auth.resetDate} lang={lang} />}
        </div>
      </div>

      {/* Quick luck check */}
      <button
        onClick={handleCheck}
        disabled={loading}
        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-xl py-3 mb-6 transition-colors"
      >
        {t('quickLuck', lang)}
      </button>

      {loading && <ThinkingOrb lang={lang} />}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-zinc-200 text-sm leading-relaxed">{result.summary}</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-xs uppercase tracking-wider text-amber-500/70 mb-2">
              {lang === 'bg' ? 'Главен съвет' : lang === 'ru' ? 'Главный совет' : 'Top Tip'}
            </p>
            <p className="text-amber-400 text-sm">{result.topTip}</p>
          </div>

          {result.luckyHours?.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('luckyHours', lang)}</p>
              <div className="flex gap-2 flex-wrap">
                {result.luckyHours.map(h => (
                  <span key={h} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-3 py-1">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phase 2 teaser */}
      <div className="mt-8 rounded-xl border border-dashed border-zinc-700 p-6 text-center">
        <p className="text-zinc-500 text-sm">
          {lang === 'bg'
            ? '📅 30-дневен календар на удачата — скоро'
            : lang === 'ru'
            ? '📅 Календарь удачи на 30 дней — скоро'
            : '📅 30-day lucky dates calendar — coming soon'}
        </p>
      </div>
    </div>
  )
}
