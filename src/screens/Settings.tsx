import { LogOut, Trash2 } from 'lucide-react'
import { t } from '../engine/translations'
import { clearAll } from '../utils/storage'
import { loadAuth } from '../utils/storage'
import TokenBadge from '../components/TokenBadge'
import type { Language, UserProfile } from '../engine/types'

interface Props {
  profile: UserProfile
  lang: Language
  onLangChange: (lang: Language) => void
  onReset: () => void
}

const LANGS: { value: Language; label: string }[] = [
  { value: 'bg', label: '🇧🇬 Български' },
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'en', label: '🇬🇧 English' },
]

export default function Settings({ profile, lang, onLangChange, onReset }: Props) {
  const auth = loadAuth()

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
          <span className="text-zinc-400 text-sm">Name</span>
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
