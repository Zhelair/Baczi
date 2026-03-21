import { useState } from 'react'
import { BookOpen, Brain, CheckCircle2, Circle, FileText, Trash2, ChevronLeft, Plus, X, Sparkles, Copy, Printer } from 'lucide-react'
import { LEARNING_TOPICS, CATEGORY_LABELS, type TopicCategory, type LearningTopic } from '../data/learningTopics'
import {
  loadNotes, saveNotes, loadTopicProgress, saveTopicProgress, loadAuth, saveAuth,
  type LearningNote, type TopicStatus,
} from '../utils/storage'
import { t } from '../engine/translations'
import StudyChat from '../components/StudyChat'
import type { Language, BaziChart } from '../engine/types'

type Filter = 'all' | 'in_progress' | 'not_started' | 'completed'
type View = 'topics' | 'notes' | 'study'

interface Props {
  lang: Language
  chart: BaziChart | null
}

function statusColor(status: TopicStatus) {
  if (status === 'completed')  return 'text-emerald-400'
  if (status === 'in_progress') return 'text-amber-400'
  return 'text-zinc-500'
}

function StatusIcon({ status }: { status: TopicStatus }) {
  if (status === 'completed')  return <CheckCircle2 size={13} className="text-emerald-400" />
  if (status === 'in_progress') return <Circle size={13} className="text-amber-400" />
  return <Circle size={13} className="text-zinc-600" />
}

function categoryColor(cat: TopicCategory): string {
  return {
    basics:   'bg-sky-500/10 text-sky-400 border-sky-500/20',
    bazi:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
    fengshui: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    qmdj:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  }[cat]
}

export default function Learning({ lang, chart }: Props) {
  const [view, setView] = useState<View>('topics')
  const [filter, setFilter] = useState<Filter>('all')
  const [activeStudyTopic, setActiveStudyTopic] = useState<LearningTopic | null>(null)
  const [activeStudyMode, setActiveStudyMode] = useState<'study' | 'quiz'>('study')
  const [progress, setProgress] = useState<Record<string, TopicStatus>>(() => loadTopicProgress())
  const [notes, setNotes] = useState<LearningNote[]>(() => loadNotes())
  const [noteFilter, setNoteFilter] = useState<string>('all')
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteTopic, setNewNoteTopic] = useState('general')
  // Summarize state
  const [summary, setSummary] = useState<string | null>(null)
  const [summarizing, setSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSummarize(notesToSummarize: LearningNote[]) {
    if (!notesToSummarize.length || summarizing) return
    setSummarizing(true)
    setSummaryError('')
    setSummary(null)
    const auth = loadAuth()
    const noteText = notesToSummarize.map((n, i) =>
      `[${i + 1}] ${n.topicTitle}:\n${n.content}`
    ).join('\n\n---\n\n')
    const prompt = lang === 'bg'
      ? `Обобщи следните бележки за БаЦзъ в структурирано резюме с ключови идеи и изводи:\n\n${noteText}`
      : lang === 'ru'
      ? `Обобщи следующие заметки по БаЦзы в структурированное резюме с ключевыми идеями и выводами:\n\n${noteText}`
      : `Summarize the following BaZi study notes into a structured summary with key insights and takeaways:\n\n${noteText}`
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.token ?? ''}` },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], language: lang }),
      })
      const data = await res.json() as { reply?: string; balance?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'error')
      if (data.balance !== undefined && auth) saveAuth({ ...auth, balance: data.balance })
      setSummary(data.reply ?? '')
    } catch {
      setSummaryError(lang === 'bg' ? 'Грешка при обобщаване' : lang === 'ru' ? 'Ошибка при обобщении' : 'Summarization failed')
    } finally {
      setSummarizing(false)
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  function handlePrint(notesToPrint: LearningNote[], summaryText: string | null) {
    const titleText = lang === 'bg' ? 'Резюме на бележки' : lang === 'ru' ? 'Резюме заметок' : 'Notes Summary'
    const win = window.open('', '_blank')
    if (!win) return
    const notesList = notesToPrint.map(n =>
      `<div style="margin-bottom:1.5em;border-bottom:1px solid #eee;padding-bottom:1.5em">
        <div style="font-size:11px;color:#888;margin-bottom:4px">${n.topicTitle} · ${new Date(n.date).toLocaleDateString()}</div>
        <p style="margin:0;white-space:pre-wrap">${n.content}</p>
       </div>`
    ).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>${titleText}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;line-height:1.6}
      h1{font-size:1.4em;margin-bottom:.3em}h2{font-size:1.1em;margin-top:2em;color:#333}
      .summary{background:#fffbf0;border:1px solid #f0d080;border-radius:8px;padding:1.2em;margin-bottom:2em;white-space:pre-wrap}
      @media print{.summary{border-color:#ccc}}</style></head>
      <body><h1>${titleText}</h1>
      ${summaryText ? `<h2>${lang === 'bg' ? 'AI Резюме' : lang === 'ru' ? 'AI Резюме' : 'AI Summary'}</h2><div class="summary">${summaryText}</div>` : ''}
      <h2>${lang === 'bg' ? 'Бележки' : lang === 'ru' ? 'Заметки' : 'Notes'} (${notesToPrint.length})</h2>${notesList}
      </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  function setStatus(topicId: string, status: TopicStatus) {
    const updated = { ...progress, [topicId]: status }
    setProgress(updated)
    saveTopicProgress(updated)
  }

  function cycleStatus(topicId: string) {
    const current = progress[topicId] ?? 'not_started'
    const next: Record<TopicStatus, TopicStatus> = {
      not_started: 'in_progress',
      in_progress: 'completed',
      completed: 'not_started',
    }
    setStatus(topicId, next[current])
  }

  function deleteNote(id: string) {
    const updated = notes.filter(n => n.id !== id)
    setNotes(updated)
    saveNotes(updated)
  }

  function addNote() {
    if (!newNoteContent.trim()) return
    const topic = LEARNING_TOPICS.find(t => t.id === newNoteTopic)
    const note: LearningNote = {
      id: Date.now().toString(),
      topicId: newNoteTopic,
      topicTitle: topic ? topic.title[lang] : (lang === 'bg' ? 'Общо' : lang === 'ru' ? 'Общее' : 'General'),
      content: newNoteContent.trim(),
      date: new Date().toISOString().split('T')[0],
    }
    const updated = [note, ...notes]
    setNotes(updated)
    saveNotes(updated)
    setNewNoteContent('')
    setShowAddNote(false)
  }

  const filteredTopics = LEARNING_TOPICS.filter(topic => {
    const status = progress[topic.id] ?? 'not_started'
    if (filter === 'all') return true
    return status === filter
  })

  const noteTopicIds = [...new Set(notes.map(n => n.topicId))]
  const filteredNotes = noteFilter === 'all' ? notes : notes.filter(n => n.topicId === noteFilter)

  const totalNotes = notes.length
  const inProgressCount = LEARNING_TOPICS.filter(t => (progress[t.id] ?? 'not_started') === 'in_progress').length
  const completedCount  = LEARNING_TOPICS.filter(t => (progress[t.id] ?? 'not_started') === 'completed').length

  const filters: { key: Filter; labelKey: string; count?: number }[] = [
    { key: 'all',         labelKey: 'learnAll'        },
    { key: 'in_progress', labelKey: 'learnInProgress', count: inProgressCount  },
    { key: 'not_started', labelKey: 'learnNotStarted' },
    { key: 'completed',   labelKey: 'learnCompleted',  count: completedCount   },
  ]

  const dateLocale = lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-US'

  // ── STUDY VIEW (inline chat) ──────────────────────────────────────────────
  if (view === 'study' && activeStudyTopic && chart) {
    return (
      <div className="flex flex-col pb-24 md:pb-4 px-4 md:px-8 pt-6 max-w-4xl mx-auto" style={{ height: 'calc(100vh - 0px)' }}>
        <StudyChat
          topic={activeStudyTopic}
          mode={activeStudyMode}
          chart={chart}
          lang={lang}
          onBack={() => setView('topics')}
          onMarkDone={() => {
            setStatus(activeStudyTopic.id, 'completed')
            setView('topics')
          }}
        />
      </div>
    )
  }

  // ── TOPICS / NOTES VIEW ───────────────────────────────────────────────────
  return (
    <div className="bz-page max-w-5xl">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          {view === 'notes' && (
            <button
              onClick={() => setView('topics')}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors mb-2"
            >
              <ChevronLeft size={14} />
              {t('learnBackToTopics', lang)}
            </button>
          )}
          <h1 className="text-2xl font-bold text-zinc-100">
            {view === 'notes' ? t('learnNotes', lang) : t('learnTitle', lang)}
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {view === 'notes'
              ? `${totalNotes} ${totalNotes === 1 ? t('learnNote', lang) : t('learnNoteP', lang)}`
              : `${LEARNING_TOPICS.length} ${t('learnTopics', lang)} · ${completedCount} ${t('learnCompleted', lang).toLowerCase()}`
            }
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          {view === 'notes' && filteredNotes.length > 0 && (
            <button
              onClick={() => { setSummary(null); handleSummarize(filteredNotes) }}
              disabled={summarizing}
              className="bz-btn bz-btn-ghost text-xs px-3 py-2"
              title={lang === 'bg' ? 'Обобщи бележките с AI' : lang === 'ru' ? 'Обобщить заметки через AI' : 'Summarize notes with AI'}
            >
              <Sparkles size={12} />
              {summarizing
                ? (lang === 'bg' ? 'Обобщава...' : lang === 'ru' ? 'Обобщение...' : 'Summarizing...')
                : (lang === 'bg' ? 'Обобщи' : lang === 'ru' ? 'Резюме' : 'Summarize')}
            </button>
          )}
          {view === 'notes' && (
            <button
              onClick={() => setShowAddNote(v => !v)}
              className="bz-btn bz-btn-primary text-xs px-3 py-2"
            >
              <Plus size={13} />
              {lang === 'bg' ? 'Добави' : lang === 'ru' ? 'Добавить' : 'Add'}
            </button>
          )}
          <button
            onClick={() => setView(view === 'topics' ? 'notes' : 'topics')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors border ${
              view === 'notes'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
            }`}
          >
            <FileText size={14} />
            {t('learnNotes', lang)}
            {totalNotes > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalNotes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── NOTES VIEW ── */}
      {view === 'notes' && (
        <div>
          {/* Add note form */}
          {showAddNote && (
            <div className="mb-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-200">
                  {lang === 'bg' ? 'Нова бележка' : lang === 'ru' ? 'Новая заметка' : 'New Note'}
                </h3>
                <button onClick={() => setShowAddNote(false)} className="text-zinc-600 hover:text-zinc-400">
                  <X size={14} />
                </button>
              </div>
              <select
                value={newNoteTopic}
                onChange={e => setNewNoteTopic(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 mb-3 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="general">{t('saveNoteGeneral', lang)}</option>
                {LEARNING_TOPICS.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.title[lang]}</option>
                ))}
              </select>
              <textarea
                autoFocus
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                placeholder={lang === 'bg' ? 'Съдържание на бележката...' : lang === 'ru' ? 'Содержание заметки...' : 'Note content...'}
                rows={4}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-amber-500 transition-colors mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={addNote}
                  disabled={!newNoteContent.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm font-semibold transition-colors"
                >
                  {lang === 'bg' ? 'Запази' : lang === 'ru' ? 'Сохранить' : 'Save'}
                </button>
                <button
                  onClick={() => setShowAddNote(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
                >
                  {lang === 'bg' ? 'Отмени' : lang === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Topic filter pills */}
          {noteTopicIds.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              <button
                onClick={() => setNoteFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  noteFilter === 'all'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t('learnAll', lang)} ({notes.length})
              </button>
              {noteTopicIds.map(topicId => {
                const topic = LEARNING_TOPICS.find(t => t.id === topicId)
                const label = topic ? topic.title[lang] : (lang === 'bg' ? 'Общо' : lang === 'ru' ? 'Общее' : 'General')
                const count = notes.filter(n => n.topicId === topicId).length
                return (
                  <button
                    key={topicId}
                    onClick={() => setNoteFilter(topicId)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      noteFilter === topicId
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Summary panel */}
          {(summary || summarizing || summaryError) && (
            <div className="mb-5 bz-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-sm font-semibold text-zinc-200">
                    {lang === 'bg' ? 'AI Резюме' : lang === 'ru' ? 'AI Резюме' : 'AI Summary'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {summary && (
                    <>
                      <button
                        onClick={() => handleCopy(summary)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Copy size={12} />
                        {copied ? '✓' : (lang === 'bg' ? 'Копирай' : lang === 'ru' ? 'Копировать' : 'Copy')}
                      </button>
                      <button
                        onClick={() => handlePrint(filteredNotes, summary)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Printer size={12} />
                        {lang === 'bg' ? 'Принтирай / PDF' : lang === 'ru' ? 'Печать / PDF' : 'Print / PDF'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { setSummary(null); setSummaryError('') }}
                    className="text-zinc-600 hover:text-zinc-400"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              {summarizing && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <span className="animate-pulse">
                    {lang === 'bg' ? '✦ Обобщавам...' : lang === 'ru' ? '✦ Обобщаю...' : '✦ Summarizing...'}
                  </span>
                </div>
              )}
              {summaryError && <p className="text-red-400 text-sm">{summaryError}</p>}
              {summary && <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{summary}</p>}
            </div>
          )}

          {/* Notes list */}
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t('learnNoNotes', lang)}</p>
              <p className="text-xs mt-1 text-zinc-700">
                {lang === 'bg' ? 'Запазвай отговори от "Попитай" или добави ръчно'
                 : lang === 'ru' ? 'Сохраняйте ответы из «Спроси» или добавляйте вручную'
                 : 'Save responses from Ask, or add manually'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map(note => {
                const topic = LEARNING_TOPICS.find(t => t.id === note.topicId)
                return (
                  <div key={note.id} className="bz-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {topic && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColor(topic.category)}`}>
                            {note.topicTitle}
                          </span>
                        )}
                        <span className="text-xs text-zinc-600">
                          {new Date(note.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="flex-shrink-0 p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TOPICS VIEW ── */}
      {view === 'topics' && (
        <div>
          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap mb-5">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === f.key
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t(f.labelKey, lang)}
                {f.count !== undefined && f.count > 0 && (
                  <span className="bg-amber-500 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Topic cards grid */}
          {filteredTopics.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">
                {lang === 'bg' ? 'Няма теми в тази категория'
                 : lang === 'ru' ? 'Нет тем в этой категории'
                 : 'No topics in this category'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTopics.map(topic => {
                const status = progress[topic.id] ?? 'not_started'
                const topicNoteCount = notes.filter(n => n.topicId === topic.id).length

                return (
                  <div key={topic.id} className="bz-card p-4 flex flex-col gap-3 hover:bz-card-hover transition-shadow">
                    {/* Top row: category + status */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${categoryColor(topic.category)}`}>
                        {CATEGORY_LABELS[topic.category][lang]}
                      </span>
                      <button
                        onClick={() => cycleStatus(topic.id)}
                        className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                        title={lang === 'bg' ? 'Смени статуса' : lang === 'ru' ? 'Изменить статус' : 'Toggle status'}
                      >
                        <StatusIcon status={status} />
                        <span className={`${statusColor(status)} hidden sm:inline`}>
                          {status === 'completed'  ? t('learnCompleted', lang)  :
                           status === 'in_progress' ? t('learnInProgress', lang) :
                           t('learnNotStarted', lang)}
                        </span>
                      </button>
                    </div>

                    {/* Title + description */}
                    <div>
                      <h3 className="font-semibold text-zinc-100 mb-1 leading-snug">{topic.title[lang]}</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed">{topic.description[lang]}</p>
                    </div>

                    {/* Note count */}
                    {topicNoteCount > 0 && (
                      <button
                        onClick={() => { setNoteFilter(topic.id); setView('notes') }}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition-colors self-start"
                      >
                        <FileText size={11} />
                        {topicNoteCount} {topicNoteCount === 1 ? t('learnNote', lang) : t('learnNoteP', lang)}
                      </button>
                    )}

                    {/* Study / Quiz buttons */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => {
                          setStatus(topic.id, 'in_progress')
                          setActiveStudyTopic(topic)
                          setActiveStudyMode('study')
                          setView('study')
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 text-xs font-medium transition-colors"
                      >
                        <BookOpen size={12} />
                        {t('learnStudy', lang)}
                      </button>
                      <button
                        onClick={() => {
                          setStatus(topic.id, 'in_progress')
                          setActiveStudyTopic(topic)
                          setActiveStudyMode('quiz')
                          setView('study')
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-zinc-700 hover:border-purple-500/50 text-zinc-300 hover:text-purple-400 text-xs font-medium transition-colors"
                      >
                        <Brain size={12} />
                        {t('learnQuiz', lang)}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
