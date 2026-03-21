import { useMemo } from 'react'
import {
  getKuaResult,
  ENERGY_LABELS,
  DIRECTION_SYMBOLS,
  GROUP_LABELS,
  type Direction,
  type EnergyType,
  type DirectionEnergy,
} from '../engine/kua'
import type { Language, UserProfile } from '../engine/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ELEMENT_COLOR: Record<string, string> = {
  Water: 'element-water', Вода: 'element-water',
  Wood:  'element-wood',  Дърво: 'element-wood',  Дерево: 'element-wood',
  Fire:  'element-fire',  Огън: 'element-fire',   Огонь: 'element-fire',
  Earth: 'element-earth', Земя: 'element-earth',  Земля: 'element-earth',
  Metal: 'element-metal', Метал: 'element-metal', Металл: 'element-metal',
}

const AUSPICIOUS_RANK_COLOR = ['text-amber-400', 'text-lime-400', 'text-sky-400', 'text-zinc-300']
const AUSPICIOUS_BORDER    = ['border-amber-500/30', 'border-lime-500/30', 'border-sky-500/30', 'border-zinc-600/40']
const AUSPICIOUS_BG        = ['bg-amber-500/5', 'bg-lime-500/5', 'bg-sky-500/5', 'bg-zinc-800/30']

function compassColor(energy: EnergyType, auspicious: boolean): string {
  if (!auspicious) return 'bg-zinc-900 border-zinc-700/50 text-zinc-500'
  const map: Partial<Record<EnergyType, string>> = {
    shengqi:  'bg-amber-500/15 border-amber-500/40 text-amber-300',
    tianyi:   'bg-lime-500/10  border-lime-500/30  text-lime-300',
    yannian:  'bg-sky-500/10   border-sky-500/30   text-sky-300',
    fuwei:    'bg-zinc-700/40  border-zinc-500/40  text-zinc-200',
  }
  return map[energy] ?? 'bg-zinc-800 border-zinc-600 text-zinc-300'
}

// ─── Compass rose component ───────────────────────────────────────────────────

function CompassRose({ directions }: { directions: DirectionEnergy[] }) {
  const byDir: Record<string, DirectionEnergy> = {}
  for (const d of directions) byDir[d.direction] = d

  return (
    <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs mx-auto my-4">
      {(['NW','N','NE','W',null,'E','SW','S','SE'] as (Direction | null)[]).map((dir) => {
        if (!dir) {
          // Center cell
          return (
            <div key="center" className="aspect-square rounded-xl bg-zinc-800/60 border border-zinc-700/40 flex items-center justify-center">
              <span className="text-zinc-500 text-xs font-medium">☯</span>
            </div>
          )
        }
        const d = byDir[dir]
        if (!d) return <div key={dir} className="aspect-square" />
        const label = ENERGY_LABELS[d.energy]
        return (
          <div
            key={dir}
            className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 transition-all ${compassColor(d.energy, d.auspicious)}`}
          >
            <span className="text-[10px] font-bold leading-none">{dir}</span>
            <span className="text-sm leading-none">{DIRECTION_SYMBOLS[dir]}</span>
            <span className="text-[8px] leading-none opacity-70 text-center">{label.chinese}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Direction card ───────────────────────────────────────────────────────────

function DirectionCard({ d, rank, lang }: { d: DirectionEnergy; rank: number; lang: Language }) {
  const label = ENERGY_LABELS[d.energy]
  const isAusp = d.auspicious

  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
      isAusp
        ? `${AUSPICIOUS_BG[rank]} ${AUSPICIOUS_BORDER[rank]}`
        : 'bg-zinc-900/50 border-zinc-800/60'
    }`}>
      {/* Direction badge */}
      <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center ${
        isAusp ? `${AUSPICIOUS_BG[rank]} border ${AUSPICIOUS_BORDER[rank]}` : 'bg-zinc-800 border border-zinc-700'
      }`}>
        <span className="text-xs font-bold leading-none">{d.direction}</span>
        <span className="text-base leading-none mt-0.5">{DIRECTION_SYMBOLS[d.direction]}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-semibold ${isAusp ? AUSPICIOUS_RANK_COLOR[rank] : 'text-zinc-500'}`}>
            {label.name[lang]}
          </span>
          <span className="text-xs text-zinc-600">{label.chinese}</span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{label.desc[lang]}</p>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile
  lang: Language
}

export default function FengShui({ profile, lang }: Props) {
  const result = useMemo(
    () => getKuaResult(profile.birthYear, profile.gender, lang),
    [profile.birthYear, profile.gender, lang],
  )

  const elemKey = Object.keys(ELEMENT_COLOR).find(k =>
    k === result.element[lang]
  )
  const elemColorClass = elemKey ? ELEMENT_COLOR[elemKey] : 'text-zinc-300'

  const auspicious   = result.directions.filter(d => d.auspicious)
  const inauspicious = result.directions.filter(d => !d.auspicious)

  const bestDir = auspicious[0]

  const groupLabel = GROUP_LABELS[result.group][lang]
  const groupMates = result.group === 'east' ? '1, 3, 4, 9' : '2, 6, 7, 8'

  const sectionLucky   = lang === 'bg' ? 'Благоприятни посоки' : lang === 'ru' ? 'Благоприятные направления' : 'Lucky Directions'
  const sectionUnlucky = lang === 'bg' ? 'Неблагоприятни посоки' : lang === 'ru' ? 'Неблагоприятные направления' : 'Unlucky Directions'
  const compassTitle   = lang === 'bg' ? 'Компас' : lang === 'ru' ? 'Компас' : 'Compass'
  const tipText = lang === 'bg'
    ? `Спи или работи с глава към ${bestDir.direction} — най-силната ти посока (${ENERGY_LABELS.shengqi.name[lang]}).`
    : lang === 'ru'
    ? `Спи или работай головой к ${bestDir.direction} — твоё сильнейшее направление (${ENERGY_LABELS.shengqi.name[lang]}).`
    : `Sleep or work facing ${bestDir.direction} — your strongest direction (${ENERGY_LABELS.shengqi.name[lang]}).`

  return (
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6 pt-8 md:pt-0">
        <h2 className="text-lg font-semibold text-zinc-100">
          {lang === 'bg' ? '🧭 Фън Шуй' : lang === 'ru' ? '🧭 Фэн Шуй' : '🧭 Feng Shui'}
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">
          {lang === 'bg' ? 'Куа номер и 8 мансиони' : lang === 'ru' ? 'Куа номер и 8 дворцов' : 'Kua number & 8 Mansions'}
        </p>
      </div>

      {/* Kua number card */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-5">
          {/* Big Kua number */}
          <div className="shrink-0 w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-5xl font-bold text-amber-400 leading-none">{result.kua}</span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
              {lang === 'bg' ? 'Куа номер' : lang === 'ru' ? 'Куа номер' : 'Kua Number'}
            </p>
            <p className={`text-2xl font-semibold ${elemColorClass}`}>{result.element[lang]}</p>
            <p className="text-sm text-zinc-400 mt-1">{groupLabel}</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {lang === 'bg' ? `Куа ${groupMates}` : lang === 'ru' ? `Куа ${groupMates}` : `Kua ${groupMates}`}
            </p>
          </div>
        </div>

        {/* Quick tip */}
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <p className="text-xs text-amber-300 leading-snug">💡 {tipText}</p>
        </div>
      </div>

      {/* Compass rose */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{compassTitle}</h3>
        <CompassRose directions={result.directions} />
        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {auspicious.slice(0, 3).map((d, i) => (
            <span key={d.energy} className={`text-xs flex items-center gap-1 ${AUSPICIOUS_RANK_COLOR[i]}`}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'currentColor' }} />
              {ENERGY_LABELS[d.energy].name[lang]}
            </span>
          ))}
          <span className="text-xs flex items-center gap-1 text-zinc-500">
            <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
            {lang === 'bg' ? 'Неблагоприятно' : lang === 'ru' ? 'Неблагоприятно' : 'Inauspicious'}
          </span>
        </div>
      </section>

      {/* Lucky directions */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{sectionLucky}</h3>
        <div className="space-y-2">
          {auspicious.map((d, i) => (
            <DirectionCard key={d.direction} d={d} rank={i} lang={lang} />
          ))}
        </div>
      </section>

      {/* Unlucky directions */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{sectionUnlucky}</h3>
        <div className="space-y-2">
          {inauspicious.map((d, i) => (
            <DirectionCard key={d.direction} d={d} rank={i} lang={lang} />
          ))}
        </div>
      </section>

      {/* Note */}
      <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
        {lang === 'bg'
          ? 'Системата 8 Мансиони (八宅) е базирана на годината на раждане и пола. Куа 5 се свежда до 2 (мъже) / 8 (жени).'
          : lang === 'ru'
          ? 'Система 8 дворцов (八宅) основана на годе рождения и поле. Куа 5 приводится к 2 (мужчины) / 8 (женщины).'
          : '8 Mansions (八宅) is based on birth year and gender. Kua 5 resolves to 2 (males) / 8 (females).'}
      </p>
    </div>
  )
}
