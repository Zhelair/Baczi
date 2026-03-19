import { useState } from 'react'
import { LogOut, Trash2, ShieldAlert } from 'lucide-react'
import { t } from '../engine/translations'
import { clearAll, loadAuth, saveAdminToken, loadAdminToken, clearAdminToken } from '../utils/storage'
import TokenBadge from '../components/TokenBadge'
import AdminPanel from './AdminPanel'
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
  const [adminToken, setAdminToken] = useState<string | null>(() => loadAdminToken())
  const [adminPhrase, setAdminPhrase] = useState('')
  const [adminError, setAdminError] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  function handleClearData() {
    if (window.confirm(t('clearConfirm', lang))) {
      clearAll()
      onReset()
    }
  }

  async function handleAdminUnlock() {
    if (!adminPhrase.trim()) return
    setAdminLoading(true)
    setAdminError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: adminPhrase.trim() }),
      })
      const data = await res.json()
      if (!res.ok || data.tier !== 'admin') {
        setAdminError(
          lang === 'bg' ? 'Невалидна парола' :
          lang === 'ru' ? 'Неверный пароль' : 'Invalid admin passphrase'
        )
        return
      }
      saveAdminToken(data.token)
      setAdminToken(data.token)
      setAdminPhrase('')
    } catch {
      setAdminError(
        lang === 'bg' ? 'Нещо се обърка' :
        lang === 'ru' ? 'Что-то пошло не так' : 'Something went wrong'
      )
    } finally {
      setAdminLoading(false)
    }
  }

  return (
    <div className="pb-24 md:pb-8 px-4 pt-6 max-w-2xl mx-auto">
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

      {/* Admin access */}
      {adminToken ? (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={14} className="text-red-400" />
            <p className="text-xs uppercase tracking-wider text-red-400">Admin Panel</p>
            <button
              onClick={() => { clearAdminToken(); setAdminToken(null) }}
              className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {lang === 'bg' ? 'Затвори' : lang === 'ru' ? 'Закрыть' : 'Close'}
            </button>
          </div>
          <AdminPanel adminToken={adminToken} />
        </section>
      ) : (
        <section className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={14} className="text-zinc-600" />
            <p className="text-xs uppercase tracking-wider text-zinc-500">
              {lang === 'bg' ? 'Администраторски достъп' :
               lang === 'ru' ? 'Доступ администратора' : 'Admin Access'}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder={
                lang === 'bg' ? 'Администраторска парола' :
                lang === 'ru' ? 'Пароль администратора' : 'Admin passphrase'
              }
              value={adminPhrase}
              onChange={e => setAdminPhrase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminUnlock()}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              onClick={handleAdminUnlock}
              disabled={adminLoading || !adminPhrase.trim()}
              className="px-4 py-2 rounded-lg bg-red-900/40 text-red-400 border border-red-900 text-sm hover:bg-red-900/60 transition-colors disabled:opacity-40"
            >
              {adminLoading ? '…' : lang === 'bg' ? 'Влез' : lang === 'ru' ? 'Войти' : 'Unlock'}
            </button>
          </div>
          {adminError && (
            <p className="mt-2 text-xs text-red-400">{adminError}</p>
          )}
        </section>
      )}

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
