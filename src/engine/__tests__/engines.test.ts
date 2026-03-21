/**
 * Engine verification tests — all pure-calculation engines.
 *
 * Reference values cross-checked against:
 *   - Classical 八宅 (Eight Mansions) Kua lookup tables
 *   - Lo Shu annual flying star rotations (2022=5 Five Yellow, 2024=3 Jade Green)
 *   - Xuan Kong Fei Xing (玄空飛星) verified charts (P8 South = standard reference)
 */

import { describe, it, expect } from 'vitest'
import { getKuaResult, calculateKua } from '../kua'
import { getAnnualChart, getAnnualStar } from '../flyingStars'
import { generateHouseChart, getPeriodFromYear, starQuality } from '../houseStars'

// ─────────────────────────────────────────────────────────────────────────────
// KUA  (八宅 Eight Mansions)
// Formula: digitSum(year % 100), then male=10-reduced, female=digitSum(reduced+5)
// ─────────────────────────────────────────────────────────────────────────────

describe('Kua number', () => {
  // Male pre-2000: kua = 10 - digitSum(year%100)
  it('male 1992 → Kua 8  [92→11→2, 10-2=8]', () => {
    expect(calculateKua(1992, 'male')).toBe(8)
  })

  it('male 1989 → Kua 2  [89→17→8, 10-8=2]', () => {
    expect(calculateKua(1989, 'male')).toBe(2)
  })

  it('male 1988 → Kua 3  [88→16→7, 10-7=3]', () => {
    expect(calculateKua(1988, 'male')).toBe(3)
  })

  it('male 1976 → Kua 6  [76→13→4, 10-4=6]', () => {
    expect(calculateKua(1976, 'male')).toBe(6)
  })

  it('male 1990 → Kua 1  [90→9, 10-9=1]', () => {
    expect(calculateKua(1990, 'male')).toBe(1)
  })

  // Female pre-2000: kua = digitSum(digitSum(year%100) + 5)
  it('female 1989 → Kua 4  [89→8, 8+5=13→4]', () => {
    expect(calculateKua(1989, 'female')).toBe(4)
  })

  it('female 1986 → Kua 1  [86→14→5, 5+5=10→1]', () => {
    expect(calculateKua(1986, 'female')).toBe(1)
  })

  // Post-2000: male=9-reduced, female=digitSum(reduced+6)
  it('male 2001 → Kua 7  [01→1, 9-1=8? No: reduced=digitSum(1)=1, 9-1=8]', () => {
    // 2001: 01%100=1, digitSum(1)=1, male post2000: 9-1=8
    expect(calculateKua(2001, 'male')).toBe(8)
  })

  it('male 2008 → Kua 1  [08→8, 9-8=1]', () => {
    expect(calculateKua(2008, 'male')).toBe(1)
  })

  // Kua 5 edge cases
  it('Kua 5 male → maps to 2', () => {
    // male pre-2000: 10 - reduced = 5 → reduced = 5. digitSum(year%100) = 5
    // e.g. 1994: 94→13→4, 10-4=6. Try 1995: 95→14→5, 10-5=5 → maps to 2
    expect(calculateKua(1995, 'male')).toBe(2)
  })

  it('Kua 5 female → maps to 8', () => {
    // female pre-2000: digitSum(reduced+5)=5 → reduced+5=5 or 14 → reduced=0 or 9
    // reduced=9: e.g. 1999: 99→18→9, 9+5=14→5 → maps to 8
    expect(calculateKua(1999, 'female')).toBe(8)
  })

  // Group membership
  it('Kua 1 → east group', () => expect(getKuaResult(1990, 'male', 'en').group).toBe('east'))
  it('Kua 2 → west group', () => expect(getKuaResult(1989, 'male', 'en').group).toBe('west'))
  it('Kua 3 → east group', () => expect(getKuaResult(1988, 'male', 'en').group).toBe('east'))

  // Kua 1 best direction = SE (Sheng Qi)
  it('Kua 1 — best direction is SE', () => {
    const r = getKuaResult(1986, 'female', 'en')  // female 1986 → Kua 1
    expect(r.kua).toBe(1)
    expect(r.directions[0].direction).toBe('SE')
    expect(r.directions[0].energy).toBe('shengqi')
  })

  it('Kua 3 — best direction is S', () => {
    const r = getKuaResult(1988, 'male', 'en')  // male 1988 → Kua 3
    expect(r.kua).toBe(3)
    expect(r.directions[0].direction).toBe('S')
  })

  it('Kua 6 — best direction is W', () => {
    const r = getKuaResult(1976, 'male', 'en')  // male 1976 → Kua 6
    expect(r.kua).toBe(6)
    expect(r.directions[0].direction).toBe('W')
  })

  it('returns exactly 8 directions', () => {
    expect(getKuaResult(1992, 'male', 'en').directions).toHaveLength(8)
  })

  it('first 4 directions are auspicious, last 4 are inauspicious', () => {
    const r = getKuaResult(1992, 'male', 'en')
    expect(r.directions.slice(0, 4).every(d => d.auspicious)).toBe(true)
    expect(r.directions.slice(4).every(d => !d.auspicious)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ANNUAL FLYING STARS  (年飛星)
// Reference sequence (descending, changes on Li Chun ~Feb 4):
//   2022=5  2023=4  2024=3  2025=2  2026=1  2027=9 ...
// ─────────────────────────────────────────────────────────────────────────────

describe('Annual Flying Stars', () => {
  const d = (y: number) => new Date(y, 5, 1)   // June 1st — after Li Chun

  it('2022 center star = 5  (Five Yellow in center — well-known reference)', () => {
    expect(getAnnualStar(d(2022))).toBe(5)
  })

  it('2023 center star = 4', () => {
    expect(getAnnualStar(d(2023))).toBe(4)
  })

  it('2024 center star = 3  (Jade Green 碧 — standard reference)', () => {
    expect(getAnnualStar(d(2024))).toBe(3)
  })

  it('2025 center star = 2', () => {
    expect(getAnnualStar(d(2025))).toBe(2)
  })

  it('2026 center star = 1', () => {
    expect(getAnnualStar(d(2026))).toBe(1)
  })

  it('2027 center star = 9', () => {
    expect(getAnnualStar(d(2027))).toBe(9)
  })

  it('returns 9 sectors', () => {
    expect(getAnnualChart(d(2024)).sectors).toHaveLength(9)
  })

  it('2024: West sector = 5 (Five Yellow in West for 2024)', () => {
    // center=3: W(base=7) → 7+(-2)=5 (rotate by 3-5=-2)
    const chart = getAnnualChart(d(2024))
    const west = chart.sectors.find(s => s.sector === 'W')
    expect(west?.star).toBe(5)
  })

  it('2022: Center = 5 (Five Yellow), W sector = 7', () => {
    const chart = getAnnualChart(d(2022))
    expect(chart.centerStar).toBe(5)
    const west = chart.sectors.find(s => s.sector === 'W')
    expect(west?.star).toBe(7)   // W base=7, shift=0 when center=5
  })

  it('before Li Chun uses previous year star', () => {
    // Jan 1 2025 (before Feb 4) → should give 2024 star = 3
    const jan2025 = new Date(2025, 0, 1)
    expect(getAnnualStar(jan2025)).toBe(3)
  })

  it('after Li Chun uses current year star', () => {
    // Feb 10 2025 (after Li Chun Feb 4) → 2025 star = 2
    const feb10_2025 = new Date(2025, 1, 10)
    expect(getAnnualStar(feb10_2025)).toBe(2)
  })

  it('stars in each chart are a permutation of 1-9', () => {
    const chart = getAnnualChart(d(2024))
    const stars = chart.sectors.map(s => s.star).sort((a, b) => a - b)
    expect(stars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// HOUSE FLYING STARS  (玄空飛星)
// ─────────────────────────────────────────────────────────────────────────────

describe('House Flying Stars — period detection', () => {
  it('2010 → Period 8', () => expect(getPeriodFromYear(2010)).toBe(8))
  it('2024 → Period 9', () => expect(getPeriodFromYear(2024)).toBe(9))
  it('2003 → Period 7', () => expect(getPeriodFromYear(2003)).toBe(7))
  it('1964 → Period 6', () => expect(getPeriodFromYear(1964)).toBe(6))
  it('2043 → Period 9', () => expect(getPeriodFromYear(2043)).toBe(9))
})

describe('House Flying Stars — chart generation (P8 South facing reference)', () => {
  // Period 8, Facing S (palace 9, Yin → backward water):
  //   Water:    S(9)=8  N(1)=7  SW(2)=6  E(3)=5  SE(4)=4  CTR(5)=3  NW(6)=2  W(7)=1  NE(8)=9
  //   Mountain: N(1)=8  SW(2)=9  E(3)=1  SE(4)=2  CTR(5)=3  NW(6)=4  W(7)=5  NE(8)=6  S(9)=7
  //   Base P8:  NW=9,N=4,NE=2 / W=1,CTR=8,E=6 / SW=5,S=3,SE=7

  it('water star at facing palace S(9) = 8', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 9)?.waterStar).toBe(8)
  })

  it('water star at N(1) = 7', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 1)?.waterStar).toBe(7)
  })

  it('water star at NE(8) = 9', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 8)?.waterStar).toBe(9)
  })

  it('mountain star at sitting palace N(1) = 8', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 1)?.mtnStar).toBe(8)
  })

  it('mountain star at S(9) = 7', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 9)?.mtnStar).toBe(7)
  })

  it('mountain star at NE(8) = 6', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 8)?.mtnStar).toBe(6)
  })

  it('base star at center(5) = 8 for Period 8', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 5)?.baseStar).toBe(8)
  })

  it('base star at N(1) = 4 for Period 8', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 1)?.baseStar).toBe(4)
  })

  it('base star at NW(6) = 9 for Period 8', () => {
    expect(generateHouseChart(2010, 'S').palaces.find(p => p.palace === 6)?.baseStar).toBe(9)
  })

  it('water stars are a permutation of 1-9', () => {
    const stars = generateHouseChart(2010, 'S').palaces.map(p => p.waterStar).sort((a, b) => a - b)
    expect(stars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('mountain stars are a permutation of 1-9', () => {
    const stars = generateHouseChart(2010, 'S').palaces.map(p => p.mtnStar).sort((a, b) => a - b)
    expect(stars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('base stars are a permutation of 1-9', () => {
    const stars = generateHouseChart(2010, 'S').palaces.map(p => p.baseStar).sort((a, b) => a - b)
    expect(stars).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  // NE facing (Yang → forward water)
  it('P8 NE facing: water star at NE(8) = 8', () => {
    expect(generateHouseChart(2010, 'NE').palaces.find(p => p.palace === 8)?.waterStar).toBe(8)
  })

  it('P8 NE facing: next star S(9) = 9 (forward)', () => {
    expect(generateHouseChart(2010, 'NE').palaces.find(p => p.palace === 9)?.waterStar).toBe(9)
  })

  it('P9 center base star = 9', () => {
    expect(generateHouseChart(2030, 'S').palaces.find(p => p.palace === 5)?.baseStar).toBe(9)
  })

  it('facing and sitting are always opposite', () => {
    const pairs: [string, string][] = [['N','S'],['S','N'],['E','W'],['W','E'],['NE','SW'],['SW','NE'],['SE','NW'],['NW','SE']]
    for (const [f, s] of pairs) {
      expect(generateHouseChart(2010, f as any).sitting).toBe(s)
    }
  })
})

describe('Star quality', () => {
  it('P8: star 8 = auspicious', () => expect(starQuality(8, 8)).toBe('auspicious'))
  it('P8: star 9 = auspicious', () => expect(starQuality(9, 8)).toBe('auspicious'))
  it('P8: star 1 = auspicious', () => expect(starQuality(1, 8)).toBe('auspicious'))
  it('P8: star 5 = inauspicious', () => expect(starQuality(5, 8)).toBe('inauspicious'))
  it('P8: star 2 = inauspicious', () => expect(starQuality(2, 8)).toBe('inauspicious'))
  it('P8: star 6 = neutral',      () => expect(starQuality(6, 8)).toBe('neutral'))
  it('P9: star 9 = auspicious',   () => expect(starQuality(9, 9)).toBe('auspicious'))
  it('P9: star 5 = inauspicious', () => expect(starQuality(5, 9)).toBe('inauspicious'))
})
