import { useMemo } from 'react'
import PillarCard from '../components/PillarCard'
import { calculateChart } from '../engine/baziCalculator'
import { t } from '../engine/translations'
import type { Language, UserProfile } from '../engine/types'

interface Props {
  profile: UserProfile
  lang: Language
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
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-100">{profile.name}</h2>
        <p className="text-zinc-500 text-sm">
          {birthDateStr}
          {profile.birthHour !== null ? ` · ${String(profile.birthHour).padStart(2,'0')}:${String(profile.birthMinute ?? 0).padStart(2,'0')}` : ''}
        </p>
      </div>

      {/* Four Pillars */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? 'Четирите стълба' : lang === 'ru' ? 'Четыре столпа' : 'Four Pillars'}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          <PillarCard label={t('hourPillar',  lang)} pillar={chart.hour}  unknownLabel={t('unknownHour', lang)} compact />
          <PillarCard label={t('dayPillar',   lang)} pillar={chart.day}   compact />
          <PillarCard label={t('monthPillar', lang)} pillar={chart.month} compact />
          <PillarCard label={t('yearPillar',  lang)} pillar={chart.year}  compact />
        </div>
      </section>

      {/* Day Master */}
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">{t('dayMaster', lang)}</p>
        <div className="flex items-center gap-3">
          <span className={`chinese text-4xl element-${chart.dayMaster.elementKey}`}>{chart.dayMaster.gan}</span>
          <div>
            <p className="text-zinc-100 font-medium">{chart.dayMaster.element} {chart.dayMaster.polarity}</p>
            <p className="text-zinc-500 text-sm">{t('zodiac', lang)}: {chart.zodiac}</p>
          </div>
        </div>
      </section>

      {/* 10-Year Luck Cycles */}
      {chart.luckCycles.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('luckCycles', lang)}</h3>
          <div className="space-y-2">
            {chart.luckCycles.map((cycle, i) => {
              const isActive = new Date().getFullYear() >= cycle.startYear && new Date().getFullYear() <= cycle.endYear
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    isActive
                      ? 'border-amber-500/50 bg-amber-500/5'
                      : 'border-zinc-800 bg-zinc-900'
                  }`}
                >
                  <div className="flex gap-1">
                    <span className={`chinese text-2xl element-${cycle.elementKey}`}>{cycle.gan}</span>
                    <span className={`chinese text-2xl element-${cycle.elementKey}`}>{cycle.zhi}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isActive ? 'text-amber-400' : 'text-zinc-300'}`}>
                      {cycle.startYear} – {cycle.endYear}
                      {isActive && <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 rounded px-1">▶ now</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{cycle.animalKey}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
