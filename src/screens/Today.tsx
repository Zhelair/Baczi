import { useState, useEffect } from 'react'
import { Zap, Clock } from 'lucide-react'
import PillarCard from '../components/PillarCard'
import StarRating from '../components/StarRating'
import TokenBadge from '../components/TokenBadge'
import ThinkingOrb from '../components/ThinkingOrb'
import AiStatusBadge from '../components/AiStatusBadge'
import { calculateChart, calculateTodayPillars, serializeChart, serializeToday } from '../engine/baziCalculator'
import { t, LIFE_AREA_EMOJIS } from '../engine/translations'
import { loadAuth, saveAuth } from '../utils/storage'
import { loadTodayReading, saveReading } from '../utils/storage'
import { getInterpretation } from '../utils/api'
import type { Language, UserProfile, BaziChart, TodayPillars, DailyReading } from '../engine/types'

interface Props {
  profile: UserProfile
  lang: Language
}

export default function Today({ profile, lang }: Props) {
  const [chart] = useState<BaziChart>(() =>
    calculateChart(
      profile.birthYear, profile.birthMonth, profile.birthDay,
      profile.birthHour, profile.birthMinute, profile.gender, lang,
      profile.birthLongitude, profile.birthUtcOffset
    )
  )
  const [todayPillars] = useState<TodayPillars>(() => calculateTodayPillars(lang))
  const [reading, setReading] = useState<DailyReading | null>(() => loadTodayReading())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const auth = loadAuth()

  useEffect(() => {
    // Auto-load if no cached reading
    if (!reading && !loading) {
      handleGetReading()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGetReading() {
    setError('')
    setLoading(true)
    try {
      const { data, tokensRemaining } = await getInterpretation(
        'daily_reading',
        serializeChart(chart),
        serializeToday(todayPillars),
        lang
      ) as { data: DailyReading; tokensRemaining: number }
      const r: DailyReading = { ...data, date: todayPillars.date, tokensRemaining }
      saveReading(r)
      setReading(r)
      const a = loadAuth()
      if (a) saveAuth({ ...a, balance: tokensRemaining })
    } catch (err: unknown) {
      const e = err as { status?: number; json?: { message?: string } }
      if (e.status === 429) setError(t('errorTokens', lang))
      else setError(t('errorGeneral', lang))
    } finally {
      setLoading(false)
    }
  }

  const dateStr = new Date().toLocaleDateString(
    lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  )

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-zinc-100">
            {profile.name} · {t('today', lang)}
          </h2>
          <div className="flex items-center gap-2">
            <AiStatusBadge loading={loading} lang={lang} />
            {auth && (
              <TokenBadge balance={auth.balance} tier={auth.tier} resetDate={auth.resetDate} lang={lang} />
            )}
          </div>
        </div>
        <p className="text-zinc-500 text-sm capitalize">{dateStr}</p>
      </div>

      {/* Today's universal pillars */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('todayEnergy', lang)}</h3>
        <div className="grid grid-cols-3 gap-3">
          <PillarCard label={t('dayPillar', lang)}   pillar={todayPillars.day}   compact />
          <PillarCard label={t('monthPillar', lang)} pillar={todayPillars.month} compact />
          <PillarCard label={t('yearPillar', lang)}  pillar={todayPillars.year}  compact />
        </div>
      </section>

      {/* Personal day master */}
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{t('dayMaster', lang)}</p>
        <p className="text-zinc-100">
          <span className={`chinese text-2xl element-${chart.dayMaster.elementKey} mr-2`}>{chart.dayMaster.gan}</span>
          {chart.dayMaster.element} {chart.dayMaster.polarity}
        </p>
      </section>

      {/* Reading area */}
      {loading && <ThinkingOrb lang={lang} />}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={handleGetReading} className="text-amber-400 text-sm mt-2 underline">
            {t('enter', lang)} →
          </button>
        </div>
      )}

      {reading && !loading && (
        <>
          {/* Interpretation */}
          <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('yourReading', lang)}</h3>
            <p className="text-zinc-200 text-sm leading-relaxed">{reading.interpretation}</p>
          </section>

          {/* Life areas */}
          <section className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
              {lang === 'bg' ? 'Области на живота' : lang === 'ru' ? 'Сферы жизни' : 'Life Areas'}
            </h3>
            <div className="space-y-2">
              {reading.lifeAreas?.map(area => (
                <div key={area.key} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                  <span className="text-xl">{LIFE_AREA_EMOJIS[area.key] ?? '•'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-zinc-200">{t(area.key, lang)}</span>
                      <StarRating score={area.score} />
                    </div>
                    <p className="text-xs text-zinc-400">{area.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Lucky hours */}
          {reading.luckyHours?.length > 0 && (
            <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-amber-400" />
                <h3 className="text-xs uppercase tracking-wider text-zinc-500">{t('luckyHours', lang)}</h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                {reading.luckyHours.map(h => (
                  <span key={h} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm rounded-lg px-3 py-1">
                    {h}
                  </span>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Refresh button */}
      {!loading && (
        <button
          onClick={handleGetReading}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-zinc-700 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 rounded-xl py-3 text-sm transition-colors"
        >
          <Zap size={14} />
          {reading ? t('quickLuck', lang) : t('getReading', lang)}
        </button>
      )}
    </div>
  )
}
