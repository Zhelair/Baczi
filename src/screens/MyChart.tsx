import { useMemo } from 'react'
import PillarCard from '../components/PillarCard'
import { calculateChart } from '../engine/baziCalculator'
import { t, STEMS, BRANCHES } from '../engine/translations'
import type { Language, UserProfile, LuckCycle } from '../engine/types'

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

function yearGanZhi(year: number): [string, string] {
  return [
    GAN[((year - 4) % 10 + 10) % 10],
    ZHI[((year - 4) % 12 + 12) % 12],
  ]
}

function LifeYearsGrid({ birthYear, lang }: { birthYear: number; lang: Language }) {
  const currentYear = new Date().getFullYear()
  const startYear = birthYear
  const endYear   = birthYear + 90

  // Group into rows of 10 columns (decades)
  const decades: number[][] = []
  for (let y = startYear; y < endYear; y += 10) {
    decades.push(Array.from({ length: 10 }, (_, i) => y + i).filter(yr => yr < endYear))
  }

  return (
    <section className="mb-6">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
        {lang === 'bg' ? 'Години на живота' : lang === 'ru' ? 'Годы жизни' : 'Life Years'}
      </h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-max">
          {decades.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map(year => {
                const [g, z] = yearGanZhi(year)
                const elemKey = STEMS[g]?.elementKey ?? 'earth'
                const isNow = year === currentYear
                return (
                  <div
                    key={year}
                    className={`flex flex-col items-center w-10 rounded-lg px-1 py-1.5 transition-all ${
                      isNow
                        ? 'bg-amber-500/15 ring-1 ring-amber-500/50'
                        : 'bg-zinc-900 hover:bg-zinc-800'
                    }`}
                  >
                    <span className={`text-[9px] leading-none mb-0.5 ${isNow ? 'text-amber-400 font-semibold' : 'text-zinc-600'}`}>
                      {year}
                    </span>
                    <span className={`chinese text-sm leading-none font-medium element-${elemKey}`}>{g}</span>
                    <span className={`chinese text-sm leading-none element-${BRANCHES[z]?.elementKey ?? 'earth'}`}>{z}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface Props {
  profile: UserProfile
  lang: Language
}

const TIMELINE_SPAN = 90  // years shown on timeline

function elementRingColor(key: string): string {
  return {
    wood:  'ring-lime-400/60',
    fire:  'ring-red-400/60',
    earth: 'ring-amber-400/60',
    metal: 'ring-slate-400/60',
    water: 'ring-blue-400/60',
  }[key] ?? 'ring-zinc-500/40'
}

function LuckTimeline({ cycles, birthYear, lang }: {
  cycles: LuckCycle[]
  birthYear: number
  lang: Language
}) {
  const currentYear = new Date().getFullYear()
  const endYear = birthYear + TIMELINE_SPAN
  const span = endYear - birthYear

  const currentPct = Math.min(Math.max(((currentYear - birthYear) / span) * 100, 0), 100)

  if (cycles.length === 0) return null

  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
        {lang === 'bg' ? '10-годишни цикли на съдбата' : lang === 'ru' ? '10-летние циклы удачи' : '10-Year Luck Cycles'}
      </h3>

      {/* ── Timeline bar ── */}
      <div className="relative mb-1">
        <div className="relative h-7 bg-zinc-800 rounded-lg overflow-hidden">
          {cycles.map((cycle, i) => {
            const startPct = Math.max(((cycle.startYear - birthYear) / span) * 100, 0)
            const endPct   = Math.min(((cycle.endYear   - birthYear) / span) * 100, 100)
            const isActive = currentYear >= cycle.startYear && currentYear <= cycle.endYear
            return (
              <div
                key={i}
                className={`absolute top-0 h-full timeline-${cycle.elementKey} ${isActive ? 'active' : ''} transition-all`}
                style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
              />
            )
          })}
          {/* Now marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-white/90 z-10 shadow-[0_0_4px_rgba(255,255,255,0.8)]"
            style={{ left: `${currentPct}%` }}
          />
        </div>
        {/* Age labels */}
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-xs text-zinc-600">{birthYear}</span>
          <span className="text-xs text-zinc-500 font-medium">{currentYear} ▲</span>
          <span className="text-xs text-zinc-600">{endYear}</span>
        </div>
      </div>

      {/* ── Cycle cards ── */}
      <div className="mt-4 space-y-2">
        {cycles.map((cycle, i) => {
          const isActive  = currentYear >= cycle.startYear && currentYear <= cycle.endYear
          const isPast    = cycle.endYear < currentYear
          const yearInCycle = isActive ? currentYear - cycle.startYear + 1 : null

          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                isActive
                  ? `border-zinc-600 bg-zinc-900 ring-1 ${elementRingColor(cycle.elementKey)}`
                  : isPast
                    ? 'border-zinc-800/50 bg-zinc-900/30 opacity-45'
                    : 'border-zinc-800 bg-zinc-900'
              }`}
            >
              {/* Chinese chars */}
              <div className="flex items-center gap-0.5 w-12 shrink-0">
                <span className={`chinese text-2xl element-${cycle.elementKey} leading-none`}>{cycle.gan}</span>
                <span className={`chinese text-2xl element-${cycle.elementKey} leading-none`}>{cycle.zhi}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${isActive ? `element-${cycle.elementKey}` : isPast ? 'text-zinc-500' : 'text-zinc-300'}`}>
                    {cycle.startYear} – {cycle.endYear}
                  </span>
                  {isActive && (
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium element-${cycle.elementKey} bg-zinc-800`}>
                      ▶ {lang === 'bg' ? 'сега' : lang === 'ru' ? 'сейчас' : 'now'}
                      {yearInCycle && ` · ${lang === 'ru' ? 'год' : 'yr'} ${yearInCycle}/10`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {cycle.animalKey}
                  {cycle.startAge > 0 && ` · ${lang === 'ru' ? 'возраст' : lang === 'bg' ? 'възраст' : 'age'} ${cycle.startAge}–${cycle.startAge + 9}`}
                </p>
              </div>

              {/* Progress within current cycle */}
              {isActive && yearInCycle && (
                <div className="w-16 shrink-0">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full timeline-${cycle.elementKey} active rounded-full transition-all`}
                      style={{ width: `${(yearInCycle / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-zinc-600 text-[10px] text-right mt-0.5">{yearInCycle}/10</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MyChart({ profile, lang }: Props) {
  const chart = useMemo(() =>
    calculateChart(profile.birthYear, profile.birthMonth, profile.birthDay,
      profile.birthHour, profile.birthMinute, profile.gender, lang),
    [profile, lang]
  )

  const birthDateStr = new Date(profile.birthYear, profile.birthMonth - 1, profile.birthDay)
    .toLocaleDateString(lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

  return (
    <div className="bz-page">
      {/* Header */}
      <div className="mb-7">
        <h2 className="text-xl font-bold tracking-tight">
          <span className="bz-accent">{profile.name}</span>
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">
          {birthDateStr}
          {profile.birthHour !== null ? ` · ${String(profile.birthHour).padStart(2,'0')}:${String(profile.birthMinute ?? 0).padStart(2,'0')}` : ''}
        </p>
      </div>

      {/* Four Pillars */}
      <section className="mb-6">
        <p className="bz-label mb-3">
          {lang === 'bg' ? 'Четирите стълба' : lang === 'ru' ? 'Четыре столпа' : 'Four Pillars'}
        </p>
        <div className="grid grid-cols-4 gap-2">
          <PillarCard label={t('hourPillar',  lang)} pillar={chart.hour}  unknownLabel={t('unknownHour', lang)} compact />
          <PillarCard label={t('dayPillar',   lang)} pillar={chart.day}   compact />
          <PillarCard label={t('monthPillar', lang)} pillar={chart.month} compact />
          <PillarCard label={t('yearPillar',  lang)} pillar={chart.year}  compact />
        </div>
      </section>

      {/* Day Master */}
      <section className="mb-6 bz-card p-4">
        <p className="bz-label mb-3">{t('dayMaster', lang)}</p>
        <div className="flex items-center gap-4">
          <span className={`chinese text-5xl element-${chart.dayMaster.elementKey} leading-none`}>{chart.dayMaster.gan}</span>
          <div>
            <p className="text-zinc-100 font-semibold">{chart.dayMaster.element} {chart.dayMaster.polarity}</p>
            <p className="text-zinc-500 text-sm mt-0.5">{t('zodiac', lang)}: {chart.zodiac}</p>
          </div>
        </div>
      </section>

      {/* 10-Year Luck Cycles — visual timeline */}
      {chart.luckCycles.length > 0 && (
        <LuckTimeline cycles={chart.luckCycles} birthYear={profile.birthYear} lang={lang} />
      )}

      {/* Life Years grid */}
      <LifeYearsGrid birthYear={profile.birthYear} lang={lang} />
    </div>
  )
}
