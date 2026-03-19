import { Sun, BookOpen, Calendar, Settings, ShieldAlert } from 'lucide-react'
import { t } from '../engine/translations'
import type { Language, Tier } from '../engine/types'

export type Tab = 'today' | 'chart' | 'lucky' | 'settings' | 'admin'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
  lang: Language
  tier?: Tier
}

const BASE_TABS: { id: Tab; icon: typeof Sun; labelKey: string }[] = [
  { id: 'today',    icon: Sun,      labelKey: 'today'    },
  { id: 'chart',    icon: BookOpen, labelKey: 'chart'    },
  { id: 'lucky',    icon: Calendar, labelKey: 'lucky'    },
  { id: 'settings', icon: Settings, labelKey: 'settings' },
]

export default function TabBar({ active, onSelect, lang, tier }: Props) {
  const tabs = tier === 'admin'
    ? [...BASE_TABS, { id: 'admin' as Tab, icon: ShieldAlert, labelKey: 'admin' }]
    : BASE_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex safe-bottom">
      {tabs.map(({ id, icon: Icon, labelKey }) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
            active === id
              ? id === 'admin' ? 'text-red-400' : 'text-amber-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Icon size={20} />
          <span className="text-xs">{t(labelKey, lang)}</span>
        </button>
      ))}
    </nav>
  )
}
