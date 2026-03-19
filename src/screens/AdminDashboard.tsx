import { useState } from 'react'
import { ShieldAlert, Settings2, Zap, BookOpen, Users, ChevronRight } from 'lucide-react'
import AdminPanel from './AdminPanel'
import type { Language } from '../engine/types'
import { loadAuth } from '../utils/storage'

interface Props {
  lang: Language
  onGoToApp: () => void
}

type View = 'home' | 'config'

export default function AdminDashboard({ onGoToApp }: Props) {
  const [view, setView] = useState<View>('home')
  const auth = loadAuth()

  if (view === 'config') {
    return (
      <div className="min-h-screen bg-zinc-950">
        <div className="max-w-lg mx-auto px-4 pt-4">
          <button
            onClick={() => setView('home')}
            className="mb-4 text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            ← Back to Admin
          </button>
        </div>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start px-4 pt-12 pb-8">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-950/60 border border-red-900/50 mb-4">
          <ShieldAlert size={26} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-100">Admin Panel</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Full control · <span className="text-red-400 font-medium">ADMIN</span>
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-sm space-y-3">

        {/* Config tuning */}
        <button
          onClick={() => setView('config')}
          className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-100">AI & BaZi Tuning</div>
            <div className="text-xs text-zinc-500 mt-0.5">Model, temperature, token costs</div>
          </div>
          <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>

        {/* Go to app */}
        <button
          onClick={onGoToApp}
          className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 text-left transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={18} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-100">Open BaZi App</div>
            <div className="text-xs text-zinc-500 mt-0.5">Use the app as a regular user</div>
          </div>
          <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
        </button>

        {/* Knowledge stats placeholder */}
        <button
          disabled
          className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left opacity-50 cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Settings2 size={18} className="text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-100">Knowledge Base</div>
            <div className="text-xs text-zinc-500 mt-0.5">View & manage BaZi rules (scraper tool)</div>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">local</span>
        </button>

        {/* User overview placeholder */}
        <button
          disabled
          className="w-full flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-left opacity-50 cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-green-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-zinc-100">Users & Tokens</div>
            <div className="text-xs text-zinc-500 mt-0.5">Monitor usage per passphrase</div>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">coming</span>
        </button>
      </div>

      {/* Token info */}
      {auth && (
        <div className="mt-8 text-center">
          <span className="text-xs text-zinc-600">Logged in as </span>
          <span className="text-xs text-red-400 font-medium">admin</span>
          <span className="text-xs text-zinc-600"> · unlimited tokens</span>
        </div>
      )}
    </div>
  )
}
