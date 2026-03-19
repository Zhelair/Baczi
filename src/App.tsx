import { useState, useEffect } from 'react'
import Passphrase from './screens/Passphrase'
import Setup from './screens/Setup'
import Today from './screens/Today'
import MyChart from './screens/MyChart'
import LuckyDates from './screens/LuckyDates'
import Settings from './screens/Settings'
import AdminPanel from './screens/AdminPanel'
import TabBar, { type Tab } from './components/TabBar'
import { loadAuth, loadProfile, saveProfile, clearAll } from './utils/storage'
import type { Language, Theme, Tier, UserProfile } from './engine/types'

type AppState = 'passphrase' | 'setup' | 'app'

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

  // Apply theme on mount and whenever profile.theme changes
  useEffect(() => {
    applyTheme(profile?.theme)
  }, [profile?.theme])

  useEffect(() => {
    if (state === 'app' && !loadAuth()) setState('passphrase')
  }, [state])

  function handleAuthSuccess() {
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
