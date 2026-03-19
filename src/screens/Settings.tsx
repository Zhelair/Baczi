import { LogOut, Trash2 } from 'lucide-react'
import { t } from '../engine/translations'
import { clearAll, loadAuth } from '../utils/storage'
import TokenBadge from '../components/TokenBadge'
import type { Language, Theme, UserProfile } from '../engine/types'

interface Props {
  profile: UserProfile
  lang: Language
  onLangChange: (lang: Language) => void
  onThemeChange: (theme: Theme) => void
  onReset: () => void
}

const LANGS: { value: Language; label: string }[] = [
  { value: 'bg', label: '🇧🇬 Български' },
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
]

const THEMES: { value: Theme; emoji: string; label: Record<Language, string> }[] = [
  { value: 'dark',     emoji: '🌑', label: { bg: 'Тъмна', ru: 'Тёмная', en: 'Dark' } },
  { value: 'daylight', emoji: '☀️', label: { bg: 'Дневна', ru: 'Дневная', en: 'Daylight' } },
  { value: 'neon',     emoji: '⚡', label: { bg: 'Неон', ru: 'Неон', en: 'Neon' } },
]

export default function Settings({ profile, lang, onLangChange, onThemeChange, onReset }: Props) {
  const auth = loadAuth()
  const currentTheme: Theme = profile.theme ?? 'dark'

  function handleClearData() {
    if (window.confirm(t('clearConfirm', lang))) {
      clearAll()
      onReset()
    }
  }

  return (
    <div className="pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-zinc-100 mb-6">{t('settings', lang)}</h2>

      {/* Profile info */}
      <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">
            {lang === 'bg' ? 'Имe' : lang === 'ru' ? 'Имя' : 'Name'}
          </span>
          <span className="text-zinc-100 font-medium">{profile.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">
            {lang === 'bg' ? 'Рождена дата' : lang === 'ru' ? 'Дата рождения' : 'Birth date'}
          </span>
          <span className="text-zinc-100">
            {String(profile.birthDay).padStart(2,'0')}.{String(profile.birthMonth).padStart(2,'0')}.{profile.birthYear}
            {profile.birthHour !== null
              ? ` ${String(profile.birthHour).padStart(2,'0')}:${String(profile.birthMinute ?? 0).padStart(2,'0')}`
              : ''}
          </span>
        </div>
        {profile.birthCity && (
          <div className="flex justify-between items-center">
            <span className="text-zinc-400 text-sm">
              {lang === 'bg' ? 'Град' : lang === 'ru' ? 'Город' : 'City'}
            </span>
            <span className="text-zinc-100 text-sm">
              {profile.birthCity}
              {profile.birthUtcOffset !== undefined && (
                <span className="text-zinc-500 ml-1 text-xs">
                  UTC{profile.birthUtcOffset >= 0 ? '+' : ''}{profile.birthUtcOffset}
                </span>
              )}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">{t('gender', lang)}</span>
          <span className="text-zinc-100">{t(profile.gender, lang)}</span>
        </div>
      </section>

      {/* Token balance */}
      {auth && (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('tokensLeft', lang)}</p>
          <TokenBadge balance={auth.balance} tier={auth.tier} resetDate={auth.resetDate} lang={lang} />
          <div className="mt-2">
            <span className="text-xs text-zinc-500">{t('tier', lang)}: </span>
            <span className="text-xs text-amber-400 font-medium uppercase">{t(auth.tier, lang)}</span>
          </div>
        </section>
      )}

      {/* Theme */}
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">
          {lang === 'bg' ? 'Тема' : lang === 'ru' ? 'Тема' : 'Theme'}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => onThemeChange(value)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-colors ${
                currentTheme === value
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-xs font-medium">{label[lang]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="mb-6">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-3">{t('language', lang)}</p>
        <div className="space-y-2">
          {LANGS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onLangChange(value)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                lang === value
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="space-y-3">
        <button
          onClick={() => { clearAll(); onReset() }}
          className="w-full flex items-center justify-center gap-2 border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 rounded-xl py-3 text-sm transition-colors"
        >
          <LogOut size={14} />
          {lang === 'bg' ? 'Излез' : lang === 'ru' ? 'Выйти' : 'Sign out'}
        </button>
        <button
          onClick={handleClearData}
          className="w-full flex items-center justify-center gap-2 border border-red-900 text-red-500 hover:bg-red-950/30 rounded-xl py-3 text-sm transition-colors"
        >
          <Trash2 size={14} />
          {t('clearData', lang)}
        </button>
      </section>
    </div>
  )
}
