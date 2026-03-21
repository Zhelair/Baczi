import type { Language } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FacingDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type HousePalace = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export interface HousePalaceData {
  palace:    HousePalace
  baseStar:  number   // period star (运星)
  waterStar: number   // facing star (向星) — affects wealth
  mtnStar:   number   // sitting star (山星) — affects health/relationships
}

export type ChartType = 'wang_shan_wang_shui' | 'shang_shan_xia_shui' | 'shui_lu_kong_wang' | 'standard'

export interface HouseChart {
  period:    number
  periodRange: string
  facing:    FacingDir
  sitting:   FacingDir
  palaces:   HousePalaceData[]
  chartType: ChartType
}

// ─── Periods ──────────────────────────────────────────────────────────────────

export const PERIODS: { number: number; start: number; end: number }[] = [
  { number: 6, start: 1964, end: 1983 },
  { number: 7, start: 1984, end: 2003 },
  { number: 8, start: 2004, end: 2023 },
  { number: 9, start: 2024, end: 2043 },
]

export function getPeriodFromYear(year: number): number {
  return PERIODS.find(p => year >= p.start && year <= p.end)?.number ?? 9
}

export function getPeriodRange(period: number): string {
  const p = PERIODS.find(x => x.number === period)
  return p ? `${p.start}–${p.end}` : ''
}

// ─── Direction maps ───────────────────────────────────────────────────────────

// Lo Shu palace number for each compass facing
const DIR_PALACE: Record<FacingDir, HousePalace> = {
  N: 1, SW: 2, E: 3, SE: 4, S: 9, NW: 6, W: 7, NE: 8,
}

// Sitting direction is opposite to facing
const OPPOSITE: Record<FacingDir, FacingDir> = {
  N: 'S', S: 'N', E: 'W', W: 'E',
  NE: 'SW', SW: 'NE', SE: 'NW', NW: 'SE',
}

// Polarity — Yang (true=forward) or Yin (false=backward) for WATER star
// Yang intercardinals: NE(艮), SE(巽), SW(坤), NW(乾) → forward
// Yin cardinals: N(子), E(卯), S(午), W(酉)         → backward
const DIR_YANG: Record<FacingDir, boolean> = {
  N: false, NE: true,  E: false, SE: true,
  S: false, SW: true,  W: false, NW: true,
}

// ─── Star calculation ─────────────────────────────────────────────────────────

// Base (period) star for a palace when center = period P
function calcBaseStar(palace: HousePalace, period: number): number {
  return ((palace - 1 + period - 5 + 9 * 100) % 9) + 1
}

// Water star: period star P placed at facing palace, flies forward/backward
function calcWaterStar(palace: HousePalace, period: number, facingPalace: HousePalace, forward: boolean): number {
  const offset = (palace - facingPalace + 9) % 9
  if (forward) return ((period - 1 + offset + 9 * 100) % 9) + 1
  return ((period - 1 - offset + 9 * 100) % 9) + 1
}

// Mountain star: period star P placed at sitting palace, flies OPPOSITE to water
function calcMtnStar(palace: HousePalace, period: number, sittingPalace: HousePalace, waterForward: boolean): number {
  const forward = !waterForward   // mountain always opposite to water
  const offset = (palace - sittingPalace + 9) % 9
  if (forward) return ((period - 1 + offset + 9 * 100) % 9) + 1
  return ((period - 1 - offset + 9 * 100) % 9) + 1
}

// ─── Chart type detection ─────────────────────────────────────────────────────

function detectChartType(palaces: HousePalaceData[], facingPalace: HousePalace, sittingPalace: HousePalace, period: number): ChartType {
  const facingP = palaces.find(p => p.palace === facingPalace)!
  const sittingP = palaces.find(p => p.palace === sittingPalace)!

  const wangAtFacing  = facingP.waterStar === period   // water star = period at facing ✓ (always)
  const wangAtSitting = sittingP.mtnStar === period    // mountain star = period at sitting ✓ (always)

  // 旺山旺水: both period stars in correct positions (facing has water=P, sitting has mtn=P)
  // This is always true by construction. The REAL check is if they are "trapped":
  // Shang Shan Xia Shui: period star water at sitting, period star mountain at facing
  const waterAtSitting = sittingP.waterStar === period
  const mtnAtFacing    = facingP.mtnStar === period

  if (waterAtSitting && mtnAtFacing) return 'shang_shan_xia_shui'
  if (wangAtFacing && wangAtSitting) return 'wang_shan_wang_shui'
  return 'standard'
}

// ─── Main chart generator ─────────────────────────────────────────────────────

export function generateHouseChart(builtYear: number, facing: FacingDir): HouseChart {
  const period       = getPeriodFromYear(builtYear)
  const periodRange  = getPeriodRange(period)
  const sitting      = OPPOSITE[facing]
  const facingPalace = DIR_PALACE[facing]
  const sittingPalace: HousePalace = (10 - facingPalace) as HousePalace
  const waterForward = DIR_YANG[facing]

  const palaces: HousePalaceData[] = (Array.from({ length: 9 }, (_, i) => i + 1) as HousePalace[]).map(palace => ({
    palace,
    baseStar:  calcBaseStar(palace, period),
    waterStar: calcWaterStar(palace, period, facingPalace, waterForward),
    mtnStar:   calcMtnStar(palace, period, sittingPalace, waterForward),
  }))

  const chartType = detectChartType(palaces, facingPalace, sittingPalace, period)

  return { period, periodRange, facing, sitting, palaces, chartType }
}

// ─── Star quality for current period ──────────────────────────────────────────

// Auspicious stars per period
const PERIOD_AUSPICIOUS: Record<number, number[]> = {
  6: [6, 1, 8],
  7: [7, 8, 9],
  8: [8, 9, 1],
  9: [9, 1, 8],
}
const PERIOD_DANGEROUS: Record<number, number[]> = {
  6: [5, 2, 3],
  7: [5, 2, 3],
  8: [5, 2, 7],
  9: [5, 2, 3],
}

export function starQuality(star: number, period: number): 'auspicious' | 'neutral' | 'inauspicious' {
  if (PERIOD_AUSPICIOUS[period]?.includes(star)) return 'auspicious'
  if (PERIOD_DANGEROUS[period]?.includes(star))  return 'inauspicious'
  return 'neutral'
}

// ─── Labels & metadata ────────────────────────────────────────────────────────

export const FACING_LABEL: Record<FacingDir, { label: Record<Language, string>; chinese: string }> = {
  N:  { label: { bg: 'Север (子)',   ru: 'Север (子)',    en: 'North (子)'   }, chinese: '子' },
  NE: { label: { bg: 'Изток-север (艮)', ru: 'Северо-восток (艮)', en: 'Northeast (艮)' }, chinese: '艮' },
  E:  { label: { bg: 'Изток (卯)',   ru: 'Восток (卯)',   en: 'East (卯)'    }, chinese: '卯' },
  SE: { label: { bg: 'Юг-изток (巽)',ru: 'Юго-восток (巽)',en: 'Southeast (巽)'}, chinese: '巽' },
  S:  { label: { bg: 'Юг (午)',      ru: 'Юг (午)',       en: 'South (午)'   }, chinese: '午' },
  SW: { label: { bg: 'Юг-запад (坤)',ru: 'Юго-запад (坤)',en: 'Southwest (坤)'}, chinese: '坤' },
  W:  { label: { bg: 'Запад (酉)',   ru: 'Запад (酉)',    en: 'West (酉)'    }, chinese: '酉' },
  NW: { label: { bg: 'Запад-север (乾)',ru: 'Северо-запад (乾)',en: 'Northwest (乾)'}, chinese: '乾' },
}

export const CHART_TYPE_INFO: Record<ChartType, { name: Record<Language, string>; desc: Record<Language, string>; good: boolean }> = {
  wang_shan_wang_shui: {
    name: { bg: '旺山旺水 — Процъфтяващ', ru: '旺山旺水 — Процветающий', en: '旺山旺水 — Prosperous' },
    desc: { bg: 'Планинската и водната звезда на периода са на правилните места. Добре за здраве И богатство.',
            ru: 'Горная и водная звёзды периода на правильных местах. Хорошо для здоровья И богатства.',
            en: 'Period mountain and water stars are in correct positions. Good for health AND wealth.' },
    good: true,
  },
  shang_shan_xia_shui: {
    name: { bg: '上山下水 — Обърнат', ru: '上山下水 — Перевёрнутый', en: '上山下水 — Reversed' },
    desc: { bg: 'Звездите са на грешните места. Ако пред входа има вода, проблеми с богатството. Добавете поправки.',
            ru: 'Звёзды на неправильных местах. Если перед входом вода — проблемы с богатством. Добавьте коррекции.',
            en: 'Stars reversed. Water at front causes wealth issues; mountain at front affects relationships.' },
    good: false,
  },
  shui_lu_kong_wang: {
    name: { bg: 'Стандартна карта', ru: 'Стандартная карта', en: 'Standard Chart' },
    desc: { bg: 'Смесена карта — провери дали водните обекти са в секторите с добри водни звезди.',
            ru: 'Смешанная карта — проверь, находятся ли водные объекты в секторах с хорошими водными звёздами.',
            en: 'Mixed chart — check if water features align with good water star sectors.' },
    good: true,
  },
  standard: {
    name: { bg: 'Смесена карта', ru: 'Смешанная карта', en: 'Mixed Chart' },
    desc: { bg: 'Провери дали водните обекти са в секторите с добри водни звезди.',
            ru: 'Проверь, находятся ли водные объекты в секторах с хорошими водными звёздами.',
            en: 'Check if water features align with good water star sectors.' },
    good: true,
  },
}

export const PALACE_DIR_LABEL: Record<HousePalace, Record<Language, string>> = {
  1: { bg: 'С',  ru: 'С',  en: 'N'   },
  2: { bg: 'ЮЗ', ru: 'ЮЗ', en: 'SW'  },
  3: { bg: 'И',  ru: 'В',  en: 'E'   },
  4: { bg: 'ЮИ', ru: 'ЮВ', en: 'SE'  },
  5: { bg: 'Ц',  ru: 'Ц',  en: 'CTR' },
  6: { bg: 'СЗ', ru: 'СЗ', en: 'NW'  },
  7: { bg: 'З',  ru: 'З',  en: 'W'   },
  8: { bg: 'СИ', ru: 'СВ', en: 'NE'  },
  9: { bg: 'Ю',  ru: 'Ю',  en: 'S'   },
}

// Grid display order: NW(6) N(1) NE(8) / W(7) CTR(5) E(3) / SW(2) S(9) SE(4)
export const HOUSE_GRID_ORDER: HousePalace[] = [6, 1, 8, 7, 5, 3, 2, 9, 4]
