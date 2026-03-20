// @ts-ignore — lunar-javascript ships its own types
import { Solar } from 'lunar-javascript'
import { stemLabel, branchLabel, HIDDEN_STEMS } from './translations'
import type { BaziChart, Pillar, LuckCycle, TodayPillars, Language } from './types'

function makePillar(gan: string, zhi: string, lang: Language): Pillar {
  const s = stemLabel(gan, lang)
  const b = branchLabel(zhi, lang)
  return {
    gan,
    zhi,
    ganElement: s.element,
    ganPolarity: s.polarity,
    ganElementKey: s.elementKey,
    zhiAnimal: b.animal,
    zhiElement: b.element,
    zhiElementKey: b.elementKey,
    hiddenStems: HIDDEN_STEMS[zhi] ?? [],
  }
}

export function calculateChart(
  year: number,
  month: number,
  day: number,
  hour: number | null,
  minute: number | null,
  gender: 'male' | 'female',
  lang: Language,
  longitude?: number,
  utcOffsetHours?: number
): BaziChart {
  // True Solar Time correction: (longitude − standard_meridian) × 4 min per degree
  let adjustedHour = hour
  let adjustedMinute = minute ?? 0
  if (hour !== null && longitude !== undefined && utcOffsetHours !== undefined) {
    const standardMeridian = utcOffsetHours * 15
    const correctionMinutes = Math.round((longitude - standardMeridian) * 4)
    let total = hour * 60 + adjustedMinute + correctionMinutes
    total = ((total % 1440) + 1440) % 1440   // keep within 0..1439
    adjustedHour = Math.floor(total / 60)
    adjustedMinute = total % 60
  }

  const solar =
    adjustedHour !== null
      ? Solar.fromYmdHms(year, month, day, adjustedHour, adjustedMinute, 0)
      : Solar.fromYmd(year, month, day)

  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const yearPillar  = makePillar(ec.getYearGan(),  ec.getYearZhi(),  lang)
  const monthPillar = makePillar(ec.getMonthGan(), ec.getMonthZhi(), lang)
  const dayPillar   = makePillar(ec.getDayGan(),   ec.getDayZhi(),   lang)

  let hourPillar: Pillar | null = null
  if (adjustedHour !== null) {
    hourPillar = makePillar(ec.getTimeGan(), ec.getTimeZhi(), lang)
  }

  const dayGan = ec.getDayGan()
  const dayMasterStem = stemLabel(dayGan, lang)

  // 10-year luck cycles
  const maleFlag = gender === 'male' ? 1 : 0
  const yun = ec.getYun(maleFlag)
  const cycles: LuckCycle[] = []

  try {
    const yunList = yun.getYun()
    for (const y of yunList) {
      const ganZhi: string = y.getGanZhi()
      const g = ganZhi[0]
      const z = ganZhi[1]
      const stemInfo = stemLabel(g, lang)
      const branchInfo = branchLabel(z, lang)
      cycles.push({
        gan: g,
        zhi: z,
        ganZhi,
        startAge: y.getAge ? y.getAge() : 0,
        startYear: y.getStartYear(),
        endYear: y.getEndYear(),
        elementKey: stemInfo.elementKey,
        animalKey: branchInfo.animal,
      })
    }
  } catch {
    // Luck cycles unavailable — non-critical
  }

  const zodiacBranch = ec.getYearZhi()
  const zodiac = branchLabel(zodiacBranch, lang).animal

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    dayMaster: {
      gan: dayGan,
      element: dayMasterStem.element,
      elementKey: dayMasterStem.elementKey,
      polarity: dayMasterStem.polarity,
    },
    zodiac,
    luckCycles: cycles,
  }
}

export function calculateTodayPillars(lang: Language): TodayPillars {
  const now = new Date()
  const solar = Solar.fromYmdHms(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    0
  )
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  return {
    day:   makePillar(ec.getDayGan(),   ec.getDayZhi(),   lang),
    month: makePillar(ec.getMonthGan(), ec.getMonthZhi(), lang),
    year:  makePillar(ec.getYearGan(),  ec.getYearZhi(),  lang),
    date:  now.toISOString().split('T')[0],
  }
}

/** Serialize chart for API call — no PII, just stems/branches */
export function serializeChart(chart: BaziChart) {
  return {
    yearGanZhi:  `${chart.year.gan}${chart.year.zhi}`,
    monthGanZhi: `${chart.month.gan}${chart.month.zhi}`,
    dayGanZhi:   `${chart.day.gan}${chart.day.zhi}`,
    hourGanZhi:  chart.hour ? `${chart.hour.gan}${chart.hour.zhi}` : 'unknown',
    dayMaster:   chart.dayMaster.gan,
    dayMasterElement: chart.dayMaster.element,
    zodiac:      chart.zodiac,
    currentCycle: chart.luckCycles[0]?.ganZhi ?? 'unknown',
  }
}

export function serializeToday(today: TodayPillars) {
  return {
    dayGanZhi:   `${today.day.gan}${today.day.zhi}`,
    monthGanZhi: `${today.month.gan}${today.month.zhi}`,
    yearGanZhi:  `${today.year.gan}${today.year.zhi}`,
    date:        today.date,
  }
}
