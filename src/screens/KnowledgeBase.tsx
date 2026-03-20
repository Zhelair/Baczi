import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Trash2, ChevronDown, ChevronUp, X, Save, BookOpen, RefreshCw, Star, Edit2 } from 'lucide-react'
import { loadAdminToken, loadAuth } from '../utils/storage'

interface KnowledgeRule {
  id: number
  pattern: string
  rule_text: string
  school: string
  confidence: string
  tags: string[]
  source_url?: string
}

interface PageResult {
  data: KnowledgeRule[]
  total: number
  page: number
  limit: number
}

const SCHOOLS = ['classical', 'zi_ping', 'dong_gong', 'joey_yap', 'unknown']
const CONFIDENCES = ['high', 'medium', 'low']

const SCHOOL_COLOR: Record<string, string> = {
  classical:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  zi_ping:    'bg-blue-500/20  text-blue-300  border-blue-500/30',
  dong_gong:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  joey_yap:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  unknown:    'bg-zinc-500/20  text-zinc-400  border-zinc-500/30',
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  medium: 'bg-amber-500/20   text-amber-300   border-amber-500/30',
  low:    'bg-red-500/20     text-red-300     border-red-500/30',
}

const INPUT = 'w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-amber-500 transition-colors'
const SELECT = INPUT + ' cursor-pointer'

// ── Favorites stored in localStorage ─────────────────────────────────────────
const FAV_KEY = 'bazi_kb_favorites'
function loadFavorites(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as number[]) }
  catch { return new Set() }
}
function saveFavorites(favs: Set<number>) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favs]))
}

// ── Fetch helper ──────────────────────────────────────────────────────────────
async function kbFetch(method: string, path: string, body?: unknown): Promise<Response> {
  const token = loadAdminToken() ?? loadAuth()?.token ?? ''
  return fetch(`/api/knowledge${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

// ── Shared badge ──────────────────────────────────────────────────────────────
function Badge({ text, colorClass }: { text: string; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border font-medium ${colorClass}`}>
      {text}
    </span>
  )
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
interface RuleFormProps {
  mode: 'add' | 'edit'
  initial?: KnowledgeRule
  onSave: (rule: Omit<KnowledgeRule, 'id'>) => Promise<void>
  onClose: () => void
}

function RuleFormModal({ mode, initial, onSave, onClose }: RuleFormProps) {
  const [pattern,    setPattern]    = useState(initial?.pattern    ?? '')
  const [ruleText,   setRuleText]   = useState(initial?.rule_text  ?? '')
  const [school,     setSchool]     = useState(initial?.school     ?? 'classical')
  const [confidence, setConfidence] = useState(initial?.confidence ?? 'medium')
  const [tags,       setTags]       = useState(initial?.tags?.join(', ') ?? '')
  const [sourceUrl,  setSourceUrl]  = useState(initial?.source_url ?? '')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  async function handleSave() {
    if (!pattern.trim() || !ruleText.trim()) {
      setError('Pattern name and rule text are required')
      return
    }
    setSaving(true)
    try {
      await onSave({
        pattern:    pattern.trim(),
        rule_text:  ruleText.trim(),
        school,
        confidence,
        tags:       tags.split(',').map(s => s.trim()).filter(Boolean),
        source_url: sourceUrl.trim() || 'admin',
      })
      onClose()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-amber-400" />
            <h3 className="font-semibold text-zinc-100 text-sm">
              {mode === 'add' ? 'Add Knowledge Rule' : 'Edit Rule'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Pattern name <span className="text-red-400">*</span></label>
            <input className={INPUT} placeholder="e.g. Jia_strong_wood" value={pattern} onChange={e => setPattern(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Rule text <span className="text-red-400">*</span></label>
            <textarea
              className={INPUT + ' resize-none'}
              rows={5}
              placeholder="Describe the BaZi rule or pattern..."
              value={ruleText}
              onChange={e => setRuleText(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">School</label>
              <select className={SELECT} value={school} onChange={e => setSchool(e.target.value)}>
                {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Confidence</label>
              <select className={SELECT} value={confidence} onChange={e => setConfidence(e.target.value)}>
                {CONFIDENCES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Tags <span className="text-zinc-600">(comma-separated: clash, metal, Jia…)</span></label>
            <input className={INPUT} placeholder="clash, heavenly_stem, metal" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Source <span className="text-zinc-600">(URL or label)</span></label>
            <input className={INPUT} placeholder="https://... or admin" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3 border-t border-zinc-800">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 transition-colors"
          >
            <Save size={13} />
            {saving ? 'Saving…' : mode === 'add' ? 'Add Rule' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Rule row ──────────────────────────────────────────────────────────────────
interface RuleRowProps {
  rule: KnowledgeRule
  isFav: boolean
  onDelete: (id: number) => void
  onEdit: (rule: KnowledgeRule) => void
  onToggleFav: (id: number) => void
  onTagClick: (tag: string) => void
}

function RuleRow({ rule, isFav, onDelete, onEdit, onToggleFav, onTagClick }: RuleRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${rule.pattern}"?`)) return
    setDeleting(true)
    onDelete(rule.id)
  }

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-1.5 px-3 py-3 hover:bg-zinc-800/30 transition-colors">
        {/* Star */}
        <button
          onClick={() => onToggleFav(rule.id)}
          className={`flex-shrink-0 p-1 rounded transition-colors ${isFav ? 'text-amber-400' : 'text-zinc-700 hover:text-amber-500/60'}`}
          title={isFav ? 'Remove from starred' : 'Star this rule'}
        >
          <Star size={13} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex-1 flex items-start gap-3 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-medium text-zinc-200 truncate">{rule.pattern}</span>
              <Badge text={rule.school} colorClass={SCHOOL_COLOR[rule.school] ?? SCHOOL_COLOR.unknown} />
              <Badge text={rule.confidence} colorClass={CONFIDENCE_COLOR[rule.confidence] ?? CONFIDENCE_COLOR.medium} />
            </div>
            {!expanded && (
              <p className="text-xs text-zinc-500 truncate">{rule.rule_text}</p>
            )}
          </div>
          <span className="text-zinc-600 flex-shrink-0 mt-0.5">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(rule)}
          className="flex-shrink-0 p-1.5 text-zinc-600 hover:text-amber-400 transition-colors"
          title="Edit rule"
        >
          <Edit2 size={13} />
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 p-1.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
          title="Delete rule"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 pl-9">
          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 rounded-lg p-3 whitespace-pre-wrap">{rule.rule_text}</p>
          {rule.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {rule.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-700 transition-colors"
                  title={`Filter by tag: ${tag}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          {rule.source_url && rule.source_url !== 'admin' && (
            <p className="text-xs text-zinc-600 truncate">Source: {rule.source_url}</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function KnowledgeBase({ adminToken }: { adminToken?: string }) {
  const [rules,            setRules]            = useState<KnowledgeRule[]>([])
  const [total,            setTotal]            = useState(0)
  const [page,             setPage]             = useState(0)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [search,           setSearch]           = useState('')
  const [filterSchool,     setFilterSchool]     = useState('')
  const [filterConfidence, setFilterConfidence] = useState('')
  const [filterTag,        setFilterTag]        = useState('')
  const [favOnly,          setFavOnly]          = useState(false)
  const [favorites,        setFavorites]        = useState<Set<number>>(() => loadFavorites())
  const [allTags,          setAllTags]          = useState<string[]>([])
  const [showAdd,          setShowAdd]          = useState(false)
  const [editTarget,       setEditTarget]       = useState<KnowledgeRule | null>(null)
  const LIMIT = 30

  void adminToken // token used inside kbFetch via loadAdminToken

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(LIMIT),
        ...(search           ? { search }                        : {}),
        ...(filterSchool     ? { school: filterSchool }          : {}),
        ...(filterConfidence ? { confidence: filterConfidence }  : {}),
        ...(filterTag        ? { tag: filterTag }                : {}),
      })
      const res = await kbFetch('GET', `?${params}`)
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json() as PageResult
      const data = json.data ?? []
      setRules(data)
      setTotal(json.total ?? 0)
      // Accumulate unique tags from loaded rules for the filter dropdown
      const newTags = data.flatMap(r => r.tags ?? [])
      setAllTags(prev => {
        const merged = new Set([...prev, ...newTags])
        return [...merged].sort()
      })
    } catch (e) {
      setError('Failed to load: ' + String(e))
    } finally {
      setLoading(false)
    }
  }, [page, search, filterSchool, filterConfidence, filterTag])

  useEffect(() => { load() }, [load])

  function toggleFav(id: number) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }

  async function handleAdd(rule: Omit<KnowledgeRule, 'id'>) {
    const res = await kbFetch('POST', '', rule)
    if (!res.ok) {
      const j = await res.json() as { error?: string }
      throw new Error(j.error ?? String(res.status))
    }
    setPage(0)
    await load()
  }

  async function handleSaveEdit(updated: Omit<KnowledgeRule, 'id'>) {
    if (!editTarget) return
    const res = await kbFetch('PATCH', `?id=${editTarget.id}`, updated)
    if (!res.ok) {
      const j = await res.json() as { error?: string }
      throw new Error(j.error ?? String(res.status))
    }
    // Update in-place without full reload
    setRules(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...updated } : r))
  }

  async function handleDelete(id: number) {
    const res = await kbFetch('DELETE', `?id=${id}`)
    if (!res.ok) return
    setRules(prev => prev.filter(r => r.id !== id))
    setTotal(prev => prev - 1)
  }

  function clearFilters() {
    setSearch('')
    setFilterSchool('')
    setFilterConfidence('')
    setFilterTag('')
    setFavOnly(false)
    setPage(0)
  }

  const hasFilters = !!(search || filterSchool || filterConfidence || filterTag || favOnly)
  const displayedRules = favOnly ? rules.filter(r => favorites.has(r.id)) : rules
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="pb-24 md:pb-8 px-4 md:px-8 pt-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-zinc-100">Knowledge Base</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {total} rules · {favorites.size > 0 ? `${favorites.size} starred · ` : ''}BaZi RAG · top 6 rules per query
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-xs border border-zinc-700 text-zinc-400 hover:border-zinc-500 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} />
            Reload
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors"
          >
            <Plus size={14} />
            Add Rule
          </button>
        </div>
      </div>

      {/* Filter row 1: search + school + confidence */}
      <div className="flex gap-2 mb-2 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Search rules..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <select
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          value={filterSchool}
          onChange={e => { setFilterSchool(e.target.value); setPage(0) }}
        >
          <option value="">All schools</option>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          value={filterConfidence}
          onChange={e => { setFilterConfidence(e.target.value); setPage(0) }}
        >
          <option value="">All confidence</option>
          {CONFIDENCES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Filter row 2: tag + starred + clear */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer flex-1 min-w-32"
          value={filterTag}
          onChange={e => { setFilterTag(e.target.value); setPage(0) }}
        >
          <option value="">All tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          onClick={() => { setFavOnly(v => !v); setPage(0) }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
            favOnly
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600'
          }`}
        >
          <Star size={12} fill={favOnly ? 'currentColor' : 'none'} />
          Starred{favorites.size > 0 ? ` (${favorites.size})` : ''}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Active tag chip */}
      {filterTag && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-zinc-500">Filtering by tag:</span>
          <button
            onClick={() => { setFilterTag(''); setPage(0) }}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors"
          >
            {filterTag} <X size={10} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-950/50 border border-red-900 px-4 py-2 text-red-400 text-sm">{error}</div>
      )}

      {/* Rules list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-500 text-sm">Loading rules…</div>
        ) : displayedRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-600 text-sm">
            <BookOpen size={32} className="mb-3 opacity-40" />
            <p>{favOnly ? 'No starred rules on this page' : 'No rules found'}</p>
            <p className="text-xs mt-1">Try changing filters or add a new rule</p>
          </div>
        ) : (
          <div>
            {displayedRules.map(rule => (
              <RuleRow
                key={rule.id}
                rule={rule}
                isFav={favorites.has(rule.id)}
                onDelete={handleDelete}
                onEdit={r => setEditTarget(r)}
                onToggleFav={toggleFav}
                onTagClick={tag => { setFilterTag(tag); setPage(0) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !favOnly && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-zinc-500">
            Page {page + 1} of {totalPages} · {total} total rules
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg text-sm border border-zinc-700 text-zinc-400 hover:border-zinc-500 disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAdd && (
        <RuleFormModal mode="add" onSave={handleAdd} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <RuleFormModal
          mode="edit"
          initial={editTarget}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  )
}
