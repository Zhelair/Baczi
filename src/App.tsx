import { useState, useEffect, useMemo } from 'react'
import Passphrase from './screens/Passphrase'
import Setup from './screens/Setup'
import Today from './screens/Today'
import MyChart from './screens/MyChart'
import LuckyDates from './screens/LuckyDates'
import Settings from './screens/Settings'
import AskBazi from './screens/AskBazi'
import AdminPanel from './screens/AdminPanel'
import AdminDashboard from './screens/AdminDashboard'
import TabBar, { type Tab } from './components/TabBar'
import { loadAuth, loadProfile, saveProfile, clearAll } from './utils/storage'
import { calculateChart } from './engine/baziCalculator'
import type { Language, Theme, Tier, UserProfile } from './engine/types'

type AppState = 'passphrase' | 'setup' | 'admin' | 'app'

function applyTheme(theme: Theme | undefined) {
  const t = theme ?? 'dark'
  document.documentElement.setAttribute('data-theme', t)
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    if (!loadAuth()) return 'passphrase'
    if (!loadProfile()) return 'setup'
    return 'app'
  })
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile())
  const [lang, setLang] = useState<Language>(() => loadProfile()?.language ?? 'bg')
  const [tab, setTab] = useState<Tab>('today')
  const tier = loadAuth()?.tier as Tier | undefined

  const chart = useMemo(() => {
    if (!profile) return null
    try {
      return calculateChart(
        profile.birthYear, profile.birthMonth, profile.birthDay,
        profile.birthHour ?? null, profile.birthMinute ?? null,
        profile.gender, lang,
        profile.birthLongitude, profile.birthUtcOffset
      )
    } catch { return null }
  }, [profile, lang])

  // Apply theme on mount and whenever profile.theme changes
  useEffect(() => {
    applyTheme(profile?.theme)
  }, [profile?.theme])

  useEffect(() => {
    if (state === 'app' && !loadAuth()) setState('passphrase')
  }, [state])

  function handleAuthSuccess() {
    const auth = loadAuth()
    if (auth?.tier === 'admin') {
      setState('admin')
      return
    }
    if (loadProfile()) {
      setState('app')
    } else {
      setState('setup')
    }
  }

  function handleSetupDone() {
    const p = loadProfile()
    setProfile(p)
    if (p) {
      setLang(p.language)
      applyTheme(p.theme)
    }
    setState('app')
  }

  function handleLangChange(newLang: Language) {
    setLang(newLang)
    if (profile) {
      const updated = { ...profile, language: newLang }
      saveProfile(updated)
      setProfile(updated)
    }
  }

  function handleThemeChange(newTheme: Theme) {
    applyTheme(newTheme)
    if (profile) {
      const updated = { ...profile, theme: newTheme }
      saveProfile(updated)
      setProfile(updated)
    }
  }

  function handleReset() {
    clearAll()
    setProfile(null)
    setLang('bg')
    applyTheme('dark')
    setState('passphrase')
  }

  if (state === 'passphrase') {
    return <Passphrase lang={lang} onSuccess={handleAuthSuccess} />
  }

  // Admin lands on their own dashboard, can optionally jump into the full app
  if (state === 'admin') {
    return (
      <AdminDashboard
        lang={lang}
        onGoToApp={() => {
          if (loadProfile()) setState('app')
          else setState('setup')
        }}
      />
    )
  }

  if (state === 'setup') {
    return <Setup lang={lang} onDone={handleSetupDone} />
  }

  if (!profile) {
    return <Setup lang={lang} onDone={handleSetupDone} />
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {tab === 'today'    && <Today profile={profile} lang={lang} />}
      {tab === 'chart'    && <MyChart profile={profile} lang={lang} />}
      {tab === 'lucky'    && <LuckyDates profile={profile} lang={lang} />}
      {tab === 'ask'      && chart && <AskBazi chart={chart} lang={lang} />}
      {tab === 'settings' && (
        <Settings
          profile={profile}
          lang={lang}
          onLangChange={handleLangChange}
          onThemeChange={handleThemeChange}
          onReset={handleReset}
        />
      )}
      {tab === 'admin' && tier === 'admin' && <AdminPanel />}
      <TabBar active={tab} onSelect={setTab} lang={lang} tier={tier} />
    </div>
  )
}
