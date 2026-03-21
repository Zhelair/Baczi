import { useState } from 'react'
import { Clock, Trash2, Download, ChevronDown, ChevronUp, X } from 'lucide-react'
import { loadHistory, deleteHistoryEntry, clearHistoryByTool, type HistoryEntry, type HistoryTool } from '../utils/storage'
import type { Language } from '../engine/types'

interface Props {
  lang: Language
}

const TOOL_LABELS: Record<HistoryTool, Record<Language, string>> = {
  today:  { bg: 'Днес',    ru: 'Сегодня', en: 'Today'  },
  ask:    { bg: 'Попитай', ru: 'Спроси',  en: 'Ask'    },
  lucky:  { bg: 'Удача',   ru: 'Удача',   en: 'Lucky'  },
  study:  { bg: 'Учене',   ru: 'Учёба',   en: 'Study'  },
}

const TOOL_COLORS: Record<HistoryTool, string> = {
  today:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  ask:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  lucky:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  study:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function formatDate(iso: string, lang: Language) {
  return new Date(iso).toLocaleDateString(
    lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { day: 'numeric', month: 'short', year: 'numeric' }
  )
}

export default function History({ lang }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => loadHistory())
  const [filter, setFilter] = useState<HistoryTool | 'all'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [confirmClear, setConfirmClear] = useState<HistoryTool | 'all' | null>(null)

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function remove(id: string) {
    deleteHistoryEntry(id)
    setEntries(loadHistory())
  }

  function clearTool(tool: HistoryTool | 'all') {
    if (tool === 'all') {
      entries.forEach(e => deleteHistoryEntry(e.id))
    } else {
      clearHistoryByTool(tool)
    }
    setEntries(loadHistory())
    setConfirmClear(null)
  }

  function downloadAll() {
    downloadJson(entries, `bazi-history-${new Date().toISOString().split('T')[0]}.json`)
  }

  function downloadEntry(entry: HistoryEntry) {
    downloadJson(entry.data, `bazi-${entry.tool}-${entry.date}.json`)
  }

  const filtered = filter === 'all' ? entries : entries.filter(e => e.tool === filter)
  const tools: HistoryTool[] = ['today', 'ask', 'lucky', 'study']
  const toolCounts = Object.fromEntries(tools.map(t => [t, entries.filter(e => e.tool === t).length])) as Record<HistoryTool, number>

  return (
    <div className="bz-page">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Clock size={22} className="text-amber-400" />
            {lang === 'bg' ? 'История' : lang === 'ru' ? 'История' : 'History'}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {entries.length} {lang === 'bg' ? 'записа' : lang === 'ru' ? 'записей' : 'entries'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          {entries.length > 0 && (
            <>
              <button
                onClick={downloadAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm transition-colors"
                title={lang === 'bg' ? 'Изтегли всичко' : lang === 'ru' ? 'Скачать всё' : 'Download all'}
              >
                <Download size={14} />
                {lang === 'bg' ? 'Изтегли' : lang === 'ru' ? 'Скачать' : 'Download'}
              </button>
              {confirmClear === 'all' ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => clearTool('all')} className="px-3 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-700/50 text-xs font-medium transition-colors hover:bg-red-500/30">
                    {lang === 'bg' ? 'Изчисти всичко' : lang === 'ru' ? 'Очистить всё' : 'Clear all'}
                  </button>
                  <button onClick={() => setConfirmClear(null)} className="p-2 text-zinc-500 hover:text-zinc-300"><X size={14} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear('all')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-700/50 text-sm transition-colors"
                >
                  <Trash2 size={14} />
                  {lang === 'bg' ? 'Изчисти' : lang === 'ru' ? 'Очистить' : 'Clear'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === 'all' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {lang === 'bg' ? 'Всички' : lang === 'ru' ? 'Все' : 'All'} ({entries.length})
        </button>
        {tools.map(tool => toolCounts[tool] > 0 && (
          <button
            key={tool}
            onClick={() => setFilter(tool)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === tool ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {TOOL_LABELS[tool][lang]} ({toolCounts[tool]})
          </button>
        ))}
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {lang === 'bg' ? 'Няма записи' : lang === 'ru' ? 'Нет записей' : 'No entries yet'}
          </p>
          <p className="text-xs mt-1 text-zinc-700">
            {lang === 'bg' ? 'Всяко AI четене се запазва автоматично тук'
             : lang === 'ru' ? 'Каждый AI-ответ автоматически сохраняется здесь'
             : 'Every AI response is automatically saved here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => (
            <div key={entry.id} className="bz-card overflow-hidden">
              {/* Entry header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${TOOL_COLORS[entry.tool]}`}>
                  {TOOL_LABELS[entry.tool][lang]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{entry.title}</p>
                  <p className="text-xs text-zinc-600">{formatDate(entry.date, lang)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => downloadEntry(entry)}
                    className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                    title={lang === 'bg' ? 'Изтегли' : lang === 'ru' ? 'Скачать' : 'Download'}
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => remove(entry.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title={lang === 'bg' ? 'Изтрий' : lang === 'ru' ? 'Удалить' : 'Delete'}
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    {expanded.has(entry.id) ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              </div>

              {/* Summary preview */}
              {!expanded.has(entry.id) && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{entry.summary}</p>
                </div>
              )}

              {/* Expanded content */}
              {expanded.has(entry.id) && (
                <div className="px-4 pb-4 border-t border-zinc-800/60 pt-3">
                  <ExpandedEntry entry={entry} lang={lang} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpandedEntry({ entry }: { entry: HistoryEntry; lang: Language }) {
  if (entry.tool === 'today') {
    const data = entry.data as { interpretation?: string; lifeAreas?: { key: string; score: number; tip: string }[]; luckyHours?: string[] }
    return (
      <div className="space-y-3">
        {data.interpretation && (
          <p className="text-sm text-zinc-300 leading-relaxed">{data.interpretation}</p>
        )}
        {data.luckyHours && data.luckyHours.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data.luckyHours.map(h => (
              <span key={h} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg px-2 py-0.5">{h}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (entry.tool === 'ask' || entry.tool === 'study') {
    const data = entry.data as { messages?: { role: string; content: string }[] }
    const msgs = data.messages ?? []
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {msgs.map((m, i) => (
          <div key={i} className={`text-xs rounded-xl px-3 py-2 ${m.role === 'user' ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-800/60 text-zinc-300'}`}>
            <span className="font-semibold mr-1">{m.role === 'user' ? '👤' : '☯'}</span>
            {m.content.slice(0, 300)}{m.content.length > 300 ? '...' : ''}
          </div>
        ))}
      </div>
    )
  }

  if (entry.tool === 'lucky') {
    const data = entry.data as { summary?: string; topTip?: string; luckyHours?: string[] }
    return (
      <div className="space-y-3">
        {data.summary && <p className="text-sm text-zinc-300 leading-relaxed">{data.summary}</p>}
        {data.topTip && <p className="text-xs text-amber-400 italic">{data.topTip}</p>}
        {data.luckyHours && data.luckyHours.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {data.luckyHours.map(h => (
              <span key={h} className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs rounded-lg px-2 py-0.5">{h}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  return <pre className="text-xs text-zinc-500 whitespace-pre-wrap">{JSON.stringify(entry.data, null, 2).slice(0, 500)}</pre>
}
