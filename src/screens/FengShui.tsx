import { useMemo, useState } from 'react'
import {
  getKuaResult,
  ENERGY_LABELS,
  DIRECTION_SYMBOLS,
  GROUP_LABELS,
  type Direction,
  type EnergyType,
  type DirectionEnergy,
} from '../engine/kua'
import {
  getAnnualChart,
  STAR_INFO,
  STAR_COLORS,
  CATEGORY_ICON,
  SECTOR_LABEL,
  type Sector,
  type StarNumber,
  type SectorStar,
} from '../engine/flyingStars'
import type { Language, UserProfile } from '../engine/types'

// ─── Shared helpers ────────────────────────────────────────────────────────────

const ELEMENT_COLOR: Record<string, string> = {
  Water: 'element-water', Вода: 'element-water',
  Wood:  'element-wood',  Дърво: 'element-wood',  Дерево: 'element-wood',
  Fire:  'element-fire',  Огън: 'element-fire',   Огонь: 'element-fire',
  Earth: 'element-earth', Земя: 'element-earth',  Земля: 'element-earth',
  Metal: 'element-metal', Метал: 'element-metal', Металл: 'element-metal',
}

// ─── Kua section helpers ───────────────────────────────────────────────────────

const AUSPICIOUS_RANK_COLOR = ['text-amber-400', 'text-lime-400', 'text-sky-400', 'text-zinc-300']
const AUSPICIOUS_BORDER    = ['border-amber-500/30', 'border-lime-500/30', 'border-sky-500/30', 'border-zinc-600/40']
const AUSPICIOUS_BG        = ['bg-amber-500/5', 'bg-lime-500/5', 'bg-sky-500/5', 'bg-zinc-800/30']

function compassColor(energy: EnergyType, auspicious: boolean): string {
  if (!auspicious) return 'bg-zinc-900 border-zinc-700/50 text-zinc-500'
  const map: Partial<Record<EnergyType, string>> = {
    shengqi: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
    tianyi:  'bg-lime-500/10  border-lime-500/30  text-lime-300',
    yannian: 'bg-sky-500/10   border-sky-500/30   text-sky-300',
    fuwei:   'bg-zinc-700/40  border-zinc-500/40  text-zinc-200',
  }
  return map[energy] ?? 'bg-zinc-800 border-zinc-600 text-zinc-300'
}

function CompassRose({ directions }: { directions: DirectionEnergy[] }) {
  const byDir: Record<string, DirectionEnergy> = {}
  for (const d of directions) byDir[d.direction] = d

  return (
    <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs mx-auto my-4">
      {(['NW','N','NE','W',null,'E','SW','S','SE'] as (Direction | null)[]).map((dir) => {
        if (!dir) {
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
          <div key={dir} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 ${compassColor(d.energy, d.auspicious)}`}>
            <span className="text-[10px] font-bold leading-none">{dir}</span>
            <span className="text-sm leading-none">{DIRECTION_SYMBOLS[dir]}</span>
            <span className="text-[8px] leading-none opacity-70 text-center">{label.chinese}</span>
          </div>
        )
      })}
    </div>
  )
}

function DirectionCard({ d, rank, lang }: { d: DirectionEnergy; rank: number; lang: Language }) {
  const label = ENERGY_LABELS[d.energy]
  const isAusp = d.auspicious
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${isAusp ? `${AUSPICIOUS_BG[rank]} ${AUSPICIOUS_BORDER[rank]}` : 'bg-zinc-900/50 border-zinc-800/60'}`}>
      <div className={`shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isAusp ? `${AUSPICIOUS_BG[rank]} border ${AUSPICIOUS_BORDER[rank]}` : 'bg-zinc-800 border border-zinc-700'}`}>
        <span className="text-xs font-bold leading-none">{d.direction}</span>
        <span className="text-base leading-none mt-0.5">{DIRECTION_SYMBOLS[d.direction]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-semibold ${isAusp ? AUSPICIOUS_RANK_COLOR[rank] : 'text-zinc-500'}`}>{label.name[lang]}</span>
          <span className="text-xs text-zinc-600">{label.chinese}</span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{label.desc[lang]}</p>
      </div>
    </div>
  )
}

// ─── Flying Stars section helpers ─────────────────────────────────────────────

// Grid order: NW N NE / W CTR E / SW S SE
const GRID_ORDER: Sector[] = ['NW','N','NE','W','CENTER','E','SW','S','SE']

function starGridColor(star: StarNumber, category: string): string {
  if (category === 'dangerous') {
    return star === 5
      ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
      : 'bg-zinc-800/60 border-zinc-700/40 text-zinc-400'
  }
  const c = STAR_COLORS[star]
  return `${c.bg} border ${c.border} ${c.text}`
}

function StarGrid({ sectors, lang }: { sectors: SectorStar[]; lang: Language }) {
  const byDir: Record<string, SectorStar> = {}
  for (const s of sectors) byDir[s.sector] = s

  return (
    <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs mx-auto my-4">
      {GRID_ORDER.map(sector => {
        const s = byDir[sector]
        if (!s) return <div key={sector} className="aspect-square" />
        const info = STAR_INFO[s.star]
        const colorClass = starGridColor(s.star, s.category)
        return (
          <div key={sector} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 ${colorClass}`}>
            <span className="text-[10px] font-bold leading-none opacity-70">{SECTOR_LABEL[sector][lang]}</span>
            <span className="text-2xl font-bold leading-none">{s.star}</span>
            <span className="text-[8px] leading-none opacity-60">{info.chinese}</span>
          </div>
        )
      })}
    </div>
  )
}

function StarCard({ s, lang }: { s: SectorStar; lang: Language }) {
  const info = STAR_INFO[s.star]
  const c = STAR_COLORS[s.star]
  const isDangerous = s.category === 'dangerous'

  return (
    <div className={`rounded-xl border px-4 py-3 ${c.bg} ${c.border}`}>
      <div className="flex items-start gap-3">
        {/* Star badge */}
        <div className={`shrink-0 w-12 h-12 rounded-xl border ${c.border} ${c.bg} flex flex-col items-center justify-center`}>
          <span className={`text-2xl font-bold leading-none ${c.text}`}>{s.star}</span>
          <span className="text-[9px] text-zinc-500 leading-none mt-0.5">{info.chinese}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-sm font-semibold ${c.text}`}>{info.name[lang]}</span>
            <span className="text-xs text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5 leading-none">
              {SECTOR_LABEL[s.sector][lang]}
            </span>
            <span className="text-xs">{CATEGORY_ICON[s.category]}</span>
          </div>
          {/* Element */}
          <p className="text-xs text-zinc-500 mb-1">{info.element[lang]}</p>
          {/* Meaning */}
          <p className="text-xs text-zinc-400 leading-snug mb-1">{info.meaning[lang]}</p>
          {/* Advice */}
          <p className={`text-xs leading-snug ${isDangerous ? 'text-yellow-400/80' : 'text-zinc-500'}`}>
            {isDangerous ? '⚠ ' : '💡 '}{info.advice[lang]}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Kua Section ──────────────────────────────────────────────────────────────

function KuaSection({ profile, lang }: { profile: UserProfile; lang: Language }) {
  const result = useMemo(
    () => getKuaResult(profile.birthYear, profile.gender, lang),
    [profile.birthYear, profile.gender, lang],
  )

  const elemKey = Object.keys(ELEMENT_COLOR).find(k => k === result.element[lang])
  const elemColorClass = elemKey ? ELEMENT_COLOR[elemKey] : 'text-zinc-300'
  const auspicious   = result.directions.filter(d => d.auspicious)
  const inauspicious = result.directions.filter(d => !d.auspicious)
  const bestDir = auspicious[0]
  const groupLabel = GROUP_LABELS[result.group][lang]
  const groupMates = result.group === 'east' ? '1, 3, 4, 9' : '2, 6, 7, 8'
  const tipText = lang === 'bg'
    ? `Спи или работи с глава към ${bestDir.direction} — най-силната ти посока (${ENERGY_LABELS.shengqi.name[lang]}).`
    : lang === 'ru'
    ? `Спи или работай головой к ${bestDir.direction} — твоё сильнейшее направление (${ENERGY_LABELS.shengqi.name[lang]}).`
    : `Sleep or work facing ${bestDir.direction} — your strongest direction (${ENERGY_LABELS.shengqi.name[lang]}).`

  return (
    <>
      {/* Kua number card */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-center gap-5">
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
        <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <p className="text-xs text-amber-300 leading-snug">💡 {tipText}</p>
        </div>
      </div>

      {/* Compass */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          {lang === 'bg' ? 'Компас' : lang === 'ru' ? 'Компас' : 'Compass'}
        </h3>
        <CompassRose directions={result.directions} />
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

      {/* Lucky */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? 'Благоприятни посоки' : lang === 'ru' ? 'Благоприятные направления' : 'Lucky Directions'}
        </h3>
        <div className="space-y-2">
          {auspicious.map((d, i) => <DirectionCard key={d.direction} d={d} rank={i} lang={lang} />)}
        </div>
      </section>

      {/* Unlucky */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? 'Неблагоприятни посоки' : lang === 'ru' ? 'Неблагоприятные направления' : 'Unlucky Directions'}
        </h3>
        <div className="space-y-2">
          {inauspicious.map((d, i) => <DirectionCard key={d.direction} d={d} rank={i} lang={lang} />)}
        </div>
      </section>

      <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
        {lang === 'bg'
          ? 'Системата 8 Мансиони (八宅) е базирана на годината на раждане и пола. Куа 5 се свежда до 2 (мъже) / 8 (жени).'
          : lang === 'ru'
          ? 'Система 8 дворцов (八宅) основана на годе рождения и поле. Куа 5 приводится к 2 (мужчины) / 8 (женщины).'
          : '8 Mansions (八宅) is based on birth year and gender. Kua 5 resolves to 2 (males) / 8 (females).'}
      </p>
    </>
  )
}

// ─── Annual Flying Stars Section ──────────────────────────────────────────────

function AnnualStarsSection({ lang }: { lang: Language }) {
  const chart = useMemo(() => getAnnualChart(new Date()), [])

  // Separate into auspicious and warning groups for display
  const warningSectors    = chart.sectors.filter(s => s.category === 'dangerous')
  const auspiciousSectors = chart.sectors.filter(s => s.category === 'auspicious')
  const cautionSectors    = chart.sectors.filter(s => s.category === 'inauspicious' || (s.category === 'neutral'))

  const centerInfo = STAR_INFO[chart.centerStar]
  const centerColors = STAR_COLORS[chart.centerStar]

  const periodNote = lang === 'bg'
    ? 'Период 9 (2024–2043): Звезда 9 (紫九) е най-благоприятна. Звезда 1 расте в сила.'
    : lang === 'ru'
    ? 'Период 9 (2024–2043): Звезда 9 (紫九) наиболее благоприятна. Звезда 1 набирает силу.'
    : 'Period 9 (2024–2043): Star 9 (紫九) is most auspicious. Star 1 is rising in power.'

  return (
    <>
      {/* Annual center star */}
      <div className={`mb-6 rounded-xl border p-5 ${centerColors.bg} ${centerColors.border}`}>
        <div className="flex items-center gap-5">
          <div className={`shrink-0 w-20 h-20 rounded-2xl border ${centerColors.border} ${centerColors.bg} flex flex-col items-center justify-center`}>
            <span className={`text-5xl font-bold leading-none ${centerColors.text}`}>{chart.centerStar}</span>
            <span className="text-[10px] text-zinc-500 mt-1">{centerInfo.chinese}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
              {lang === 'bg' ? `Годишна звезда ${chart.year}` : lang === 'ru' ? `Годовая звезда ${chart.year}` : `Annual Star ${chart.year}`}
            </p>
            <p className={`text-xl font-semibold ${centerColors.text}`}>{centerInfo.name[lang]}</p>
            <p className="text-sm text-zinc-400 mt-1">{centerInfo.element[lang]}</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-snug max-w-xs">{centerInfo.meaning[lang]}</p>
          </div>
        </div>
      </div>

      {/* Lo Shu grid */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          {lang === 'bg' ? `Лo Шу ${chart.year}` : lang === 'ru' ? `Ло Шу ${chart.year}` : `Lo Shu ${chart.year}`}
        </h3>
        <StarGrid sectors={chart.sectors} lang={lang} />
        <p className="text-[11px] text-zinc-600 text-center mt-1">{periodNote}</p>
      </section>

      {/* Warning sectors */}
      {warningSectors.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            {lang === 'bg' ? '⚠ Опасни сектори' : lang === 'ru' ? '⚠ Опасные секторы' : '⚠ Danger Sectors'}
          </h3>
          <div className="space-y-2">
            {warningSectors.map(s => <StarCard key={s.sector} s={s} lang={lang} />)}
          </div>
        </section>
      )}

      {/* Auspicious sectors */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? '✦ Благоприятни сектори' : lang === 'ru' ? '✦ Благоприятные секторы' : '✦ Auspicious Sectors'}
        </h3>
        <div className="space-y-2">
          {auspiciousSectors.map(s => <StarCard key={s.sector} s={s} lang={lang} />)}
        </div>
      </section>

      {/* Caution sectors */}
      {cautionSectors.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
            {lang === 'bg' ? '▲ Внимание' : lang === 'ru' ? '▲ Осторожно' : '▲ Caution'}
          </h3>
          <div className="space-y-2">
            {cautionSectors.map(s => <StarCard key={s.sector} s={s} lang={lang} />)}
          </div>
        </section>
      )}

      <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
        {lang === 'bg'
          ? 'Летящите звезди се сменят на Ли Чун (立春, ~4 февруари). Приложи картата към твоя дом/офис според ориентацията на стаите.'
          : lang === 'ru'
          ? 'Летящие звёзды меняются на Ли Чунь (立春, ~4 февраля). Применяй карту к своему дому/офису по ориентации комнат.'
          : 'Flying Stars change on Li Chun (立春, ~Feb 4). Apply this map to your home/office according to room orientation.'}
      </p>
    </>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Section = 'kua' | 'annual'

interface Props {
  profile: UserProfile
  lang: Language
}

export default function FengShui({ profile, lang }: Props) {
  const [section, setSection] = useState<Section>('kua')

  const sectionTabs: { id: Section; label: Record<Language, string> }[] = [
    { id: 'kua',    label: { bg: 'Куа / 8 Мансиони', ru: 'Куа / 8 дворцов', en: 'Kua / 8 Mansions' } },
    { id: 'annual', label: { bg: 'Годишни звезди',   ru: 'Годовые звёзды',  en: 'Annual Stars'      } },
  ]

  return (
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-5 pt-8 md:pt-0">
        <h2 className="text-lg font-semibold text-zinc-100">
          {lang === 'bg' ? '🧭 Фън Шуй' : lang === 'ru' ? '🧭 Фэн Шуй' : '🧭 Feng Shui'}
        </h2>
      </div>

      {/* Section switcher */}
      <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {sectionTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              section === tab.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label[lang]}
          </button>
        ))}
      </div>

      {section === 'kua'    && <KuaSection profile={profile} lang={lang} />}
      {section === 'annual' && <AnnualStarsSection lang={lang} />}
    </div>
  )
}
