import { useState, useEffect, useRef } from 'react'
import { saveProfile } from '../utils/storage'
import { t } from '../engine/translations'
import type { Language, UserProfile, Gender } from '../engine/types'

interface Props {
  lang: Language
  onDone: () => void
  onSkip?: () => void
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: { city?: string; town?: string; village?: string; country?: string }
}

interface LocationInfo {
  name: string
  lat: number
  lon: number
  utcOffset: number
}

export default function Setup({ lang, onDone, onSkip }: Props) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')   // DD.MM.YYYY
  const [birthTime, setBirthTime] = useState('')   // HH:MM
  const [gender, setGender] = useState<Gender>('female')
  const [error, setError] = useState('')

  // City search
  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<NominatimResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null)
  const [cityLoading, setCityLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleCityInput(val: string) {
    setCityQuery(val)
    setSelectedLocation(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setCitySuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(() => fetchCities(val.trim()), 600)
  }

  async function fetchCities(q: string) {
    setCityLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&featuretype=city`
      const res = await fetch(url, { headers: { 'Accept-Language': lang } })
      const data: NominatimResult[] = await res.json()
      setCitySuggestions(data)
      setShowDropdown(data.length > 0)
    } catch {
      setCitySuggestions([])
    } finally {
      setCityLoading(false)
    }
  }

  async function selectCity(item: NominatimResult) {
    const lat = parseFloat(item.lat)
    const lon = parseFloat(item.lon)
    const cityName = item.address?.city ?? item.address?.town ?? item.address?.village ?? item.display_name.split(',')[0]
    setCityQuery(cityName)
    setShowDropdown(false)
    setCitySuggestions([])

    // Fetch timezone offset
    try {
      const res = await fetch(`https://timeapi.io/api/timezone/coordinate?latitude=${lat}&longitude=${lon}`)
      const data = await res.json()
      const utcOffset: number = data?.currentUtcOffset?.hours ?? Math.round(lon / 15)
      setSelectedLocation({ name: cityName, lat, lon, utcOffset })
    } catch {
      // Fallback: estimate from longitude
      setSelectedLocation({ name: cityName, lat, lon, utcOffset: Math.round(lon / 15) })
    }
  }

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

    return {
      name: trimName,
      birthYear: y, birthMonth: m, birthDay: d,
      birthHour, birthMinute,
      gender,
      language: lang,
      birthCity: selectedLocation?.name,
      birthLongitude: selectedLocation?.lon,
      birthLatitude: selectedLocation?.lat,
      birthUtcOffset: selectedLocation?.utcOffset,
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const profile = validate()
    if (!profile) return
    saveProfile(profile)
    onDone()
  }

  // Corrected time preview
  let correctedTimeHint = ''
  if (selectedLocation && birthTime.trim()) {
    const [h, m] = birthTime.trim().split(':').map(Number)
    if (!isNaN(h) && !isNaN(m)) {
      const std = selectedLocation.utcOffset * 15
      const correction = Math.round((selectedLocation.lon - std) * 4)
      const total = ((h * 60 + m + correction) % 1440 + 1440) % 1440
      const ch = String(Math.floor(total / 60)).padStart(2, '0')
      const cm = String(total % 60).padStart(2, '0')
      const sign = correction >= 0 ? '+' : ''
      correctedTimeHint = `→ ${ch}:${cm} (${sign}${correction} min solar correction)`
    }
  }

  const cityPlaceholder =
    lang === 'bg' ? 'напр. София, Алмати...' :
    lang === 'ru' ? 'напр. Москва, Алматы...' :
    'e.g. Sofia, Almaty, London...'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-xl font-bold text-zinc-100">{t('setupTitle', lang)}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {lang === 'bg' ? 'Данните остават само на устройството ти' :
             lang === 'ru' ? 'Данные хранятся только на устройстве' :
             'Data stays on your device only'}
          </p>
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

          {/* City of birth */}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              {lang === 'bg' ? 'Град на раждане' : lang === 'ru' ? 'Город рождения' : 'City of birth'}
              <span className="text-zinc-600 ml-1 text-xs">
                ({lang === 'bg' ? 'незадължително' : lang === 'ru' ? 'необязательно' : 'optional'})
              </span>
            </label>
            <div className="relative" ref={wrapperRef}>
              <input
                value={cityQuery}
                onChange={e => handleCityInput(e.target.value)}
                onFocus={() => citySuggestions.length > 0 && setShowDropdown(true)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-amber-500"
                placeholder={cityPlaceholder}
                autoComplete="off"
              />
              {cityLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs animate-pulse">
                  {lang === 'bg' ? 'търсене...' : lang === 'ru' ? 'поиск...' : 'searching...'}
                </span>
              )}
              {showDropdown && citySuggestions.length > 0 && (
                <div className="city-dropdown">
                  {citySuggestions.map(item => {
                    const city = item.address?.city ?? item.address?.town ?? item.address?.village ?? item.display_name.split(',')[0]
                    const country = item.address?.country ?? ''
                    return (
                      <div key={item.place_id} className="city-dropdown-item" onMouseDown={() => selectCity(item)}>
                        <div>{city}</div>
                        <div className="city-dropdown-item-sub">{country}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Location info + corrected time */}
            {selectedLocation && (
              <div className="mt-1.5 px-1 space-y-0.5">
                <p className="text-xs text-zinc-500">
                  UTC{selectedLocation.utcOffset >= 0 ? '+' : ''}{selectedLocation.utcOffset} · {selectedLocation.lon.toFixed(2)}°
                </p>
                {correctedTimeHint && (
                  <p className="text-xs text-amber-500/80">{correctedTimeHint}</p>
                )}
              </div>
            )}
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

          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 transition-colors py-2"
            >
              {lang === 'bg' ? 'Пропусни засега →' : lang === 'ru' ? 'Пропустить →' : 'Skip for now →'}
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
