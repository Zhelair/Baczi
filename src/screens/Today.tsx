import { useState, useEffect } from 'react'
import { Zap, Clock, X } from 'lucide-react'
import PillarCard from '../components/PillarCard'
import TokenBadge from '../components/TokenBadge'
import ThinkingOrb from '../components/ThinkingOrb'
import AiStatusBadge from '../components/AiStatusBadge'
import { calculateChart, calculateTodayPillars, serializeChart, serializeToday } from '../engine/baziCalculator'
import { t, LIFE_AREA_EMOJIS } from '../engine/translations'
import { loadAuth, saveAuth } from '../utils/storage'
import { loadTodayReading, saveReading } from '../utils/storage'
import { getInterpretation } from '../utils/api'
import type { Language, UserProfile, BaziChart, TodayPillars, DailyReading, LifeAreaRating } from '../engine/types'

// Score → color mapping: 1=red, 2=orange, 3=amber, 4=lime, 5=emerald
function scoreColor(score: number): { bg: string; border: string; bar: string; text: string } {
  if (score >= 5) return { bg: 'bg-emerald-950/40', border: 'border-emerald-700/50', bar: 'bg-emerald-500', text: 'text-emerald-400' }
  if (score >= 4) return { bg: 'bg-lime-950/40',    border: 'border-lime-700/50',    bar: 'bg-lime-500',    text: 'text-lime-400'    }
  if (score >= 3) return { bg: 'bg-amber-950/30',   border: 'border-amber-700/40',   bar: 'bg-amber-500',   text: 'text-amber-400'   }
  if (score >= 2) return { bg: 'bg-orange-950/40',  border: 'border-orange-700/50',  bar: 'bg-orange-500',  text: 'text-orange-400'  }
  return               { bg: 'bg-red-950/40',       border: 'border-red-700/50',     bar: 'bg-red-500',     text: 'text-red-400'     }
}

function scoreLabel(score: number, lang: Language): string {
  const labels: Record<number, Record<Language, string>> = {
    5: { bg: 'Отлично', ru: 'Отлично', en: 'Excellent' },
    4: { bg: 'Добре',   ru: 'Хорошо',  en: 'Good'      },
    3: { bg: 'Неутрал', ru: 'Нейтрал', en: 'Neutral'   },
    2: { bg: 'Внимание',ru: 'Осторожно',en: 'Caution'  },
    1: { bg: 'Избягвай',ru: 'Избегать', en: 'Avoid'    },
  }
  return labels[score]?.[lang] ?? ''
}

function LifeAreaCard({ area, lang, onClick, selected }: {
  area: LifeAreaRating; lang: Language; onClick: () => void; selected: boolean
}) {
  const c = scoreColor(area.score)
  const pct = ((area.score - 1) / 4) * 100
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border p-3 text-center cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] w-full ${c.bg} ${c.border} ${selected ? 'ring-2 ring-offset-1 ring-offset-zinc-950 ring-amber-400' : ''}`}
    >
      <div className="text-2xl mb-1">{LIFE_AREA_EMOJIS[area.key] ?? '•'}</div>
      <div className="text-xs font-medium text-zinc-200 mb-2 leading-tight">{t(area.key, lang)}</div>
      {/* Score bar */}
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${c.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`text-xs mt-1 font-medium ${c.text}`}>{scoreLabel(area.score, lang)}</div>
    </button>
  )
}

function LifeAreasDashboard({ areas, lang, selectedArea, setSelectedArea }: {
  areas: LifeAreaRating[]
  lang: Language
  selectedArea: string | null
  setSelectedArea: (key: string | null) => void
}) {
  const active = selectedArea ? areas.find(a => a.key === selectedArea) : null
  const c = active ? scoreColor(active.score) : null
  return (
    <section className="mb-6">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
        {lang === 'bg' ? 'Области на живота' : lang === 'ru' ? 'Сферы жизни' : 'Life Areas'}
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {areas.map(area => (
          <LifeAreaCard
            key={area.key}
            area={area}
            lang={lang}
            selected={selectedArea === area.key}
            onClick={() => setSelectedArea(selectedArea === area.key ? null : area.key)}
          />
        ))}
      </div>
      {active && c && (
        <div className={`mt-2 rounded-xl border p-4 ${c.bg} ${c.border}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{LIFE_AREA_EMOJIS[active.key] ?? '•'}</span>
              <span className={`text-sm font-semibold ${c.text}`}>{t(active.key, lang)}</span>
            </div>
            <button onClick={() => setSelectedArea(null)} className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <p className="text-sm text-zinc-200 mt-2 leading-relaxed">{active.tip}</p>
        </div>
      )}
    </section>
  )
}

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
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
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
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">
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

          {/* Life areas dashboard */}
          <LifeAreasDashboard areas={reading.lifeAreas ?? []} lang={lang} selectedArea={selectedArea} setSelectedArea={setSelectedArea} />

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
