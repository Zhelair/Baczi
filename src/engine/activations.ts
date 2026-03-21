import type { BaziChart } from './types'
import type { Language } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivationType =
  | 'stem_clash'       // 天干相冲
  | 'stem_combine'     // 天干五合
  | 'branch_clash'     // 地支六冲
  | 'six_harmony'      // 地支六合
  | 'three_harmony'    // 地支三合 (partial: 2 of 3)
  | 'three_meeting'    // 地支三会 (partial: 2 of 3)
  | 'punishment'       // 地支刑 (ungrateful / bullying / uncivilized)
  | 'self_punishment'  // 地支自刑
  | 'harm'             // 地支害

export type Sentiment = 'positive' | 'negative' | 'mixed'

export type IncomingSource = 'annual_year' | 'annual_month' | 'luck_cycle'

export interface Activation {
  type: ActivationType
  natalPillarKey: string       // 'year' | 'month' | 'day' | 'hour'
  natalChar: string
  incomingSource: IncomingSource
  incomingChar: string
  charType: 'gan' | 'zhi'
  resultElement?: string       // for combine / three_harmony / three_meeting
  sentiment: Sentiment
}

// ─── Relationship tables ───────────────────────────────────────────────────────

const STEM_CLASH_PAIRS: [string, string][] = [
  ['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸'],
]

const STEM_COMBINE_PAIRS: { pair: [string, string]; element: Record<Language, string> }[] = [
  { pair: ['甲', '己'], element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth' } },
  { pair: ['乙', '庚'], element: { bg: 'Метал', ru: 'Металл', en: 'Metal' } },
  { pair: ['丙', '辛'], element: { bg: 'Вода',  ru: 'Вода',   en: 'Water' } },
  { pair: ['丁', '壬'], element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood'  } },
  { pair: ['戊', '癸'], element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire'  } },
]

const BRANCH_CLASH_PAIRS: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const SIX_HARMONY_PAIRS: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const THREE_HARMONY_GROUPS: { branches: string[]; element: Record<Language, string> }[] = [
  { branches: ['申', '子', '辰'], element: { bg: 'Вода',  ru: 'Вода',   en: 'Water' } },
  { branches: ['亥', '卯', '未'], element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood'  } },
  { branches: ['寅', '午', '戌'], element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire'  } },
  { branches: ['巳', '酉', '丑'], element: { bg: 'Метал', ru: 'Металл', en: 'Metal' } },
]

const THREE_MEETING_GROUPS: { branches: string[]; element: Record<Language, string> }[] = [
  { branches: ['寅', '卯', '辰'], element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood'  } },
  { branches: ['巳', '午', '未'], element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire'  } },
  { branches: ['申', '酉', '戌'], element: { bg: 'Метал', ru: 'Металл', en: 'Metal' } },
  { branches: ['亥', '子', '丑'], element: { bg: 'Вода',  ru: 'Вода',   en: 'Water' } },
]

// Punishment groups — each contains branches that punish each other cyclically
const PUNISHMENT_CYCLE_GROUPS: string[][] = [
  ['寅', '巳', '申'],  // ungrateful punishment
  ['丑', '戌', '未'],  // bullying punishment
]
const PUNISHMENT_UNCIVILIZED: [string, string][] = [['子', '卯']]
const PUNISHMENT_SELF: string[] = ['辰', '午', '酉', '亥']

const HARM_PAIRS: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPair(a: string, b: string, pairs: [string, string][]): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x))
}

function checkStem(
  natalStem: string,
  natalPillarKey: string,
  incomingStem: string,
  source: IncomingSource,
  lang: Language,
): Activation[] {
  const out: Activation[] = []

  if (isPair(natalStem, incomingStem, STEM_CLASH_PAIRS)) {
    out.push({
      type: 'stem_clash',
      natalPillarKey,
      natalChar: natalStem,
      incomingSource: source,
      incomingChar: incomingStem,
      charType: 'gan',
      sentiment: 'mixed',
    })
  }

  const combo = STEM_COMBINE_PAIRS.find(({ pair }) => isPair(natalStem, incomingStem, [pair]))
  if (combo) {
    out.push({
      type: 'stem_combine',
      natalPillarKey,
      natalChar: natalStem,
      incomingSource: source,
      incomingChar: incomingStem,
      charType: 'gan',
      resultElement: combo.element[lang],
      sentiment: 'positive',
    })
  }

  return out
}

function checkBranch(
  natalBranch: string,
  natalPillarKey: string,
  incomingBranch: string,
  source: IncomingSource,
  lang: Language,
): Activation[] {
  const out: Activation[] = []

  const base = { natalPillarKey, natalChar: natalBranch, incomingSource: source, incomingChar: incomingBranch, charType: 'zhi' as const }

  if (isPair(natalBranch, incomingBranch, BRANCH_CLASH_PAIRS)) {
    out.push({ type: 'branch_clash', ...base, sentiment: 'mixed' })
  }

  if (isPair(natalBranch, incomingBranch, SIX_HARMONY_PAIRS)) {
    out.push({ type: 'six_harmony', ...base, sentiment: 'positive' })
  }

  if (isPair(natalBranch, incomingBranch, PUNISHMENT_UNCIVILIZED)) {
    out.push({ type: 'punishment', ...base, sentiment: 'negative' })
  }

  if (isPair(natalBranch, incomingBranch, HARM_PAIRS)) {
    out.push({ type: 'harm', ...base, sentiment: 'negative' })
  }

  if (natalBranch === incomingBranch && PUNISHMENT_SELF.includes(natalBranch)) {
    out.push({ type: 'self_punishment', ...base, sentiment: 'negative' })
  }

  for (const group of PUNISHMENT_CYCLE_GROUPS) {
    if (group.includes(natalBranch) && group.includes(incomingBranch) && natalBranch !== incomingBranch) {
      if (!out.some(a => a.type === 'punishment')) {
        out.push({ type: 'punishment', ...base, sentiment: 'negative' })
      }
    }
  }

  for (const group of THREE_HARMONY_GROUPS) {
    if (group.branches.includes(natalBranch) && group.branches.includes(incomingBranch) && natalBranch !== incomingBranch) {
      out.push({ type: 'three_harmony', ...base, resultElement: group.element[lang], sentiment: 'positive' })
    }
  }

  for (const group of THREE_MEETING_GROUPS) {
    if (group.branches.includes(natalBranch) && group.branches.includes(incomingBranch) && natalBranch !== incomingBranch) {
      out.push({ type: 'three_meeting', ...base, resultElement: group.element[lang], sentiment: 'positive' })
    }
  }

  return out
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function computeActivations(
  chart: BaziChart,
  yearGan: string,
  yearZhi: string,
  monthGan: string,
  monthZhi: string,
  luckGan: string | null,
  luckZhi: string | null,
  lang: Language,
): Activation[] {
  const natalPillars = [
    { key: 'year',  gan: chart.year.gan,        zhi: chart.year.zhi        },
    { key: 'month', gan: chart.month.gan,        zhi: chart.month.zhi       },
    { key: 'day',   gan: chart.day.gan,          zhi: chart.day.zhi         },
    ...(chart.hour ? [{ key: 'hour', gan: chart.hour.gan, zhi: chart.hour.zhi }] : []),
  ]

  const incoming: { source: IncomingSource; gan: string; zhi: string }[] = [
    { source: 'annual_year',  gan: yearGan,         zhi: yearZhi         },
    { source: 'annual_month', gan: monthGan,         zhi: monthZhi        },
    ...(luckGan && luckZhi ? [{ source: 'luck_cycle' as IncomingSource, gan: luckGan, zhi: luckZhi }] : []),
  ]

  const results: Activation[] = []

  for (const natal of natalPillars) {
    for (const inc of incoming) {
      results.push(...checkStem(natal.gan, natal.key, inc.gan, inc.source, lang))
      results.push(...checkBranch(natal.zhi, natal.key, inc.zhi, inc.source, lang))
    }
  }

  return results
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const ACTIVATION_LABELS: Record<ActivationType, Record<Language, string>> = {
  stem_clash:      { bg: 'Сблъсък на стебла',    ru: 'Столкновение стволов', en: 'Stem Clash'       },
  stem_combine:    { bg: 'Комбинация на стебла',  ru: 'Комбинация стволов',   en: 'Stem Combination' },
  branch_clash:    { bg: 'Сблъсък (六冲)',         ru: 'Столкновение (六冲)',   en: 'Branch Clash'     },
  six_harmony:     { bg: 'Шест хармонии (六合)',   ru: 'Шесть гармоний (六合)', en: 'Six Harmony'      },
  three_harmony:   { bg: 'Три хармонии (三合)',    ru: 'Три гармонии (三合)',   en: 'Three Harmony'    },
  three_meeting:   { bg: 'Три срещи (三会)',       ru: 'Три встречи (三会)',    en: 'Three Meeting'    },
  punishment:      { bg: 'Наказание (刑)',         ru: 'Наказание (刑)',        en: 'Punishment'       },
  self_punishment: { bg: 'Самонаказание (自刑)',   ru: 'Самонаказание (自刑)',  en: 'Self-Punishment'  },
  harm:            { bg: 'Вреда (害)',             ru: 'Вред (害)',             en: 'Harm'             },
}

export const ACTIVATION_DESCRIPTIONS: Record<ActivationType, Record<Language, string>> = {
  stem_clash: {
    bg: 'Конфликт на небесните стебла — налага промяна и трансформация',
    ru: 'Конфликт небесных стволов — требует перемен и трансформации',
    en: 'Heavenly stems in conflict — demands change and transformation',
  },
  stem_combine: {
    bg: 'Небесните стебла се обединяват — синергия и нова енергия',
    ru: 'Небесные стволы объединяются — синергия и новая энергия',
    en: 'Heavenly stems unite — synergy and new elemental energy',
  },
  branch_clash: {
    bg: 'Земните клони се сблъскват — турбуленция, но и движение напред',
    ru: 'Земные ветви сталкиваются — турбулентность, но и движение вперёд',
    en: 'Earthly branches clash — turbulence, but also forward motion',
  },
  six_harmony: {
    bg: 'Шест хармонии — поддръжка, сътрудничество, плавен поток',
    ru: 'Шесть гармоний — поддержка, сотрудничество, плавный поток',
    en: 'Six Harmonies — support, cooperation, smooth flow',
  },
  three_harmony: {
    bg: 'Три хармонии — мощен съюз на елементи, усилена енергия',
    ru: 'Три гармонии — мощный союз элементов, усиленная энергия',
    en: 'Three Harmonies — powerful elemental alliance, amplified energy',
  },
  three_meeting: {
    bg: 'Три срещи — сезонен съюз, силна насочена енергия',
    ru: 'Три встречи — сезонный союз, сильная направленная энергия',
    en: 'Three Meeting — seasonal alliance, strong directed energy',
  },
  punishment: {
    bg: 'Наказание — поведенчески модели, напрежение; изисква осъзнатост',
    ru: 'Наказание — поведенческие паттерны, напряжение; требует осознанности',
    en: 'Punishment — behavioral patterns, tension; requires awareness',
  },
  self_punishment: {
    bg: 'Самонаказание — вътрешен конфликт, склонност към самосаботаж',
    ru: 'Самонаказание — внутренний конфликт, склонность к самосаботажу',
    en: 'Self-Punishment — inner conflict, tendency toward self-sabotage',
  },
  harm: {
    bg: 'Вреда (害) — скрити пречки, трудности в отношенията',
    ru: 'Вред (害) — скрытые препятствия, трудности в отношениях',
    en: 'Harm (害) — hidden obstacles, difficulties in relationships',
  },
}
