import type { Language } from '../engine/types'

interface Props {
  onSelect: (lang: Language) => void
}

const OPTIONS: { lang: Language; flag: string; label: string; sub: string }[] = [
  { lang: 'bg', flag: '🇧🇬', label: 'Български',  sub: 'Bulgarian' },
  { lang: 'ru', flag: '🇷🇺', label: 'Русский',    sub: 'Russian'   },
  { lang: 'en', flag: '🇬🇧', label: 'English',    sub: 'English'   },
]

export default function LangSelect({ onSelect }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-zinc-950">
      <div className="text-center mb-10">
        <div className="text-6xl mb-4">☯</div>
        <h1 className="text-2xl font-bold text-zinc-100">BaZi</h1>
        <p className="text-zinc-500 text-sm mt-1">Chinese Astrology</p>
      </div>

      <p className="text-zinc-400 text-sm mb-6">Choose your language / Изберете език / Выберите язык</p>

      <div className="w-full max-w-xs space-y-3">
        {OPTIONS.map(({ lang, flag, label, sub }) => (
          <button
            key={lang}
            onClick={() => onSelect(lang)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-amber-500/40 hover:bg-zinc-800 active:scale-[0.98] transition-all text-left"
          >
            <span className="text-3xl">{flag}</span>
            <div>
              <p className="text-base font-semibold text-zinc-100">{label}</p>
              <p className="text-xs text-zinc-500">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
