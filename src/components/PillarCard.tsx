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
      <span className={`text-xs text-zinc-400 mt-1`}>
        {pillar.ganElement} {pillar.ganPolarity}
      </span>
      {/* Earthly Branch */}
      <span className={`chinese element-${pillar.zhiElementKey} font-bold ${compact ? 'text-3xl' : 'text-4xl'} leading-none mt-3`}>
        {pillar.zhi}
      </span>
      <span className="text-xs text-zinc-400 mt-1">{pillar.zhiAnimal}</span>
    </div>
  )
}
