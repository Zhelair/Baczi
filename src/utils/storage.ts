import type { UserProfile, AuthState, DailyReading } from '../engine/types'

export interface ChatSession {
  id: string
  name: string
  date: string        // ISO date
  messages: { role: 'user' | 'assistant'; content: string }[]
}

export interface LearningNote {
  id: string
  topicId: string
  topicTitle: string
  content: string
  date: string        // ISO date
}

export type TopicStatus = 'not_started' | 'in_progress' | 'completed'

const KEYS = {
  AUTH:              'baczi_auth',
  PROFILE:           'baczi_profile',
  READING:           'baczi_reading',
  ADMIN_TOKEN:       'baczi_admin_token',
  SESSIONS:          'baczi_sessions',
  LANG:              'baczi_lang',
  REMINDER_DATE:     'baczi_reminder_date',
  NOTES:             'baczi_notes',
  TOPIC_PROGRESS:    'baczi_topic_progress',
  SIDEBAR_COLLAPSED: 'baczi_sidebar_collapsed',
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

export function loadNotes(): LearningNote[] {
  try { return JSON.parse(localStorage.getItem(KEYS.NOTES) ?? '[]') as LearningNote[] }
  catch { return [] }
}

export function saveNotes(notes: LearningNote[]) {
  localStorage.setItem(KEYS.NOTES, JSON.stringify(notes))
}

export function loadTopicProgress(): Record<string, TopicStatus> {
  try { return JSON.parse(localStorage.getItem(KEYS.TOPIC_PROGRESS) ?? '{}') as Record<string, TopicStatus> }
  catch { return {} }
}

export function saveTopicProgress(progress: Record<string, TopicStatus>) {
  localStorage.setItem(KEYS.TOPIC_PROGRESS, JSON.stringify(progress))
}

export function loadSidebarCollapsed(): boolean {
  return localStorage.getItem(KEYS.SIDEBAR_COLLAPSED) === 'true'
}

export function saveSidebarCollapsed(v: boolean) {
  localStorage.setItem(KEYS.SIDEBAR_COLLAPSED, String(v))
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
