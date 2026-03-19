import type { UserProfile, AuthState, DailyReading } from '../engine/types'

const KEYS = {
  AUTH:        'baczi_auth',
  PROFILE:     'baczi_profile',
  READING:     'baczi_reading',  // { date, data }
  ADMIN_TOKEN: 'baczi_admin_token',
} as const

export function saveAuth(auth: AuthState) {
  localStorage.setItem(KEYS.AUTH, JSON.stringify(auth))
}

export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(KEYS.AUTH)
    return raw ? (JSON.parse(raw) as AuthState) : null
  } catch {
    return null
  }
}

export function clearAuth() {
  localStorage.removeItem(KEYS.AUTH)
}

export function saveProfile(profile: UserProfile) {
  localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile))
}

export function loadProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function clearProfile() {
  localStorage.removeItem(KEYS.PROFILE)
}

export function saveReading(reading: DailyReading) {
  localStorage.setItem(KEYS.READING, JSON.stringify({ date: reading.date, data: reading }))
}

export function loadTodayReading(): DailyReading | null {
  try {
    const raw = localStorage.getItem(KEYS.READING)
    if (!raw) return null
    const { date, data } = JSON.parse(raw) as { date: string; data: DailyReading }
    const today = new Date().toISOString().split('T')[0]
    return date === today ? data : null
  } catch {
    return null
  }
}

export function saveAdminToken(token: string) {
  localStorage.setItem(KEYS.ADMIN_TOKEN, token)
}

export function loadAdminToken(): string | null {
  return localStorage.getItem(KEYS.ADMIN_TOKEN)
}

export function clearAdminToken() {
  localStorage.removeItem(KEYS.ADMIN_TOKEN)
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
