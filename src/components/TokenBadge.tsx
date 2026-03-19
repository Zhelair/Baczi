import { Coins } from 'lucide-react'
import { t } from '../engine/translations'
import type { Language, Tier } from '../engine/types'

interface Props {
  balance: number
  tier: Tier
  resetDate: string
  lang: Language
}

const TIER_COLORS: Record<Tier, string> = {
  free:  'text-zinc-400',
  pro:   'text-amber-400',
  max:   'text-purple-400',
  admin: 'text-red-400',
}

export default function TokenBadge({ balance, tier, resetDate, lang }: Props) {
  const reset = new Date(resetDate).toLocaleDateString(lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric', month: 'short'
  })

  return (
    <div className="flex items-center gap-2 text-sm">
      <Coins size={14} className={TIER_COLORS[tier]} />
      <span className={`font-medium ${TIER_COLORS[tier]}`}>{balance}</span>
      <span className="text-zinc-500">{t('tokens', lang)}</span>
      <span className="text-zinc-600 text-xs">· {t('resetsOn', lang)} {reset}</span>
    </div>
  )
}
