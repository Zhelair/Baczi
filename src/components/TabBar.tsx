import { Sun, BookOpen, Calendar, Settings, ShieldAlert, MessageCircle, Zap, Compass, Hexagon, GraduationCap, Clock, Users, ChevronLeft, ChevronRight, Lock, Wand2 } from 'lucide-react'
import { t } from '../engine/translations'
import type { Language, Tier } from '../engine/types'

export type Tab = 'today' | 'chart' | 'lucky' | 'ask' | 'activations' | 'fengshui' | 'qmdj' | 'learn' | 'history' | 'persons' | 'settings' | 'admin' | 'studio'

interface Props {
  active: Tab
  onSelect: (tab: Tab) => void
  lang: Language
  tier?: Tier
  collapsed: boolean
  onToggleCollapse: () => void
}

const PAID_TABS: Tab[] = ['activations', 'fengshui', 'qmdj']

const BASE_TABS: { id: Tab; icon: typeof Sun; labelKey: string }[] = [
  { id: 'today',       icon: Sun,            labelKey: 'today'       },
  { id: 'chart',       icon: BookOpen,       labelKey: 'chart'       },
  { id: 'activations', icon: Zap,            labelKey: 'activations' },
  { id: 'fengshui',    icon: Compass,        labelKey: 'fengshui'    },
  { id: 'qmdj',        icon: Hexagon,        labelKey: 'qmdj'        },
  { id: 'ask',         icon: MessageCircle,  labelKey: 'ask'         },
  { id: 'learn',       icon: GraduationCap,  labelKey: 'learn'       },
  { id: 'history',     icon: Clock,          labelKey: 'history'     },
  { id: 'persons',     icon: Users,          labelKey: 'persons'     },
  { id: 'lucky',       icon: Calendar,       labelKey: 'lucky'       },
  { id: 'settings',    icon: Settings,       labelKey: 'settings'    },
]

// On mobile, show only the most important tabs (sidebar handles the rest)
const MOBILE_TABS: Tab[] = ['today', 'chart', 'ask', 'learn', 'persons', 'settings']

export default function TabBar({ active, onSelect, lang, tier, collapsed, onToggleCollapse }: Props) {
  const isFreeTier = !tier || tier === 'free'

  const tabs = tier === 'admin'
    ? [...BASE_TABS, { id: 'studio' as Tab, icon: Wand2, labelKey: 'studio' }, { id: 'admin' as Tab, icon: ShieldAlert, labelKey: 'admin' }]
    : tier === 'editor'
    ? [...BASE_TABS, { id: 'studio' as Tab, icon: Wand2, labelKey: 'studio' }]
    : BASE_TABS

  const mobileTabs = tabs.filter(tab => MOBILE_TABS.includes(tab.id))

  return (
    <>
      {/* ── Mobile: bottom bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex" style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}>
          {mobileTabs.map(({ id, icon: Icon, labelKey }) => {
            const isPaid = PAID_TABS.includes(id)
            const locked = isPaid && isFreeTier
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-colors relative ${
                  active === id
                    ? id === 'admin' ? 'text-red-400' : 'text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <div className="relative">
                  <Icon size={20} />
                  {locked && (
                    <Lock size={8} className="absolute -top-0.5 -right-1 text-zinc-500" />
                  )}
                </div>
                <span className="text-[10px] leading-none">{t(labelKey, lang)}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* ── Desktop: collapsible left sidebar ── */}
      <nav
        className={`hidden md:flex fixed left-0 top-0 bottom-0 flex-col py-4 z-50 border-r transition-all duration-300 ${collapsed ? 'w-16 px-2' : 'w-52 px-3'}`}
        style={{ background: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
      >
        {/* Brand */}
        <div className={`mb-5 overflow-hidden ${collapsed ? 'flex justify-center px-0' : 'px-2'}`}>
          {collapsed ? (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-amber-500), #ff8c00)', boxShadow: '0 2px 8px color-mix(in srgb, var(--color-amber-500) 40%, transparent)' }}>
              <span className="text-black text-sm font-bold">☯</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, var(--color-amber-500), #ff8c00)', boxShadow: '0 2px 8px color-mix(in srgb, var(--color-amber-500) 35%, transparent)' }}>
                <span className="text-black text-sm font-bold">☯</span>
              </div>
              <div>
                <p className="text-zinc-100 text-sm font-bold tracking-tight leading-tight">BaZi</p>
                <p className="text-zinc-500 text-[10px] leading-tight">
                  {lang === 'bg' ? 'Китайска метафизика' : lang === 'ru' ? 'Китайская метафизика' : 'Chinese Metaphysics'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto scrollbar-none">
          {tabs.map(({ id, icon: Icon, labelKey }) => {
            const isPaid = PAID_TABS.includes(id)
            const locked = isPaid && isFreeTier
            const isActive = active === id
            const isAdmin = id === 'admin'
            const isStudio = id === 'studio'

            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                title={collapsed ? t(labelKey, lang) : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all duration-150 text-left w-full relative group ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? isAdmin
                      ? 'bg-red-950/40 text-red-400 border border-red-900/50'
                      : isStudio
                      ? 'border border-violet-500/20 text-violet-400'
                      : 'border border-amber-500/20 text-amber-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
                style={isActive && !isAdmin ? { background: isStudio ? 'linear-gradient(135deg, color-mix(in srgb, #a78bfa 12%, transparent), color-mix(in srgb, #a78bfa 6%, transparent))' : 'linear-gradient(135deg, color-mix(in srgb, var(--color-amber-500) 12%, transparent), color-mix(in srgb, var(--color-amber-500) 6%, transparent))' } : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon size={17} />
                  {locked && (
                    <Lock size={8} className="absolute -top-1 -right-1.5 text-zinc-600" />
                  )}
                </div>
                {!collapsed && <span className="truncate">{t(labelKey, lang)}</span>}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1.5 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10 border" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--card-shadow-lg)' }}>
                    {t(labelKey, lang)}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-px mx-1 mb-2" style={{ background: 'var(--nav-border)' }} />

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className={`flex items-center rounded-xl py-2 text-zinc-500 hover:text-zinc-300 transition-colors ${
            collapsed ? 'justify-center px-0' : 'gap-2 px-3'
          }`}
          title={collapsed
            ? (lang === 'bg' ? 'Разшири' : lang === 'ru' ? 'Развернуть' : 'Expand')
            : (lang === 'bg' ? 'Свий' : lang === 'ru' ? 'Свернуть' : 'Collapse')}
        >
          {collapsed ? <ChevronRight size={15} /> : (
            <>
              <ChevronLeft size={15} />
              <span className="text-xs">{lang === 'bg' ? 'Свий' : lang === 'ru' ? 'Свернуть' : 'Collapse'}</span>
            </>
          )}
        </button>
      </nav>
    </>
  )
}
