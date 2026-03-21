import { useState, useEffect, useMemo } from 'react'
import TokenBadge from './components/TokenBadge'
import Passphrase from './screens/Passphrase'
import Setup from './screens/Setup'
import LangSelect from './screens/LangSelect'
import Today from './screens/Today'
import MyChart from './screens/MyChart'
import LuckyDates from './screens/LuckyDates'
import Settings from './screens/Settings'
import AskBazi from './screens/AskBazi'
import Activations from './screens/Activations'
import FengShui from './screens/FengShui'
import Qmdj from './screens/Qmdj'
import Learning from './screens/Learning'
import History from './screens/History'
import AdminPanel from './screens/AdminPanel'
import AdminDashboard from './screens/AdminDashboard'
import LockedFeature from './components/LockedFeature'
import TabBar, { type Tab } from './components/TabBar'
import { loadAuth, loadProfile, saveProfile, saveLang, loadLang, clearAll, loadSidebarCollapsed, saveSidebarCollapsed } from './utils/storage'
import { useDailyReminder } from './utils/dailyReminder'
import { calculateChart } from './engine/baziCalculator'
import type { Language, Theme, Tier, UserProfile } from './engine/types'

type AppState = 'lang' | 'passphrase' | 'setup' | 'admin' | 'app'

function applyTheme(theme: Theme | undefined) {
  const t = theme ?? 'daylight'
  document.documentElement.setAttribute('data-theme', t)
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    if (!loadLang()) return 'lang'
    if (!loadAuth()) return 'passphrase'
    if (!loadProfile()) return 'setup'
    return 'app'
  })
  const [profile, setProfile] = useState<UserProfile | null>(() => loadProfile())
  const [lang, setLang] = useState<Language>(() => loadLang() ?? loadProfile()?.language ?? 'bg')
  const [tab, setTab] = useState<Tab>('today')
  const [collapsed, setCollapsed] = useState(() => loadSidebarCollapsed())
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

  useEffect(() => { applyTheme(profile?.theme) }, [profile?.theme])

  useEffect(() => {
    if (state === 'app' && !loadAuth()) setState('passphrase')
  }, [state])

  useDailyReminder(chart, lang)

  function toggleCollapse() {
    const next = !collapsed
    setCollapsed(next)
    saveSidebarCollapsed(next)
  }

  function handleLangSelect(newLang: Language) {
    saveLang(newLang)
    setLang(newLang)
    setState('passphrase')
  }

  function handleAuthSuccess() {
    const auth = loadAuth()
    if (auth?.tier === 'admin') { setState('admin'); return }
    if (loadProfile()) setState('app')
    else setState('setup')
  }

  function handleSetupDone() {
    const p = loadProfile()
    setProfile(p)
    if (p) { setLang(p.language); applyTheme(p.theme) }
    setState('app')
  }

  function handleSkipSetup() { setState('app') }

  function handleLangChange(newLang: Language) {
    saveLang(newLang)
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
    applyTheme('daylight')
    setState('passphrase')
  }

  function handleUpgrade() {
    const newAuth = loadAuth()
    if (newAuth?.tier === 'admin') { setState('admin'); return }
    if (loadProfile()) setState('app')
    else setState('setup')
  }

  if (state === 'lang') return <LangSelect onSelect={handleLangSelect} />
  if (state === 'passphrase') return <Passphrase lang={lang} onSuccess={handleAuthSuccess} />
  if (state === 'admin') {
    return (
      <AdminDashboard
        lang={lang}
        onGoToApp={() => { if (loadProfile()) setState('app'); else setState('setup') }}
      />
    )
  }
  if (state === 'setup') return <Setup lang={lang} onDone={handleSetupDone} onSkip={handleSkipSetup} />

  const needsProfile = !profile
  const setupPrompt = (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="text-5xl mb-4">✨</div>
      <h2 className="text-xl font-semibold text-zinc-100 mb-2">
        {lang === 'bg' ? 'Настрой профила си' : lang === 'ru' ? 'Настройте профиль' : 'Set up your profile'}
      </h2>
      <p className="text-zinc-500 text-sm mb-6 max-w-xs">
        {lang === 'bg' ? 'Въведи данните си за раждане, за да получиш персонализирани четения' :
         lang === 'ru' ? 'Введите данные о рождении, чтобы получать персонализированные трактовки' :
         'Enter your birth data to receive personalized readings'}
      </p>
      <button
        onClick={() => setState('setup')}
        className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl px-6 py-3 transition-colors"
      >
        {lang === 'bg' ? '🔮 Въведи данни' : lang === 'ru' ? '🔮 Ввести данные' : '🔮 Enter data'}
      </button>
    </div>
  )

  const auth = loadAuth()
  const isPaidTier = tier === 'pro' || tier === 'max' || tier === 'admin'
  const sidebarWidth = collapsed ? 'md:pl-16' : 'md:pl-52'

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      {/* Global token badge */}
      {auth && tab !== 'today' && (
        <div className={`fixed top-3 right-4 z-50 transition-all duration-300`}>
          <TokenBadge balance={auth.balance} tier={auth.tier} resetDate={auth.resetDate} lang={lang} />
        </div>
      )}

      <div className={`${sidebarWidth} transition-all duration-300`}>
        {tab === 'today'       && (needsProfile ? setupPrompt : <Today profile={profile!} lang={lang} />)}
        {tab === 'chart'       && (needsProfile ? setupPrompt : <MyChart profile={profile!} lang={lang} />)}
        {tab === 'activations' && (
          !isPaidTier
            ? <LockedFeature feature="activations" lang={lang} onUpgrade={handleUpgrade} />
            : needsProfile ? setupPrompt : <Activations profile={profile!} lang={lang} />
        )}
        {tab === 'fengshui'    && (
          !isPaidTier
            ? <LockedFeature feature="fengshui" lang={lang} onUpgrade={handleUpgrade} />
            : needsProfile ? setupPrompt : <FengShui profile={profile!} lang={lang} />
        )}
        {tab === 'qmdj'        && (
          !isPaidTier
            ? <LockedFeature feature="qmdj" lang={lang} onUpgrade={handleUpgrade} />
            : <Qmdj lang={lang} />
        )}
        {tab === 'ask'         && (needsProfile ? setupPrompt : (chart && (
          <AskBazi
            chart={chart}
            lang={lang}
            onNavigateToNotes={() => setTab('learn')}
          />
        )))}
        {tab === 'learn'       && (
          <Learning
            lang={lang}
            chart={chart}
          />
        )}
        {tab === 'history'     && <History lang={lang} />}
        {tab === 'lucky'       && (needsProfile ? setupPrompt : <LuckyDates profile={profile!} lang={lang} />)}
        {tab === 'settings'    && (
          needsProfile
            ? <Setup lang={lang} onDone={handleSetupDone} onSkip={handleSkipSetup} />
            : <Settings
                profile={profile!}
                lang={lang}
                onLangChange={handleLangChange}
                onThemeChange={handleThemeChange}
                onReset={handleReset}
              />
        )}
        {tab === 'admin' && tier === 'admin' && <AdminPanel />}
      </div>

      <TabBar
        active={tab}
        onSelect={setTab}
        lang={lang}
        tier={tier}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
    </div>
  )
}
