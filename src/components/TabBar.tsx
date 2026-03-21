import { Sun, BookOpen, Calendar, Settings, ShieldAlert, MessageCircle, Zap, Compass, Hexagon } from 'lucide-react'
import { t } from '../engine/translations'
import type { Language, Tier } from '../engine/types'

export type Tab = 'today' | 'chart' | 'lucky' | 'ask' | 'activations' | 'fengshui' | 'qmdj' | 'settings' | 'admin'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
  lang: Language
  tier?: Tier
}

const BASE_TABS: { id: Tab; icon: typeof Sun; labelKey: string }[] = [
  { id: 'today',       icon: Sun,           labelKey: 'today'       },
  { id: 'chart',       icon: BookOpen,      labelKey: 'chart'       },
  { id: 'activations', icon: Zap,           labelKey: 'activations' },
  { id: 'fengshui',    icon: Compass,       labelKey: 'fengshui'    },
  { id: 'qmdj',        icon: Hexagon,       labelKey: 'qmdj'        },
  { id: 'ask',         icon: MessageCircle, labelKey: 'ask'         },
  { id: 'lucky',       icon: Calendar,      labelKey: 'lucky'       },
  { id: 'settings',    icon: Settings,      labelKey: 'settings'    },
]

export default function TabBar({ active, onSelect, lang, tier }: Props) {
  const tabs = tier === 'admin'
    ? [...BASE_TABS, { id: 'admin' as Tab, icon: ShieldAlert, labelKey: 'admin' }]
    : BASE_TABS

  return (
    <>
      {/* Mobile: bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex safe-bottom z-50">
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

      {/* Desktop: left sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-52 bg-zinc-950 border-r border-zinc-800 flex-col py-6 px-3 z-50">
        {/* Logo / brand */}
        <div className="px-3 mb-6">
          <span className="text-amber-400 text-lg font-bold tracking-tight">☯ BaZi</span>
          <p className="text-zinc-600 text-xs mt-0.5">
            {lang === 'bg' ? 'Китайска астрология' : lang === 'ru' ? 'Китайская астрология' : 'Chinese astrology'}
          </p>
        </div>

        <div className="flex flex-col gap-1 flex-1">
          {tabs.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left w-full ${
                active === id
                  ? id === 'admin'
                    ? 'bg-red-950/40 text-red-400 border border-red-900/50'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={18} />
              <span>{t(labelKey, lang)}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
