import { useMemo, useState } from 'react'
import {
  generateQmdjChart,
  GATE_INFO,
  STAR_INFO_QMDJ,
  DEITY_INFO,
  GATE_COLORS,
  PALACE_DIR,
  POLARITY_LABEL,
  type PalaceData,
  type Palace,
} from '../engine/qmdj'
import type { Language } from '../engine/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIR_SYMBOL: Record<string, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖', CENTER: '·',
}

// Lo Shu to grid position mapping:
// NW=6→pos0, N=1→pos1, NE=8→pos2
// W=7→pos3,  CTR=5→pos4, E=3→pos5
// SW=2→pos6, S=9→pos7, SE=4→pos8
// So grid order by palace: 6,1,8,7,5,3,2,9,4
const GRID_PALACE_ORDER: Palace[] = [6, 1, 8, 7, 5, 3, 2, 9, 4]

type Layer = 'all' | 'gates' | 'stars' | 'deities'

function categoryColor(cat: string) {
  return GATE_COLORS[cat as keyof typeof GATE_COLORS] ?? GATE_COLORS.neutral
}

// ─── Palace Grid Cell ─────────────────────────────────────────────────────────

function PalaceCell({ p, layer, onClick, isSelected }: {
  p: PalaceData
  layer: Layer
  onClick: () => void
  isSelected: boolean
}) {
  const gate  = GATE_INFO[p.gate]
  const star  = STAR_INFO_QMDJ[p.star]
  const deity = DEITY_INFO[p.deity]
  const dir   = PALACE_DIR[p.palace]
  const c     = categoryColor(gate.category)

  return (
    <button
      onClick={onClick}
      className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 px-1 transition-all text-center
        ${isSelected ? 'ring-2 ring-amber-400/60' : ''}
        ${c.bg} ${c.border}`}
    >
      <span className="text-[9px] text-zinc-500 leading-none">{dir} {DIR_SYMBOL[dir]}</span>

      {(layer === 'all' || layer === 'gates') && (
        <span className={`text-base font-bold leading-none ${c.text}`}>{gate.chinese}</span>
      )}
      {(layer === 'all' || layer === 'stars') && (
        <span className="text-[9px] text-zinc-400 leading-none">{star.chinese}</span>
      )}
      {(layer === 'all' || layer === 'deities') && (
        <span className="text-[9px] text-zinc-500 leading-none">{deity.chinese}</span>
      )}
      <span className="text-[8px] text-zinc-600 leading-none">{p.palace}</span>
    </button>
  )
}

// ─── Palace Detail Card ───────────────────────────────────────────────────────

function PalaceDetail({ p, lang }: { p: PalaceData; lang: Language }) {
  const gate  = GATE_INFO[p.gate]
  const star  = STAR_INFO_QMDJ[p.star]
  const deity = DEITY_INFO[p.deity]
  const dir   = PALACE_DIR[p.palace]
  const gc    = categoryColor(gate.category)
  const sc    = categoryColor(star.category)
  const dc    = categoryColor(deity.category)

  const dirLabel = { bg: { N:'С', NE:'СИ', E:'И', SE:'ЮИ', S:'Ю', SW:'ЮЗ', W:'З', NW:'СЗ', CENTER:'Ц' },
                     ru: { N:'С', NE:'СВ', E:'В', SE:'ЮВ', S:'Ю', SW:'ЮЗ', W:'З', NW:'СЗ', CENTER:'Ц' },
                     en: { N:'N', NE:'NE', E:'E', SE:'SE', S:'S', SW:'SW', W:'W', NW:'NW', CENTER:'CTR' } }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-zinc-500">
          {lang === 'bg' ? 'Дворец' : lang === 'ru' ? 'Дворец' : 'Palace'} {p.palace}
        </span>
        <span className="text-xs font-bold text-zinc-300">{dirLabel[lang][dir]} {DIR_SYMBOL[dir]}</span>
        <span className="text-xs text-zinc-600">天干: {p.stem}</span>
      </div>

      {/* Gate */}
      <div className={`rounded-lg border px-3 py-2.5 mb-2 ${gc.bg} ${gc.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-lg font-bold leading-none ${gc.text}`}>{gate.chinese}</span>
          <span className={`text-sm font-semibold ${gc.text}`}>{gate.name[lang]}</span>
          <span className="text-xs text-zinc-600">
            {lang === 'bg' ? 'Врата' : lang === 'ru' ? 'Врата' : 'Gate'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{gate.meaning[lang]}</p>
      </div>

      {/* Star */}
      <div className={`rounded-lg border px-3 py-2.5 mb-2 ${sc.bg} ${sc.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-lg font-bold leading-none ${sc.text}`}>{star.chinese}</span>
          <span className={`text-sm font-semibold ${sc.text}`}>{star.name[lang]}</span>
          <span className="text-xs text-zinc-600">
            {lang === 'bg' ? 'Звезда' : lang === 'ru' ? 'Звезда' : 'Star'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{star.meaning[lang]}</p>
      </div>

      {/* Deity */}
      <div className={`rounded-lg border px-3 py-2.5 ${dc.bg} ${dc.border}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-lg font-bold leading-none ${dc.text}`}>{deity.chinese}</span>
          <span className={`text-sm font-semibold ${dc.text}`}>{deity.name[lang]}</span>
          <span className="text-xs text-zinc-600">
            {lang === 'bg' ? 'Дух' : lang === 'ru' ? 'Дух' : 'Deity'}
          </span>
        </div>
        <p className="text-xs text-zinc-500 leading-snug">{deity.meaning[lang]}</p>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Props { lang: Language }

export default function Qmdj({ lang }: Props) {
  const chart = useMemo(() => generateQmdjChart(new Date()), [])
  const [selectedPalace, setSelectedPalace] = useState<Palace | null>(null)
  const [layer, setLayer] = useState<Layer>('all')

  const selectedData = chart.palaces.find(p => p.palace === selectedPalace) ?? null

  const now = chart.date
  const dateStr = now.toLocaleDateString(
    lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  // Best palace: open or rest gate + auspicious star + auspicious deity
  const bestPalace = chart.palaces
    .filter(p => p.gate === 'open' || p.gate === 'rest' || p.gate === 'life')
    .sort((a, b) => {
      const score = (p: PalaceData) =>
        (GATE_INFO[p.gate].category === 'auspicious' ? 2 : 0) +
        (STAR_INFO_QMDJ[p.star].category === 'auspicious' ? 1 : 0) +
        (DEITY_INFO[p.deity].category === 'auspicious' ? 1 : 0)
      return score(b) - score(a)
    })[0] ?? null

  const layerTabs: { id: Layer; label: string }[] = [
    { id: 'all',     label: lang === 'bg' ? 'Всичко' : lang === 'ru' ? 'Всё'     : 'All'     },
    { id: 'gates',   label: lang === 'bg' ? 'Врати'  : lang === 'ru' ? 'Врата'   : 'Gates'   },
    { id: 'stars',   label: lang === 'bg' ? 'Звезди' : lang === 'ru' ? 'Звёзды'  : 'Stars'   },
    { id: 'deities', label: lang === 'bg' ? 'Духове' : lang === 'ru' ? 'Духи'    : 'Deities' },
  ]

  return (
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-5 pt-8 md:pt-0">
        <h2 className="text-lg font-semibold text-zinc-100">
          {lang === 'bg' ? '🔯 Ци Мен Дун Дзя' : lang === 'ru' ? '🔯 Ци Мэнь Дунь Цзя' : '🔯 Qi Men Dun Jia'}
        </h2>
        <p className="text-zinc-500 text-sm mt-0.5">{dateStr}</p>
      </div>

      {/* Ju + polarity card */}
      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center shrink-0">
          <span className="text-3xl font-bold text-amber-400 leading-none">{chart.ju}</span>
          <span className="text-[10px] text-zinc-500 mt-0.5">局</span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-0.5">
            {lang === 'bg' ? 'Активна局' : lang === 'ru' ? 'Активная局' : 'Active Ju'}
          </p>
          <p className="text-base font-semibold text-zinc-100">{POLARITY_LABEL[chart.polarity][lang]}</p>
          {bestPalace && (
            <p className="text-xs text-amber-400 mt-1">
              💡 {lang === 'bg' ? `Най-добра посока: ${PALACE_DIR[bestPalace.palace]} · врата ${GATE_INFO[bestPalace.gate].chinese}` :
                  lang === 'ru' ? `Лучшее направление: ${PALACE_DIR[bestPalace.palace]} · врата ${GATE_INFO[bestPalace.gate].chinese}` :
                                  `Best direction: ${PALACE_DIR[bestPalace.palace]} · gate ${GATE_INFO[bestPalace.gate].chinese}`}
            </p>
          )}
        </div>
      </div>

      {/* Layer filter */}
      <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {layerTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setLayer(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
              layer === tab.id
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3×3 Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {GRID_PALACE_ORDER.map(palace => {
          const p = chart.palaces.find(x => x.palace === palace)!
          return (
            <PalaceCell
              key={palace}
              p={p}
              layer={layer}
              onClick={() => setSelectedPalace(selectedPalace === palace ? null : palace)}
              isSelected={selectedPalace === palace}
            />
          )
        })}
      </div>

      {/* Tap hint */}
      {!selectedPalace && (
        <p className="text-[11px] text-zinc-600 text-center mb-4">
          {lang === 'bg' ? 'Натисни клетка за детайли' : lang === 'ru' ? 'Нажми на ячейку для деталей' : 'Tap a cell for details'}
        </p>
      )}

      {/* Detail panel */}
      {selectedData && (
        <div className="mb-6">
          <PalaceDetail p={selectedData} lang={lang} />
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 mb-4">
        <p className="text-xs text-zinc-500 font-medium mb-2">
          {lang === 'bg' ? 'Легенда' : lang === 'ru' ? 'Легенда' : 'Legend'}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {(Object.keys(GATE_INFO) as (keyof typeof GATE_INFO)[]).map(g => {
            const gi = GATE_INFO[g]
            const c = categoryColor(gi.category)
            return (
              <div key={g} className="flex items-center gap-1.5">
                <span className={`text-sm font-bold ${c.text}`}>{gi.chinese}</span>
                <span className="text-xs text-zinc-500">{gi.name[lang]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Explainer */}
      <p className="text-[11px] text-zinc-600 text-center leading-relaxed px-2">
        {lang === 'bg'
          ? 'КМДЖ (奇門遁甲) е древна китайска система за стратегическо планиране. Картата се изчислява от текущия сезон и局 номера. Всеки дворец съдържа Врата (Мен), Звезда (Син) и Дух (Шен).'
          : lang === 'ru'
          ? 'ЦМДЦ (奇門遁甲) — древняя китайская система стратегического планирования. Карта рассчитывается по текущему сезону и номеру局. Каждый дворец содержит Врата (门), Звезду (星) и Дух (神).'
          : 'QMDJ (奇門遁甲) is an ancient Chinese strategic planning system. The chart is computed from the current season and Ju number. Each palace contains a Gate (门), Star (星), and Deity (神).'}
      </p>
    </div>
  )
}
