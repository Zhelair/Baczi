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
import Persons from './screens/Persons'
import AdminPanel from './screens/AdminPanel'
import AdminDashboard from './screens/AdminDashboard'
import LockedFeature from './components/LockedFeature'
import TabBar, { type Tab } from './components/TabBar'
import { loadAuth, loadProfile, saveProfile, saveLang, loadLang, clearAll, loadSidebarCollapsed, saveSidebarCollapsed, loadPersons, type PersonProfile } from './utils/storage'
import { useDailyReminder } from './utils/dailyReminder'
import { calculateChart } from './engine/baziCalculator'
import type { Language, Theme, Tier, UserProfile } from './engine/types'
import type { GuideEntry } from './data/guideContent'
import GuideModal from './components/GuideModal'

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
  const [tabKey, setTabKey] = useState(0)  // increments on same-tab re-click to force re-mount
  const [collapsed, setCollapsed] = useState(() => loadSidebarCollapsed())
  const [activePersonId, setActivePersonId] = useState<string | null>(null)
  const [guideMode, setGuideMode] = useState(false)
  const [guideEntry, setGuideEntry] = useState<GuideEntry | null>(null)
  const tier = loadAuth()?.tier as Tier | undefined

  function handleTabSelect(newTab: Tab) {
    if (newTab === tab) setTabKey(k => k + 1)  // same tab clicked: reset sub-navigation
    else setTab(newTab)
  }

  // When viewing someone else's chart, use their data as effectiveProfile
  const activePerson: PersonProfile | null = activePersonId
    ? loadPersons().find(p => p.id === activePersonId) ?? null
    : null
  const effectiveProfile: UserProfile | null = activePerson
    ? {
        name: activePerson.name,
        birthYear: activePerson.birthYear,
        birthMonth: activePerson.birthMonth,
        birthDay: activePerson.birthDay,
        birthHour: activePerson.birthHour,
        birthMinute: activePerson.birthMinute,
        gender: activePerson.gender,
        birthCity: activePerson.birthCity,
        birthLongitude: activePerson.birthLongitude,
        birthLatitude: activePerson.birthLatitude,
        birthUtcOffset: activePerson.birthUtcOffset,
        language: lang,
        theme: profile?.theme ?? 'dark',
      }
    : profile

  const chart = useMemo(() => {
    if (!effectiveProfile) return null
    try {
      return calculateChart(
        effectiveProfile.birthYear, effectiveProfile.birthMonth, effectiveProfile.birthDay,
        effectiveProfile.birthHour ?? null, effectiveProfile.birthMinute ?? null,
        effectiveProfile.gender, lang,
        effectiveProfile.birthLongitude, effectiveProfile.birthUtcOffset
      )
    } catch { return null }
  }, [effectiveProfile, lang])

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

  const needsProfile = !effectiveProfile
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
      {/* Guide mode modal */}
      {guideEntry && (
        <GuideModal
          entry={guideEntry}
          lang={lang}
          onClose={() => setGuideEntry(null)}
        />
      )}

      {/* Global token badge + guide toggle */}
      <div className={`fixed top-3 right-4 z-50 flex items-center gap-2 transition-all duration-300`}>
        <button
          onClick={() => setGuideMode(m => !m)}
          title={guideMode
            ? (lang === 'ru' ? 'Выйти из режима гида' : lang === 'bg' ? 'Изход от режим гид' : 'Exit guide mode')
            : (lang === 'ru' ? 'Режим гида' : lang === 'bg' ? 'Режим гид' : 'Guide mode')}
          className={`w-7 h-7 rounded-full border text-sm font-bold transition-colors ${
            guideMode
              ? 'bg-amber-500/25 border-amber-500/60 text-amber-400 animate-pulse'
              : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
          }`}
        >?</button>
        {auth && tab !== 'today' && (
          <TokenBadge balance={auth.balance} tier={auth.tier} resetDate={auth.resetDate} lang={lang} />
        )}
      </div>

      <div className={`${sidebarWidth} transition-all duration-300`}>
        {/* Guide mode banner — shown on all tabs when ? is active */}
        {guideMode && (() => {
          const tips: Partial<Record<Tab, Record<Language, string>>> = {
            today:       { bg: '☀️ Днес: Виждаш дневните енергии и личното си четене. Кликни на стълбовете за тяхното значение.', ru: '☀️ Сегодня: здесь дневные энергии и личное чтение. Нажимай на столпы, чтобы узнать их значение.', en: '☀️ Today: daily energies and personal reading. Tap pillars to learn their meaning.' },
            chart:       { bg: '📖 Карта: Четирите стълба показват твоята BaZi карта. Натисни Господаря на деня — ще видиш обяснение.', ru: '📖 Карта: Четыре столпа — твоя карта Ба-Цзы. Нажми на Хозяина дня, чтобы увидеть объяснение.', en: '📖 Chart: Four Pillars show your BaZi. Tap Day Master to see its guide explanation.' },
            activations: { bg: '⚡ Активации: Виждаш как текущите енергии влияят на твоята карта. Кликни на всеки елемент за подробности.', ru: '⚡ Активации: текущие энергии влияют на твою карту. Нажимай на элементы для деталей.', en: '⚡ Activations: current energies vs your chart. Tap elements for details.' },
            fengshui:    { bg: '🧭 Фън Шуй: Куа → личните посоки. Натал. карта → сектори на жилището. Виж раздела "Как да го ползвам" долу.', ru: '🧭 Фэн Шуй: Гуа → личные направления. Натал. карта → секторы жилища. Смотри раздел "Как использовать" ниже.', en: '🧭 Feng Shui: Kua → personal directions. House Chart → home sectors. See the "How to use" guide below.' },
            qmdj:        { bg: '🔯 КМДЖ: Зелена ✅ врата = действай. Кликни на дворец за детайли. Насочи се физически в тази посока за важни действия.', ru: '🔯 ЦМДЦ: Зелёная ✅ врата = действуй. Нажми на дворец для деталей. Физически направляйся туда для важных дел.', en: '🔯 QMDJ: Green ✅ gate = act. Tap a palace for details. Physically move in that direction for important actions.' },
            ask:         { bg: '💬 Спроси: Задавай въпроси за BaZi картата си. Можеш да прикачиш .txt, .md или .pdf файл за анализ.', ru: '💬 Спроси: задавай вопросы о своей карте Ба-Цзы. Можно прикрепить .txt, .md или .pdf для анализа.', en: '💬 Ask: chat about your BaZi chart. Attach .txt, .md, or .pdf files for analysis.' },
            learn:       { bg: '📚 Обучение: Изучавай BaZi и Chinese Metaphysics. Може да запазиш бележки от чата тук.', ru: '📚 Обучение: изучай Ба-Цзы и китайскую метафизику. Заметки из чата сохраняются здесь.', en: '📚 Learning: study BaZi and Chinese Metaphysics. Chat notes are saved here.' },
            lucky:       { bg: '🍀 Удача: Виждаш текущата дневна енергия и щастливите часове.', ru: '🍀 Удача: текущая дневная энергия и удачные часы.', en: '🍀 Lucky: current daily energy and your lucky hours.' },
          }
          const tip = tips[tab]
          if (!tip) return null
          return (
            <div className="sticky top-0 z-40 flex items-start gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
              <p className="text-xs text-amber-300 leading-snug flex-1">{tip[lang]}</p>
              <button onClick={() => setGuideMode(false)} className="text-zinc-600 hover:text-zinc-400 text-sm shrink-0 mt-0.5" aria-label="exit guide">✕</button>
            </div>
          )
        })()}
        {/* Active person banner */}
        {activePerson && tab !== 'persons' && tab !== 'settings' && (
          <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <span className="text-xs text-amber-400">
              {lang === 'bg' ? `Гледаш: ${activePerson.name}` : lang === 'ru' ? `Просмотр: ${activePerson.name}` : `Viewing: ${activePerson.name}`}
            </span>
            <button
              onClick={() => setActivePersonId(null)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {lang === 'bg' ? '← Назад към моя' : lang === 'ru' ? '← Назад к своему' : '← Back to mine'}
            </button>
          </div>
        )}

        {tab === 'today'       && (needsProfile ? setupPrompt : <Today profile={effectiveProfile!} lang={lang} guideMode={guideMode} onGuideOpen={setGuideEntry} />)}
        {tab === 'chart'       && (needsProfile ? setupPrompt : <MyChart profile={effectiveProfile!} lang={lang} guideMode={guideMode} onGuideOpen={setGuideEntry} />)}
        {tab === 'activations' && (
          !isPaidTier
            ? <LockedFeature feature="activations" lang={lang} onUpgrade={handleUpgrade} />
            : needsProfile ? setupPrompt : <Activations profile={effectiveProfile!} lang={lang} />
        )}
        {tab === 'fengshui'    && (
          !isPaidTier
            ? <LockedFeature feature="fengshui" lang={lang} onUpgrade={handleUpgrade} />
            : needsProfile ? setupPrompt : <FengShui profile={effectiveProfile!} lang={lang} guideMode={guideMode} onGuideOpen={setGuideEntry} />
        )}
        {tab === 'qmdj'        && (
          !isPaidTier
            ? <LockedFeature feature="qmdj" lang={lang} onUpgrade={handleUpgrade} />
            : <Qmdj lang={lang} guideMode={guideMode} onGuideOpen={setGuideEntry} />
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
            key={tabKey}
            lang={lang}
            chart={chart}
          />
        )}
        {tab === 'history'     && <History key={tabKey} lang={lang} />}
        {tab === 'persons'     && profile && (
          <Persons
            ownProfile={profile}
            lang={lang}
            activePersonId={activePersonId}
            onActivate={(id) => { setActivePersonId(id); if (id) setTab('today') }}
            onViewTab={(t) => setTab(t)}
          />
        )}
        {tab === 'lucky'       && (needsProfile ? setupPrompt : <LuckyDates profile={effectiveProfile!} lang={lang} />)}
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
        onSelect={handleTabSelect}
        lang={lang}
        tier={tier}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
      />
    </div>
  )
}
