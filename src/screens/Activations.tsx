import { useMemo } from 'react'
import { calculateChart, calculateTodayPillars } from '../engine/baziCalculator'
import {
  computeActivations,
  ACTIVATION_LABELS,
  ACTIVATION_DESCRIPTIONS,
  type Activation,
  type IncomingSource,
} from '../engine/activations'
import { STEMS, BRANCHES } from '../engine/translations'
import type { Language, UserProfile } from '../engine/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const ZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

function yearGanZhi(year: number): [string, string] {
  return [
    GAN[((year - 4) % 10 + 10) % 10],
    ZHI[((year - 4) % 12 + 12) % 12],
  ]
}

function elementKeyForChar(char: string, type: 'gan' | 'zhi'): string {
  if (type === 'gan') return STEMS[char]?.elementKey ?? 'earth'
  return BRANCHES[char]?.elementKey ?? 'earth'
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'border-lime-800/60 bg-lime-950/30',
  negative: 'border-red-900/60 bg-red-950/20',
  mixed:    'border-amber-800/60 bg-amber-950/20',
}
const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-lime-400',
  negative: 'bg-red-400',
  mixed:    'bg-amber-400',
}
const SENTIMENT_ICON: Record<string, string> = {
  positive: '✦',
  negative: '⚠',
  mixed:    '⚡',
}

const PILLAR_LABEL: Record<string, Record<Language, string>> = {
  year:  { bg: 'Год.',    ru: 'Год',    en: 'Year'  },
  month: { bg: 'Мес.',   ru: 'Мес.',   en: 'Month' },
  day:   { bg: 'Ден',    ru: 'День',   en: 'Day'   },
  hour:  { bg: 'Час',    ru: 'Час',    en: 'Hour'  },
}

const SOURCE_LABEL: Record<IncomingSource, Record<Language, string>> = {
  annual_year:  { bg: 'Годишен стълб',    ru: 'Годовой столп',    en: 'Annual Pillar'   },
  annual_month: { bg: 'Месечен стълб',    ru: 'Месячный столп',   en: 'Monthly Pillar'  },
  luck_cycle:   { bg: 'Цикъл на удача',   ru: 'Цикл удачи',       en: 'Luck Cycle'      },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function IncomingPillarChip({ gan, zhi, label }: { gan: string; zhi: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
      <span className={`chinese text-lg element-${elementKeyForChar(gan, 'gan')} leading-none font-semibold`}>{gan}</span>
      <span className={`chinese text-lg element-${elementKeyForChar(zhi, 'zhi')} leading-none font-semibold`}>{zhi}</span>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  )
}

function ActivationCard({ activation, lang }: { activation: Activation; lang: Language }) {
  const natalCharType = activation.charType
  const incomingCharType = activation.charType
  const natalElemKey = elementKeyForChar(activation.natalChar, natalCharType)
  const incomingElemKey = elementKeyForChar(activation.incomingChar, incomingCharType)
  const label = ACTIVATION_LABELS[activation.type][lang]
  const desc  = ACTIVATION_DESCRIPTIONS[activation.type][lang]
  const pillarLabel = PILLAR_LABEL[activation.natalPillarKey]?.[lang] ?? activation.natalPillarKey

  return (
    <div className={`rounded-xl border px-4 py-3 ${SENTIMENT_COLORS[activation.sentiment]}`}>
      <div className="flex items-start gap-3">
        {/* Sentiment icon */}
        <span className="text-base mt-0.5 opacity-80">{SENTIMENT_ICON[activation.sentiment]}</span>

        <div className="flex-1 min-w-0">
          {/* Characters */}
          <div className="flex items-center gap-2 mb-1.5">
            {/* Natal char + pillar badge */}
            <div className="flex items-center gap-1.5">
              <span className={`chinese text-2xl element-${natalElemKey} leading-none font-semibold`}>
                {activation.natalChar}
              </span>
              <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1 py-0.5 leading-none">
                {pillarLabel}
              </span>
            </div>

            <span className="text-zinc-600 text-sm">↔</span>

            {/* Incoming char */}
            <span className={`chinese text-2xl element-${incomingElemKey} leading-none font-semibold`}>
              {activation.incomingChar}
            </span>

            {/* Result element badge for combinations/harmonies */}
            {activation.resultElement && (
              <span className="text-xs text-zinc-300 bg-zinc-800 rounded px-1.5 py-0.5 ml-1">
                → {activation.resultElement}
              </span>
            )}
          </div>

          {/* Type label */}
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${SENTIMENT_DOT[activation.sentiment]} shrink-0`} />
            <span className="text-xs font-semibold text-zinc-200">{label}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-500 leading-snug">{desc}</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, gan, zhi }: { title: string; gan: string; zhi: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <h3 className="text-xs uppercase tracking-wider text-zinc-500 whitespace-nowrap">{title}</h3>
      <IncomingPillarChip gan={gan} zhi={zhi} label="" />
    </div>
  )
}

function EmptyState({ lang }: { lang: Language }) {
  const msg = lang === 'bg'
    ? 'Няма активни взаимодействия от този стълб'
    : lang === 'ru'
    ? 'Нет активных взаимодействий от этого столпа'
    : 'No active interactions from this pillar'
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-600 text-center">
      {msg}
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Props {
  profile: UserProfile
  lang: Language
}

export default function Activations({ profile, lang }: Props) {
  const chart = useMemo(() =>
    calculateChart(
      profile.birthYear, profile.birthMonth, profile.birthDay,
      profile.birthHour ?? null, profile.birthMinute ?? null,
      profile.gender, lang,
      profile.birthLongitude, profile.birthUtcOffset,
    ),
    [profile, lang],
  )

  const today = useMemo(() => calculateTodayPillars(lang), [lang])

  const now = new Date()
  const currentYear = now.getFullYear()
  const [yearGan, yearZhi] = yearGanZhi(currentYear)

  // Find active luck cycle
  const activeCycle = chart.luckCycles.find(
    c => currentYear >= c.startYear && currentYear <= c.endYear,
  ) ?? null

  const allActivations = useMemo(() =>
    computeActivations(
      chart,
      yearGan, yearZhi,
      today.month.gan, today.month.zhi,
      activeCycle?.gan ?? null, activeCycle?.zhi ?? null,
      lang,
    ),
    [chart, yearGan, yearZhi, today, activeCycle, lang],
  )

  const bySource = (source: IncomingSource) =>
    allActivations.filter(a => a.incomingSource === source)

  const annualActivations  = bySource('annual_year')
  const monthlyActivations = bySource('annual_month')
  const luckActivations    = bySource('luck_cycle')

  const positiveCount = allActivations.filter(a => a.sentiment === 'positive').length
  const negativeCount = allActivations.filter(a => a.sentiment === 'negative').length

  const headerMsg = lang === 'bg'
    ? `${positiveCount} благоприятни · ${negativeCount} предизвикателства`
    : lang === 'ru'
    ? `${positiveCount} благоприятных · ${negativeCount} вызовов`
    : `${positiveCount} favourable · ${negativeCount} challenges`

  const annualTitle = lang === 'bg' ? 'Годишни активации' : lang === 'ru' ? 'Годовые активации' : 'Annual Activations'
  const monthlyTitle = lang === 'bg' ? 'Месечни активации' : lang === 'ru' ? 'Месячные активации' : 'Monthly Activations'
  const luckTitle = lang === 'bg' ? 'Цикъл на удача' : lang === 'ru' ? 'Цикл удачи' : 'Luck Cycle'

  const explainerMsg = lang === 'bg'
    ? 'Активациите показват кои части от твоята карта са задействани от текущата годишна, месечна и цикличната енергия. Сблъсъците не са задължително лоши — те носят промяна.'
    : lang === 'ru'
    ? 'Активации показывают, какие части вашей карты задействованы текущей годовой, месячной и цикличной энергией. Столкновения не всегда плохи — они приносят перемены.'
    : 'Activations show which parts of your chart are triggered by current annual, monthly, and cycle energy. Clashes are not necessarily bad — they bring change.'

  return (
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 pt-8 md:pt-0">
        <h2 className="text-lg font-semibold text-zinc-100">
          {lang === 'bg' ? '⚡ Активации' : lang === 'ru' ? '⚡ Активации' : '⚡ Activations'}
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">{headerMsg}</p>
      </div>

      {/* Legend */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-500 leading-relaxed">
        {explainerMsg}
        <div className="flex gap-4 mt-2 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />
            {lang === 'bg' ? 'Благоприятно' : lang === 'ru' ? 'Благоприятно' : 'Favourable'}
          </span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            {lang === 'bg' ? 'Смесено / Промяна' : lang === 'ru' ? 'Смешанное / Перемены' : 'Mixed / Change'}
          </span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {lang === 'bg' ? 'Предизвикателство' : lang === 'ru' ? 'Вызов' : 'Challenge'}
          </span>
        </div>
      </div>

      {/* ── Annual activations ── */}
      <section className="mb-6">
        <SectionHeader title={annualTitle} gan={yearGan} zhi={yearZhi} />
        {annualActivations.length === 0
          ? <EmptyState lang={lang} />
          : <div className="space-y-2">
              {annualActivations.map((a, i) => (
                <ActivationCard key={i} activation={a} lang={lang} />
              ))}
            </div>
        }
      </section>

      {/* ── Monthly activations ── */}
      <section className="mb-6">
        <SectionHeader title={monthlyTitle} gan={today.month.gan} zhi={today.month.zhi} />
        {monthlyActivations.length === 0
          ? <EmptyState lang={lang} />
          : <div className="space-y-2">
              {monthlyActivations.map((a, i) => (
                <ActivationCard key={i} activation={a} lang={lang} />
              ))}
            </div>
        }
      </section>

      {/* ── Luck cycle activations ── */}
      {activeCycle && (
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 whitespace-nowrap">{luckTitle}</h3>
            <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
              <span className={`chinese text-lg element-${elementKeyForChar(activeCycle.gan, 'gan')} leading-none font-semibold`}>{activeCycle.gan}</span>
              <span className={`chinese text-lg element-${elementKeyForChar(activeCycle.zhi, 'zhi')} leading-none font-semibold`}>{activeCycle.zhi}</span>
              <span className="text-xs text-zinc-400">{activeCycle.startYear}–{activeCycle.endYear}</span>
            </div>
          </div>
          {luckActivations.length === 0
            ? <EmptyState lang={lang} />
            : <div className="space-y-2">
                {luckActivations.map((a, i) => (
                  <ActivationCard key={i} activation={a} lang={lang} />
                ))}
              </div>
          }
        </section>
      )}

      {/* ── Chart pillars reference ── */}
      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? 'Твоята карта' : lang === 'ru' ? 'Ваша карта' : 'Your Chart'}
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: 'hour',  pillar: chart.hour,  label: PILLAR_LABEL.hour[lang]  },
            { key: 'day',   pillar: chart.day,   label: PILLAR_LABEL.day[lang]   },
            { key: 'month', pillar: chart.month, label: PILLAR_LABEL.month[lang] },
            { key: 'year',  pillar: chart.year,  label: PILLAR_LABEL.year[lang]  },
          ].map(({ key, pillar, label }) => (
            <div
              key={key}
              className="flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 p-2"
            >
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{label}</span>
              {pillar
                ? <>
                    <span className={`chinese text-2xl element-${elementKeyForChar(pillar.gan, 'gan')} leading-none font-semibold`}>{pillar.gan}</span>
                    <span className={`chinese text-2xl element-${elementKeyForChar(pillar.zhi, 'zhi')} leading-none`}>{pillar.zhi}</span>
                  </>
                : <span className="text-zinc-600 text-xl">—</span>
              }
            </div>
          ))}
        </div>
      </section>

      {/* Source legend */}
      <div className="mt-2 rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3">
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          {Object.entries(SOURCE_LABEL).map(([k, v]) => (
            <span key={k} className="mr-3">
              <span className="text-zinc-500 font-medium">{v[lang]}</span>
              {' — '}
              {k === 'annual_year'
                ? (lang === 'bg' ? 'активации за цялата година' : lang === 'ru' ? 'активации на весь год' : 'active all year')
                : k === 'annual_month'
                ? (lang === 'bg' ? 'активни този месец' : lang === 'ru' ? 'активны в этом месяце' : 'active this month')
                : (lang === 'bg' ? 'фоново влияние (10 год.)' : lang === 'ru' ? 'фоновое влияние (10 лет)' : 'background influence (10yr)')}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
