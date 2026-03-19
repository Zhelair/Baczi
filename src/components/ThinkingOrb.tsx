import type { Language } from '../engine/types'

interface Props {
  lang: Language
}

export default function ThinkingOrb({ lang }: Props) {
  const label =
    lang === 'bg' ? 'Четене на картата' :
    lang === 'ru' ? 'Читаю карту' :
    'Reading the chart'

  return (
    <div className="flex flex-col items-center justify-center py-14 select-none">
      {/* Layered orb */}
      <div className="relative flex items-center justify-center mb-5">
        <div className="absolute w-24 h-24 rounded-full thinking-ring-outer" />
        <div className="absolute w-16 h-16 rounded-full thinking-ring-inner" />
        <div className="relative w-12 h-12 rounded-full thinking-core flex items-center justify-center">
          <span className="text-2xl">🔮</span>
        </div>
      </div>

      {/* Status pill */}
      <div className="thinking-pill flex items-center gap-2 px-4 py-2 rounded-full mb-2">
        <span className="thinking-dot" />
        <span className="text-sm font-medium thinking-text">{label}</span>
        <span className="flex gap-0.5 ml-0.5">
          <span className="thinking-bounce-dot" style={{ animationDelay: '0ms' }} />
          <span className="thinking-bounce-dot" style={{ animationDelay: '180ms' }} />
          <span className="thinking-bounce-dot" style={{ animationDelay: '360ms' }} />
        </span>
      </div>
    </div>
  )
}
