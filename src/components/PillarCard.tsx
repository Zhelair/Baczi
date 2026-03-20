import { STEMS } from '../engine/translations'
import type { Pillar } from '../engine/types'

interface Props {
  label: string
  pillar: Pillar | null
  unknownLabel?: string
  compact?: boolean
}

export default function PillarCard({ label, pillar, unknownLabel = '?', compact = false }: Props) {
  if (!pillar) {
    return (
      <div className={`flex flex-col items-center rounded-xl border border-zinc-800 bg-zinc-900 ${compact ? 'p-3' : 'p-4'}`}>
        <span className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</span>
        <span className="text-zinc-600 text-2xl">—</span>
        <span className="text-zinc-600 text-xs mt-1">{unknownLabel}</span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center rounded-xl border bg-element-${pillar.ganElementKey} ${compact ? 'p-3' : 'p-4'} border`}>
      <span className="text-xs text-zinc-400 uppercase tracking-wider mb-2">{label}</span>

      {/* Heavenly Stem */}
      <span className={`chinese element-${pillar.ganElementKey} font-bold ${compact ? 'text-4xl' : 'text-5xl'} leading-none`}>
        {pillar.gan}
      </span>
      <span className="text-xs text-zinc-400 mt-1">
        {pillar.ganElement} {pillar.ganPolarity}
      </span>

      {/* Earthly Branch */}
      <span className={`chinese element-${pillar.zhiElementKey} font-bold ${compact ? 'text-3xl' : 'text-4xl'} leading-none mt-3`}>
        {pillar.zhi}
      </span>
      <span className="text-xs text-zinc-400 mt-1">{pillar.zhiAnimal}</span>

      {/* Hidden stems (地支藏干) */}
      {pillar.hiddenStems.length > 0 && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-zinc-700/50 w-full justify-center">
          {pillar.hiddenStems.map((s, i) => {
            const stemKey = STEMS[s]?.elementKey ?? 'earth'
            return (
              <span
                key={i}
                className={`chinese text-sm element-${stemKey} leading-none ${i === 0 ? 'font-semibold' : 'opacity-70'}`}
                title={s}
              >
                {s}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
