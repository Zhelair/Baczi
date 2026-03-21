import type { Language } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sector = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER'
export type StarNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type StarCategory = 'auspicious' | 'neutral' | 'inauspicious' | 'dangerous'

export interface SectorStar {
  sector: Sector
  star: StarNumber
  category: StarCategory
}

export interface AnnualChart {
  year: number
  centerStar: StarNumber
  sectors: SectorStar[]
}

// ─── Lo Shu base positions ────────────────────────────────────────────────────
// Maps each sector to its base Lo Shu star number (when center = 5)
const BASE_STAR: Record<Sector, StarNumber> = {
  N:      1,
  SW:     2,
  E:      3,
  SE:     4,
  CENTER: 5,
  NW:     6,
  W:      7,
  NE:     8,
  S:      9,
}

const SECTORS: Sector[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'CENTER']

// ─── Annual star calculation ──────────────────────────────────────────────────
// Flying Stars change on Li Chun (立春, ~Feb 4) each year
// Annual star descends each year: 2024=1, 2025=9, 2026=8, ...

export function getAnnualStar(date: Date = new Date()): StarNumber {
  let year = date.getFullYear()
  // Li Chun is ~Feb 4 — if before that, use previous year's star
  const liChun = new Date(year, 1, 4) // Feb 4
  if (date < liChun) year -= 1

  // Reference: 2024 (Jia Chen 甲辰) → center star 3 (Jade Green 碧)
  // Verified: 2022=5 (Five Yellow center), 2023=4, 2024=3, 2025=2, 2026=1
  // Star descends by 1 each year, wraps 1→9
  const delta = (year - 2024) % 9
  const star = ((3 - delta - 1 + 9 * 100) % 9) + 1
  return star as StarNumber
}

// ─── Chart generation ─────────────────────────────────────────────────────────

function rotateStar(base: StarNumber, annualCenter: StarNumber): StarNumber {
  // Shift all stars by (annualCenter - 5), wrap within 1-9
  const shifted = ((base - 1 + annualCenter - 5 + 9 * 100) % 9) + 1
  return shifted as StarNumber
}

export function getAnnualChart(date: Date = new Date()): AnnualChart {
  const centerStar = getAnnualStar(date)
  let year = date.getFullYear()
  const liChun = new Date(year, 1, 4)
  if (date < liChun) year -= 1

  const sectors: SectorStar[] = SECTORS.map(sector => {
    const star = rotateStar(BASE_STAR[sector], centerStar)
    return { sector, star, category: STAR_CATEGORY[star] }
  })

  return { year, centerStar, sectors }
}

// ─── Star metadata ────────────────────────────────────────────────────────────

export const STAR_CATEGORY: Record<StarNumber, StarCategory> = {
  1: 'auspicious',
  2: 'dangerous',
  3: 'inauspicious',
  4: 'auspicious',
  5: 'dangerous',
  6: 'auspicious',
  7: 'inauspicious',
  8: 'auspicious',
  9: 'auspicious',
}

export const STAR_INFO: Record<StarNumber, {
  name: Record<Language, string>
  chinese: string
  color: string        // tailwind class fragment for color
  element: Record<Language, string>
  meaning: Record<Language, string>
  advice: Record<Language, string>
}> = {
  1: {
    name:    { bg: 'Бяла звезда',    ru: 'Белая звезда',    en: 'White Star'    },
    chinese: '一白',
    color:   'blue',
    element: { bg: 'Вода', ru: 'Вода', en: 'Water' },
    meaning: { bg: 'Кариера, академичен успех, романтика, пътуване',
               ru: 'Карьера, учёба, романтика, путешествия',
               en: 'Career, academic success, romance, travel' },
    advice:  { bg: 'Активирай с вода или синьо. Добре за бюрото и спалнята.',
               ru: 'Активируй водой или синим цветом. Хорошо для рабочего стола и спальни.',
               en: 'Activate with water or blue tones. Great for your desk or bedroom.' },
  },
  2: {
    name:    { bg: 'Черна звезда',   ru: 'Чёрная звезда',   en: 'Black Star'    },
    chinese: '二黑',
    color:   'gray',
    element: { bg: 'Земя', ru: 'Земля', en: 'Earth' },
    meaning: { bg: 'Болести, проблеми с храносмилането, препятствия',
               ru: 'Болезни, проблемы с пищеварением, препятствия',
               en: 'Illness, digestive problems, obstacles' },
    advice:  { bg: 'Постави 6 метални монети или метални предмети. Избягвай земя/жълто.',
               ru: 'Размести 6 металлических монет или металлические предметы. Избегай земли/жёлтого.',
               en: 'Place 6 metal coins or metal objects here. Avoid earth/yellow tones.' },
  },
  3: {
    name:    { bg: 'Нефритена звезда', ru: 'Нефритовая звезда', en: 'Jade Star'  },
    chinese: '三碧',
    color:   'emerald',
    element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' },
    meaning: { bg: 'Кавги, правни проблеми, кражба, клюки',
               ru: 'Ссоры, судебные проблемы, воровство, сплетни',
               en: 'Arguments, legal problems, theft, gossip' },
    advice:  { bg: 'Постави червено/огън. Избягвай вода и зеленото. Тихо пространство.',
               ru: 'Добавь красное/огонь. Избегай воды и зелёного. Тихое пространство.',
               en: 'Add red/fire elements. Avoid water and green. Keep space quiet.' },
  },
  4: {
    name:    { bg: 'Зелена звезда',  ru: 'Зелёная звезда',  en: 'Green Star'   },
    chinese: '四绿',
    color:   'green',
    element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' },
    meaning: { bg: 'Романтика, творчество, изкуство, академично развитие',
               ru: 'Романтика, творчество, искусство, учёба',
               en: 'Romance, creativity, arts, academic growth' },
    advice:  { bg: 'Цветя, вода, лилави тонове. Чудесна за студио или учебна стая.',
               ru: 'Цветы, вода, фиолетовые тона. Идеально для студии или учёбы.',
               en: 'Flowers, water, purple tones. Perfect for a studio or study room.' },
  },
  5: {
    name:    { bg: 'Жълта звезда',   ru: 'Жёлтая звезда',   en: 'Yellow Star'  },
    chinese: '五黄',
    color:   'yellow',
    element: { bg: 'Земя', ru: 'Земля', en: 'Earth' },
    meaning: { bg: 'Нещастие, злополуки, тежка болест — най-опасната звезда',
               ru: 'Несчастья, аварии, тяжёлые болезни — самая опасная звезда',
               en: 'Misfortune, accidents, serious illness — most dangerous star' },
    advice:  { bg: 'НЕ строй, НЕ копай, НЕ активирай тук! Постави 6 метални монети и солена вода.',
               ru: 'НЕ строй, НЕ копай, НЕ активируй! Размести 6 монет и солёную воду.',
               en: 'Do NOT renovate, dig, or activate here! Place 6 metal coins + salt water cure.' },
  },
  6: {
    name:    { bg: 'Бяла метална звезда', ru: 'Белая металлическая звезда', en: 'Metal White Star' },
    chinese: '六白',
    color:   'slate',
    element: { bg: 'Метал', ru: 'Металл', en: 'Metal' },
    meaning: { bg: 'Власт, авторитет, помощни хора, неочакван доход',
               ru: 'Власть, авторитет, помощь людей, неожиданный доход',
               en: 'Power, authority, helpful people, unexpected income' },
    advice:  { bg: 'Кристали, бяло, метал. Добра за кабинет или вход.',
               ru: 'Кристаллы, белый цвет, металл. Хорошо для кабинета или входа.',
               en: 'Crystals, white and metal. Good for an office or main entrance.' },
  },
  7: {
    name:    { bg: 'Червена звезда', ru: 'Красная звезда',  en: 'Red Star'     },
    chinese: '七赤',
    color:   'red',
    element: { bg: 'Метал', ru: 'Металл', en: 'Metal' },
    meaning: { bg: 'Кражба, насилие, предателство, рискове',
               ru: 'Воровство, насилие, предательство, риски',
               en: 'Robbery, violence, betrayal, risks' },
    advice:  { bg: 'Вода, синьо/черно. Не активирай с огън или червено.',
               ru: 'Вода, синий/чёрный цвет. Не активируй огнём или красным.',
               en: 'Water, blue/black tones. Do not activate with fire or red.' },
  },
  8: {
    name:    { bg: 'Бяла земна звезда', ru: 'Белая земная звезда', en: 'Earth White Star' },
    chinese: '八白',
    color:   'amber',
    element: { bg: 'Земя', ru: 'Земля', en: 'Earth' },
    meaning: { bg: 'Богатство, просперитет, недвижими имоти (бившата звезда на периода)',
               ru: 'Богатство, процветание, недвижимость (звезда прошлого периода)',
               en: 'Wealth, prosperity, real estate (recent period star, still active)' },
    advice:  { bg: 'Кристали, жълто, земни тонове. Активирай с движение и светлина.',
               ru: 'Кристаллы, жёлтый, земляные тона. Активируй движением и светом.',
               en: 'Crystals, yellow and earth tones. Activate with movement and light.' },
  },
  9: {
    name:    { bg: 'Пурпурна звезда', ru: 'Пурпурная звезда', en: 'Purple Star' },
    chinese: '九紫',
    color:   'purple',
    element: { bg: 'Огън', ru: 'Огонь', en: 'Fire' },
    meaning: { bg: 'Радост, признание, бъдещо богатство — звездата на Период 9 (2024-2043)',
               ru: 'Радость, признание, будущее богатство — звезда Периода 9 (2024–2043)',
               en: 'Joy, recognition, future wealth — star of Period 9 (2024–2043)' },
    advice:  { bg: 'Огън, червено, лилаво, ярка светлина. Активирай смело — много благоприятна.',
               ru: 'Огонь, красный, фиолетовый, яркий свет. Активируй смело — очень благоприятна.',
               en: 'Fire, red, purple, bright lights. Activate boldly — highly auspicious.' },
  },
}

// ─── Color helpers ────────────────────────────────────────────────────────────

export const STAR_COLORS: Record<StarNumber, { bg: string; border: string; text: string; dot: string }> = {
  1: { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
  2: { bg: 'bg-zinc-800/60',   border: 'border-zinc-600/50',   text: 'text-zinc-400',   dot: 'bg-zinc-500'   },
  3: { bg: 'bg-emerald-500/8', border: 'border-emerald-700/40',text: 'text-emerald-400',dot: 'bg-emerald-500' },
  4: { bg: 'bg-green-500/10',  border: 'border-green-600/30',  text: 'text-green-300',  dot: 'bg-green-400'  },
  5: { bg: 'bg-yellow-500/10', border: 'border-yellow-600/40', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  6: { bg: 'bg-slate-500/10',  border: 'border-slate-500/30',  text: 'text-slate-300',  dot: 'bg-slate-400'  },
  7: { bg: 'bg-red-500/10',    border: 'border-red-700/40',    text: 'text-red-400',    dot: 'bg-red-500'    },
  8: { bg: 'bg-amber-500/12',  border: 'border-amber-500/30',  text: 'text-amber-300',  dot: 'bg-amber-400'  },
  9: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', dot: 'bg-purple-400' },
}

export const CATEGORY_ICON: Record<StarCategory, string> = {
  auspicious:   '✦',
  neutral:      '◆',
  inauspicious: '▲',
  dangerous:    '⚠',
}

export const SECTOR_LABEL: Record<Sector, Record<Language, string>> = {
  N:      { bg: 'С',   ru: 'С',   en: 'N'   },
  NE:     { bg: 'СИ',  ru: 'СВ',  en: 'NE'  },
  E:      { bg: 'И',   ru: 'В',   en: 'E'   },
  SE:     { bg: 'ЮИ',  ru: 'ЮВ',  en: 'SE'  },
  S:      { bg: 'Ю',   ru: 'Ю',   en: 'S'   },
  SW:     { bg: 'ЮЗ',  ru: 'ЮЗ',  en: 'SW'  },
  W:      { bg: 'З',   ru: 'З',   en: 'W'   },
  NW:     { bg: 'СЗ',  ru: 'СЗ',  en: 'NW'  },
  CENTER: { bg: 'Ц',   ru: 'Ц',   en: 'CTR' },
}
