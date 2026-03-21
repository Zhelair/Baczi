import type { UserProfile, AuthState, DailyReading, Gender } from '../engine/types'

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

export type HistoryTool = 'today' | 'ask' | 'lucky' | 'study'

export interface HistoryEntry {
  id: string
  tool: HistoryTool
  title: string       // e.g. "Daily Reading – 21 Mar" or topic name
  summary: string     // first ~120 chars of the main content
  date: string        // ISO date
  data: unknown       // full serialized payload
}

// ─── Person profiles ─────────────────────────────────────────────────────────
export interface PersonProfile {
  id: string
  name: string
  birthYear: number
  birthMonth: number
  birthDay: number
  birthHour: number | null
  birthMinute: number | null
  gender: Gender
  birthCity?: string
  birthLongitude?: number
  birthLatitude?: number
  birthUtcOffset?: number
  note?: string
  addedAt: string     // ISO date
}

// Full project export/import format
export interface BaziProject {
  version: '1'
  type: 'bazi_project'
  exportedAt: string
  profile: UserProfile
  history: HistoryEntry[]
  notes: LearningNote[]
  chatSessions: ChatSession[]
  topicProgress: Record<string, TopicStatus>
}

const HISTORY_MAX = 100  // max entries total

const KEYS = {
  AUTH:              'baczi_auth',
  HISTORY:           'baczi_history',
  PROFILE:           'baczi_profile',
  READING:           'baczi_reading',
  ADMIN_TOKEN:       'baczi_admin_token',
  SESSIONS:          'baczi_sessions',
  LANG:              'baczi_lang',
  REMINDER_DATE:     'baczi_reminder_date',
  NOTES:             'baczi_notes',
  TOPIC_PROGRESS:    'baczi_topic_progress',
  SIDEBAR_COLLAPSED: 'baczi_sidebar_collapsed',
  PERSONS:           'baczi_persons',
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

export function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(KEYS.HISTORY) ?? '[]') as HistoryEntry[] }
  catch { return [] }
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): string {
  const id = `${entry.tool}_${Date.now()}`
  const all = loadHistory()
  const updated = [{ ...entry, id }, ...all].slice(0, HISTORY_MAX)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
  return id
}

export function updateHistoryEntry(id: string, entry: Omit<HistoryEntry, 'id'>) {
  const all = loadHistory()
  const idx = all.findIndex(e => e.id === id)
  if (idx === -1) { addHistoryEntry(entry); return }
  all[idx] = { ...entry, id }
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(all))
}

export function deleteHistoryEntry(id: string) {
  const updated = loadHistory().filter(e => e.id !== id)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
}

export function clearHistoryByTool(tool: HistoryTool) {
  const updated = loadHistory().filter(e => e.tool !== tool)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
}

// ─── Persons ──────────────────────────────────────────────────────────────────
export function loadPersons(): PersonProfile[] {
  try { return JSON.parse(localStorage.getItem(KEYS.PERSONS) ?? '[]') as PersonProfile[] }
  catch { return [] }
}

export function savePersons(persons: PersonProfile[]) {
  localStorage.setItem(KEYS.PERSONS, JSON.stringify(persons))
}

export function addPerson(person: Omit<PersonProfile, 'id' | 'addedAt'>): PersonProfile {
  const full: PersonProfile = { ...person, id: `person_${Date.now()}`, addedAt: new Date().toISOString().split('T')[0] }
  savePersons([full, ...loadPersons()])
  return full
}

export function deletePerson(id: string) {
  savePersons(loadPersons().filter(p => p.id !== id))
}

// ─── Full project export/import ───────────────────────────────────────────────
export function exportProject(profile: UserProfile): BaziProject {
  return {
    version: '1',
    type: 'bazi_project',
    exportedAt: new Date().toISOString(),
    profile,
    history: loadHistory(),
    notes: loadNotes(),
    chatSessions: loadChatSessions(),
    topicProgress: loadTopicProgress(),
  }
}

export function importProject(project: BaziProject) {
  if (project.profile) saveProfile(project.profile)
  if (Array.isArray(project.chatSessions)) saveChatSessions(project.chatSessions)
  if (Array.isArray(project.notes)) saveNotes(project.notes)
  if (project.topicProgress) saveTopicProgress(project.topicProgress)
  if (Array.isArray(project.history)) {
    // Merge: keep existing + add new (dedupe by id)
    const existing = loadHistory()
    const existingIds = new Set(existing.map(e => e.id))
    const merged = [...project.history.filter(e => !existingIds.has(e.id)), ...existing].slice(0, HISTORY_MAX)
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(merged))
  }
}

export function clearAll() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k))
}
