export type Language = 'bg' | 'ru' | 'en'
export type Tier = 'free' | 'pro' | 'max' | 'admin'
export type Gender = 'male' | 'female'
export type Theme = 'dark' | 'daylight' | 'neon'

export interface UserProfile {
  name: string
  birthYear: number
  birthMonth: number    // 1-12
  birthDay: number      // 1-31
  birthHour: number | null    // 0-23, null = unknown
  birthMinute: number | null
  gender: Gender
  language: Language
  theme?: Theme
  // Birth location for true solar time correction
  birthCity?: string
  birthLongitude?: number
  birthLatitude?: number
  birthUtcOffset?: number   // e.g. 6 for UTC+6
}

export interface Pillar {
  gan: string           // Heavenly Stem character e.g. 庚
  zhi: string           // Earthly Branch character e.g. 辰
  ganElement: string    // element name in current language
  ganPolarity: string   // Ян / Yang / Ян
  ganElementKey: ElementKey
  zhiAnimal: string     // animal name in current language
  zhiElement: string    // element of the branch in current language
  zhiElementKey: ElementKey
  hiddenStems: string[] // 地支藏干 — hidden stems of the earthly branch
}

export interface BaziChart {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar | null   // null if birth time unknown
  dayMaster: {
    gan: string
    element: string
    elementKey: ElementKey
    polarity: string
  }
  zodiac: string
  luckCycles: LuckCycle[]
}

export interface LuckCycle {
  gan: string
  zhi: string
  ganZhi: string
  startAge: number
  startYear: number
  endYear: number
  elementKey: ElementKey
  animalKey: string
}

export interface TodayPillars {
  day: Pillar
  month: Pillar
  year: Pillar
  date: string          // ISO date string
}

export interface LifeAreaRating {
  key: string
  emoji: string
  score: number         // 1-5
  tip: string
}

export interface DailyReading {
  date: string
  interpretation: string
  lifeAreas: LifeAreaRating[]
  luckyHours: string[]
  tokensRemaining: number
}

export interface TokenState {
  balance: number
  tier: Tier
  resetDate: string
}

export interface AuthState {
  token: string
  tier: Tier
  balance: number
  resetDate: string
}

// ─── Element keys for color-coding ───────────────────────────────────────────
export type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water'

export const TOKEN_COSTS = {
  DAILY_READING: 50,
  LUCK_CHECK: 20,
  LUCKY_DATES: 30,
  CHART_VIEW: 0,
} as const

export const MONTHLY_TOKENS: Record<Tier, number> = {
  free: 500,
  pro: 2000,
  max: 10000,
  admin: 999999,
}
