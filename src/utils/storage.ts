import type { UserProfile, AuthState, DailyReading } from '../engine/types'

export interface ChatSession {
  id: string
  name: string
  date: string        // ISO date
  messages: { role: 'user' | 'assistant'; content: string }[]
}

const KEYS = {
  AUTH:          'baczi_auth',
  PROFILE:       'baczi_profile',
  READING:       'baczi_reading',
  ADMIN_TOKEN:   'baczi_admin_token',
  SESSIONS:      'baczi_sessions',
  LANG:          'baczi_lang',
  REMINDER_DATE: 'baczi_reminder_date',
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

export function loadLang(): import('../engine/types').Language | null {
  const v = localStorage.getItem(KEYS.LANG)
  return (v === 'bg' || v === 'ru' || v === 'en') ? v : null
}

export function saveLang(lang: import('../engine/types').Language) {
  localStorage.setItem(KEYS.LANG, lang)
}

export function loadReminderDate(): string | null {
  return localStorage.getItem(KEYS.REMINDER_DATE)
}

export function saveReminderDate(date: string) {
  localStorage.setItem(KEYS.REMINDER_DATE, date)
}

export function loadChatSessions(): ChatSession[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SESSIONS) ?? '[]') as ChatSession[]
  } catch { return [] }
}

export function saveChatSessions(sessions: ChatSession[]) {
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions))
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
