import type { Language } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Direction = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'
export type EnergyType = 'shengqi' | 'tianyi' | 'yannian' | 'fuwei' | 'huohai' | 'wugui' | 'liusha' | 'jueming'
export type Group = 'east' | 'west'

export interface DirectionEnergy {
  direction: Direction
  energy: EnergyType
  auspicious: boolean
}

export interface KuaResult {
  kua: number
  group: Group
  element: Record<Language, string>
  directions: DirectionEnergy[]   // all 8 directions, ordered by priority (auspicious first)
}

// ─── Lookup tables ────────────────────────────────────────────────────────────

// 8 Mansions (八宅) — classic assignment per Kua number
// Order: [Sheng Qi, Tian Yi, Yan Nian, Fu Wei, Huo Hai, Wu Gui, Liu Sha, Jue Ming]
const KUA_DIRECTIONS: Record<number, Direction[]> = {
  1: ['SE', 'E',  'S',  'N',  'W',  'NE', 'NW', 'SW'],
  2: ['NE', 'W',  'NW', 'SW', 'E',  'SE', 'S',  'N' ],
  3: ['S',  'N',  'SE', 'E',  'SW', 'NW', 'NE', 'W' ],
  4: ['N',  'S',  'E',  'SE', 'NW', 'SW', 'W',  'NE'],
  6: ['W',  'NE', 'SW', 'NW', 'SE', 'E',  'N',  'S' ],
  7: ['NW', 'SW', 'NE', 'W',  'N',  'S',  'SE', 'E' ],
  8: ['SW', 'NW', 'W',  'NE', 'S',  'N',  'E',  'SE'],
  9: ['E',  'SE', 'N',  'S',  'NE', 'W',  'SW', 'NW'],
}

const ENERGY_TYPES: EnergyType[] = [
  'shengqi', 'tianyi', 'yannian', 'fuwei',
  'huohai',  'wugui',  'liusha',  'jueming',
]

const KUA_ELEMENT: Record<number, Record<Language, string>> = {
  1: { bg: 'Вода',  ru: 'Вода',   en: 'Water' },
  2: { bg: 'Земя',  ru: 'Земля',  en: 'Earth' },
  3: { bg: 'Дърво', ru: 'Дерево', en: 'Wood'  },
  4: { bg: 'Дърво', ru: 'Дерево', en: 'Wood'  },
  6: { bg: 'Метал', ru: 'Металл', en: 'Metal' },
  7: { bg: 'Метал', ru: 'Металл', en: 'Metal' },
  8: { bg: 'Земя',  ru: 'Земля',  en: 'Earth' },
  9: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire'  },
}

// ─── Kua calculation ──────────────────────────────────────────────────────────

function digitSum(n: number): number {
  let s = Math.abs(n)
  while (s > 9) s = String(s).split('').reduce((a, d) => a + Number(d), 0)
  return s
}

export function calculateKua(birthYear: number, gender: 'male' | 'female'): number {
  // Use last two digits, reduced
  const reduced = digitSum(birthYear % 100)

  let kua: number
  if (birthYear < 2000) {
    kua = gender === 'male' ? 10 - reduced : digitSum(reduced + 5)
  } else {
    kua = gender === 'male' ? 9 - reduced : digitSum(reduced + 6)
  }

  // Kua 5 maps to 2 (male) or 8 (female)
  if (kua === 5) kua = gender === 'male' ? 2 : 8
  if (kua === 0) kua = 9  // edge case

  return kua
}

export function getKuaResult(birthYear: number, gender: 'male' | 'female', _lang: Language): KuaResult {
  const kua = calculateKua(birthYear, gender)
  const group: Group = [1, 3, 4, 9].includes(kua) ? 'east' : 'west'

  const dirList = KUA_DIRECTIONS[kua] ?? KUA_DIRECTIONS[1]
  const directions: DirectionEnergy[] = ENERGY_TYPES.map((energy, i) => ({
    direction: dirList[i],
    energy,
    auspicious: i < 4,
  }))

  return {
    kua,
    group,
    element: KUA_ELEMENT[kua] ?? KUA_ELEMENT[1],
    directions,
  }
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const DIRECTION_LABELS: Record<Direction, string> = {
  N: 'N', NE: 'NE', E: 'E', SE: 'SE',
  S: 'S', SW: 'SW', W: 'W', NW: 'NW',
}

export const DIRECTION_SYMBOLS: Record<Direction, string> = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖',
}

export const ENERGY_LABELS: Record<EnergyType, { chinese: string; name: Record<Language, string>; desc: Record<Language, string>; tip: Record<Language, string> }> = {
  shengqi: {
    chinese: '生气',
    name: { bg: 'Шън Ци',    ru: 'Шэн Ци',   en: 'Sheng Qi'  },
    desc: { bg: 'Vitality — най-силната посока. Пари, успех, здраве.',
            ru: 'Vitality — сильнейшее направление. Деньги, успех, здоровье.',
            en: 'Vitality — your strongest direction. Wealth, success, growth.' },
    tip:  { bg: 'Спи или работи с глава натам.',  ru: 'Спите или работайте головой туда.',  en: 'Sleep or work facing this.' },
  },
  tianyi: {
    chinese: '天医',
    name: { bg: 'Тян Йи',    ru: 'Тянь И',   en: 'Tian Yi'   },
    desc: { bg: 'Небесен лекар — здраве, хармония, ментална яснота.',
            ru: 'Небесный врач — здоровье, гармония, ясность ума.',
            en: 'Heavenly Doctor — health, harmony, mental clarity.' },
    tip:  { bg: 'Лекувай се или медитирай тук.',  ru: 'Лечитесь или медитируйте здесь.',    en: 'Heal or meditate here.'    },
  },
  yannian: {
    chinese: '延年',
    name: { bg: 'Ян Нян',    ru: 'Янь Нянь', en: 'Yan Nian'  },
    desc: { bg: 'Дълголетие — отношения, романтика, сключване на договори.',
            ru: 'Долголетие — отношения, романтика, заключение договоров.',
            en: 'Longevity — relationships, romance, making agreements.' },
    tip:  { bg: 'Срещай се и преговаряй тук.',    ru: 'Встречайтесь и договаривайтесь.',    en: 'Meet or negotiate here.'   },
  },
  fuwei: {
    chinese: '伏位',
    name: { bg: 'Фу Уей',    ru: 'Фу Вэй',   en: 'Fu Wei'    },
    desc: { bg: 'Стабилност — лично развитие, медитация, обучение.',
            ru: 'Стабильность — личное развитие, медитация, учёба.',
            en: 'Stability — personal development, meditation, learning.' },
    tip:  { bg: 'Учи или се развивай тук.',       ru: 'Учитесь или развивайтесь здесь.',    en: 'Study or develop yourself.'},
  },
  huohai: {
    chinese: '祸害',
    name: { bg: 'Хуо Хай',   ru: 'Хо Хай',   en: 'Huo Hai'  },
    desc: { bg: 'Неприятности — малки аргументи, загуба на пари.',
            ru: 'Неприятности — мелкие конфликты, потеря денег.',
            en: 'Mishap — minor arguments, small money losses.' },
    tip:  { bg: 'Избягвай важни начинания тук.',  ru: 'Избегайте важных дел здесь.',        en: 'Avoid important tasks here.'},
  },
  wugui: {
    chinese: '五鬼',
    name: { bg: 'У Гуй',     ru: 'У Гуй',    en: 'Wu Gui'   },
    desc: { bg: 'Пет духа — предателство, кражба, неочаквани загуби.',
            ru: 'Пять духов — предательство, воровство, неожиданные потери.',
            en: 'Five Ghosts — betrayal, theft, unexpected setbacks.' },
    tip:  { bg: 'Не спи с глава натам.',          ru: 'Не спите головой в эту сторону.',    en: 'Don\'t sleep facing this.' },
  },
  liusha: {
    chinese: '六煞',
    name: { bg: 'Лю Ша',     ru: 'Лю Ша',    en: 'Liu Sha'  },
    desc: { bg: 'Шест убийци — сексуални скандали, прогресивни загуби.',
            ru: 'Шесть убийств — скандалы, постепенные потери.',
            en: 'Six Killings — scandals, gradual erosion of luck.' },
    tip:  { bg: 'Пази финанси и репутация тук.',  ru: 'Берегите финансы и репутацию.',      en: 'Guard finances, reputation.'},
  },
  jueming: {
    chinese: '绝命',
    name: { bg: 'Дже Минг',  ru: 'Цзюэ Мин', en: 'Jue Ming' },
    desc: { bg: 'Заплаха за живота — най-лошата посока. Избягвай при важни решения.',
            ru: 'Угроза жизни — худшее направление. Избегай при важных решениях.',
            en: 'Life Threat — worst direction. Avoid for major decisions.' },
    tip:  { bg: 'Избягвай тази посока напълно.',  ru: 'Избегайте этого направления.',       en: 'Avoid this direction fully.'},
  },
}

export const GROUP_LABELS: Record<Group, Record<Language, string>> = {
  east: { bg: 'Източна група', ru: 'Восточная группа', en: 'East Group' },
  west: { bg: 'Западна група', ru: 'Западная группа',  en: 'West Group' },
}
