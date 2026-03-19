import { useState } from 'react'
import { saveProfile } from '../utils/storage'
import { t } from '../engine/translations'
import type { Language, UserProfile, Gender } from '../engine/types'

interface Props {
  lang: Language
  onDone: () => void
}

export default function Setup({ lang, onDone }: Props) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')  // DD.MM.YYYY
  const [birthTime, setBirthTime] = useState('')  // HH:MM
  const [gender, setGender] = useState<Gender>('female')
  const [error, setError] = useState('')

  function validate(): UserProfile | null {
    const trimName = name.trim()
    if (!trimName) { setError('Name required'); return null }

    const parts = birthDate.trim().split('.')
    if (parts.length !== 3) { setError('Date must be DD.MM.YYYY'); return null }
    const [d, m, y] = parts.map(Number)
    if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) {
      setError('Invalid birth date'); return null
    }

    let birthHour: number | null = null
    let birthMinute: number | null = null
    if (birthTime.trim()) {
      const [h, min] = birthTime.trim().split(':').map(Number)
      if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) {
        setError('Invalid birth time (HH:MM)'); return null
      }
      birthHour = h
      birthMinute = min
    }

    return { name: trimName, birthYear: y, birthMonth: m, birthDay: d, birthHour, birthMinute, gender, language: lang }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const profile = validate()
    if (!profile) return
    saveProfile(profile)
    onDone()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-xl font-bold text-zinc-100">{t('setupTitle', lang)}</h1>
          <p className="text-zinc-500 text-sm mt-1">Данните остават само на устройството ти</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">{t('yourName', lang)}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="Ivan"
            />
          </div>

          {/* Birth date */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">{t('birthDate', lang)}</label>
            <input
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="31.10.1992"
            />
          </div>

          {/* Birth time */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">{t('birthTime', lang)}</label>
            <input
              value={birthTime}
              onChange={e => setBirthTime(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500"
              placeholder="16:30"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">{t('gender', lang)}</label>
            <div className="flex gap-3">
              {(['male', 'female'] as Gender[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl border transition-colors font-medium ${
                    gender === g
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {t(g, lang)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl py-3 transition-colors mt-2"
          >
            {t('calculate', lang)}
          </button>
        </form>
      </div>
    </div>
  )
}
