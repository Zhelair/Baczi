/**
 * Studio — Editor/Admin mode screen.
 * Provides: client sub-chats, consultation builder, drafts, reasoning overlay.
 */
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, FileText, Archive, Trash2, Copy, Download, Upload, X, Wand2, Eye, EyeOff } from 'lucide-react'
import { t } from '../engine/translations'
import type { Language, BaziChart } from '../engine/types'
import type { PersonProfile } from '../utils/storage'
import {
  loadAuth,
  getOrCreateStudioClient,
  saveStudioClient,
  addStudioSubChat,
  deleteStudioSubChat,
  loadConsultationDrafts,
  saveConsultationDraft,
  deleteConsultationDraft,
  type ClientSubChat,
  type ConsultationDraft,
} from '../utils/storage'
import { calculateChart } from '../engine/baziCalculator'

interface Props {
  lang: Language
  persons: PersonProfile[]
  chart: BaziChart | null  // currently active chart (own or selected person)
}

type StudioTab = 'chat' | 'builder' | 'drafts'

const TOPICS = ['weekly', 'bazi', 'fengshui', 'qimen', 'custom'] as const
type Topic = typeof TOPICS[number]

const TOPIC_LABEL_KEYS: Record<Topic, string> = {
  weekly: 'studioTopicWeekly',
  bazi: 'studioTopicBazi',
  fengshui: 'studioTopicFengshui',
  qimen: 'studioTopicQimen',
  custom: 'studioTopicCustom',
}

function getPersonChart(person: PersonProfile, lang: Language): BaziChart | null {
  try {
    return calculateChart(
      person.birthYear, person.birthMonth, person.birthDay,
      person.birthHour ?? null, person.birthMinute ?? null,
      person.gender, lang,
      person.birthLongitude, person.birthUtcOffset,
    )
  } catch { return null }
}

// ─── Sub-chat panel ────────────────────────────────────────────────────────────

function SubChatPanel({ person, lang }: { person: PersonProfile; lang: Language }) {
  const [client, setClient] = useState(() => getOrCreateStudioClient(person.id))
  const [activeChatId, setActiveChatId] = useState(client.chats[0]?.id ?? '')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [newChatName, setNewChatName] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeChat = client.chats.find((c: ClientSubChat) => c.id === activeChatId) ?? client.chats[0]

  function refresh() {
    setClient(getOrCreateStudioClient(person.id))
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages.length])

  async function sendMessage() {
    if (!input.trim() || loading || !activeChat) return
    const auth = loadAuth()
    if (!auth) return

    const personChart = getPersonChart(person, lang)
    const userMsg = { role: 'user' as const, content: input.trim() }
    setInput('')
    setLoading(true)

    // Optimistically add user message
    const updatedChats = client.chats.map((c: ClientSubChat) =>
      c.id === activeChat.id
        ? { ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString().split('T')[0] }
        : c
    )
    const updatedClient = { ...client, chats: updatedChats }
    setClient(updatedClient)
    saveStudioClient(updatedClient)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          messages: [...activeChat.messages, userMsg],
          chart: personChart ?? {},
          language: lang,
        }),
      })
      const data = await res.json() as { reply?: string; error?: string }
      const assistantMsg = { role: 'assistant' as const, content: data.reply ?? data.error ?? 'Error' }

      const finalChats = updatedClient.chats.map((c: ClientSubChat) =>
        c.id === activeChat.id
          ? { ...c, messages: [...c.messages, assistantMsg] }
          : c
      )
      const finalClient = { ...updatedClient, chats: finalChats }
      setClient(finalClient)
      saveStudioClient(finalClient)
    } catch {
      // revert user message on failure
      refresh()
    } finally {
      setLoading(false)
    }
  }

  function handleAddChat() {
    if (!newChatName.trim()) return
    const chat = addStudioSubChat(person.id, newChatName.trim())
    refresh()
    setActiveChatId(chat.id)
    setNewChatName('')
    setShowNewChat(false)
  }

  function handleDeleteChat(chatId: string) {
    deleteStudioSubChat(person.id, chatId)
    const updated = getOrCreateStudioClient(person.id)
    setClient(updated)
    if (activeChatId === chatId) setActiveChatId(updated.chats[0]?.id ?? '')
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: '500px' }}>
      {/* Chat tabs */}
      <div className="flex items-center gap-1 flex-wrap px-4 pt-3 pb-2 border-b" style={{ borderColor: 'var(--card-border)' }}>
        {client.chats.map((chat: ClientSubChat) => (
          <div key={chat.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveChatId(chat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeChatId === chat.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent hover:border-zinc-700'
              }`}
            >
              {chat.name}
            </button>
            {!chat.isDefault && activeChatId === chat.id && (
              <button
                onClick={() => handleDeleteChat(chat.id)}
                className="text-zinc-600 hover:text-red-400 transition-colors"
                title={t('studioDeleteChat', lang)}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}

        {/* Add new chat */}
        {showNewChat ? (
          <div className="flex items-center gap-1">
            <input
              value={newChatName}
              onChange={e => setNewChatName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddChat(); if (e.key === 'Escape') setShowNewChat(false) }}
              placeholder={t('studioNewChatName', lang)}
              autoFocus
              className="px-2 py-1 rounded text-xs border focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)', width: 120 }}
            />
            <button onClick={handleAddChat} className="text-violet-400 hover:text-violet-300 text-xs px-1">✓</button>
            <button onClick={() => setShowNewChat(false)} className="text-zinc-500 hover:text-zinc-300 text-xs px-1">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewChat(true)}
            className="text-xs text-zinc-500 hover:text-violet-400 transition-colors px-2 py-1"
          >
            {t('studioNewChat', lang)}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {!activeChat?.messages.length && (
          <p className="text-xs text-zinc-500 text-center mt-8">
            {lang === 'bg' ? 'Задай въпрос за ' : lang === 'ru' ? 'Задай вопрос о ' : 'Ask about '}{person.name}…
          </p>
        )}
        {activeChat?.messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600/30 text-zinc-100 rounded-br-sm'
                  : 'text-zinc-200 rounded-bl-sm border'
              }`}
              style={msg.role === 'assistant' ? { background: 'var(--card-bg)', borderColor: 'var(--card-border)' } : undefined}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl rounded-bl-sm border text-zinc-400 text-sm animate-pulse" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
              ···
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: 'var(--card-border)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={`${person.name} — ${activeChat?.name ?? ''}…`}
            disabled={loading}
            className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none border"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--color-amber-500)', color: '#000' }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Consultation builder panel ────────────────────────────────────────────────

function BuilderPanel({ person, lang }: { person: PersonProfile; lang: Language }) {
  const [topic, setTopic] = useState<Topic>('weekly')
  const [customPrompt, setCustomPrompt] = useState('')
  const [includeReasoning, setIncludeReasoning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [showReasoning, setShowReasoning] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState(false)

  async function generate() {
    const auth = loadAuth()
    if (!auth) return
    setLoading(true)
    setContent('')
    setReasoning('')

    const personChart = getPersonChart(person, lang)

    try {
      const res = await fetch('/api/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          personName: person.name,
          chart: personChart ?? {},
          topic,
          customPrompt: topic === 'custom' ? customPrompt : '',
          language: lang,
          includeReasoning,
        }),
      })
      const data = await res.json() as { content?: string; reasoning?: string; error?: string }
      if (data.error) {
        setContent(`Error: ${data.error}`)
      } else {
        setContent(data.content ?? '')
        setReasoning(data.reasoning ?? '')
      }
    } catch {
      setContent('Error: request failed')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopyFeedback(true)
    setTimeout(() => setCopyFeedback(false), 2000)
  }

  function handleSave() {
    if (!content) return
    const draft: ConsultationDraft = {
      id: `draft_${Date.now()}`,
      personId: person.id,
      personName: person.name,
      topic,
      content,
      templateName: t(TOPIC_LABEL_KEYS[topic as Topic], lang),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveConsultationDraft(draft)
    setSaveFeedback(true)
    setTimeout(() => setSaveFeedback(false), 2000)
  }

  function handleExportJson() {
    const blob = new Blob([JSON.stringify({ personName: person.name, topic, content, reasoning, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${person.name}_${topic}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Topic selector */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map(tp => (
          <button
            key={tp}
            onClick={() => setTopic(tp)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              topic === tp
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/30'
                : 'text-zinc-400 hover:text-zinc-200 border-zinc-700/60 hover:border-zinc-600'
            }`}
          >
            {t(TOPIC_LABEL_KEYS[tp], lang)}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      {topic === 'custom' && (
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">{t('studioCustomPrompt', lang)}</label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none border resize-none"
            style={{ background: 'var(--input-bg)', borderColor: 'var(--card-border)', color: 'var(--text-primary)' }}
          />
        </div>
      )}

      {/* Options */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <input
            type="checkbox"
            checked={includeReasoning}
            onChange={e => setIncludeReasoning(e.target.checked)}
            className="rounded"
          />
          {t('studioReasoning', lang)}
        </label>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        disabled={loading || (topic === 'custom' && !customPrompt.trim())}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 w-fit"
        style={{ background: loading ? 'var(--card-bg)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff' }}
      >
        {loading ? t('studioGenerating', lang) : t('studioGenerate', lang)}
      </button>

      {/* Result */}
      {content && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--card-border)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
            <span className="text-xs text-zinc-400 flex-1">{person.name} · {t(TOPIC_LABEL_KEYS[topic as Topic], lang)}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700/40"
            >
              <Copy size={12} />
              {copyFeedback ? t('studioCopied', lang) : t('studioCopy', lang)}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700/40"
            >
              <Archive size={12} />
              {saveFeedback ? t('studioSaved', lang) : t('studioSaveDraft', lang)}
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-700/40"
            >
              <Download size={12} />
              {t('studioExportJson', lang)}
            </button>
            {reasoning && (
              <button
                onClick={() => setShowReasoning(s => !s)}
                className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 rounded hover:bg-violet-900/20"
              >
                {showReasoning ? <EyeOff size={12} /> : <Eye size={12} />}
                {showReasoning ? t('studioReasoningHide', lang) : t('studioReasoning', lang)}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm text-zinc-200 leading-relaxed font-sans">{content}</pre>
          </div>

          {/* Reasoning overlay */}
          {showReasoning && reasoning && (
            <div className="border-t px-4 py-3" style={{ background: 'rgba(124, 58, 237, 0.06)', borderColor: 'var(--card-border)' }}>
              <p className="text-xs font-semibold text-violet-400 mb-2">{t('studioReasoning', lang)}</p>
              <pre className="whitespace-pre-wrap text-xs text-zinc-400 leading-relaxed font-sans">{reasoning}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Drafts panel ──────────────────────────────────────────────────────────────

function DraftsPanel({ person, lang, onLoad }: { person: PersonProfile; lang: Language; onLoad: (draft: ConsultationDraft) => void }) {
  const [drafts, setDrafts] = useState(() => loadConsultationDrafts().filter(d => d.personId === person.id))

  function refresh() {
    setDrafts(loadConsultationDrafts().filter(d => d.personId === person.id))
  }

  function handleDelete(id: string) {
    deleteConsultationDraft(id)
    refresh()
  }

  function handleExport(draft: ConsultationDraft) {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${draft.personName}_${draft.topic}_${draft.createdAt.split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!drafts.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500">{t('studioNoDrafts', lang)}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {drafts.map(draft => (
        <div key={draft.id} className="rounded-xl border p-4" style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-medium text-zinc-200">{draft.templateName}</p>
              <p className="text-xs text-zinc-500">{draft.createdAt.split('T')[0]}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onLoad(draft)}
                className="text-xs text-violet-400 hover:text-violet-300 px-2 py-1 rounded transition-colors hover:bg-violet-900/20"
              >
                {t('studioLoadDraft', lang)}
              </button>
              <button
                onClick={() => handleExport(draft)}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors hover:bg-zinc-700/30"
              >
                <Download size={12} />
              </button>
              <button
                onClick={() => handleDelete(draft.id)}
                className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1 rounded transition-colors hover:bg-red-900/20"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-3">{draft.content.slice(0, 200)}…</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main Studio screen ────────────────────────────────────────────────────────

export default function Studio({ lang, persons }: Props) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(persons[0]?.id ?? null)
  const [studioTab, setStudioTab] = useState<StudioTab>('chat')
  const [loadedDraft, setLoadedDraft] = useState<ConsultationDraft | null>(null)
  const [importError, setImportError] = useState('')
  const importRef = useRef<HTMLInputElement>(null)

  const selectedPerson = persons.find(p => p.id === selectedPersonId) ?? null

  function handleImportJson(e: { target: HTMLInputElement }) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as ConsultationDraft
        if (json.content) {
          saveConsultationDraft({ ...json, id: `draft_import_${Date.now()}` })
          setStudioTab('drafts')
        } else {
          setImportError('Invalid format')
          setTimeout(() => setImportError(''), 3000)
        }
      } catch {
        setImportError('Invalid JSON')
        setTimeout(() => setImportError(''), 3000)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8 px-0" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <Wand2 size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-100">
            {lang === 'bg' ? 'Студио' : lang === 'ru' ? 'Студия' : 'Studio'}
          </h1>
          <p className="text-xs text-zinc-500">
            {lang === 'bg' ? 'Инструмент за консултанти' : lang === 'ru' ? 'Инструмент консультанта' : 'Consultant workspace'}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-full">
        {/* ── Sidebar: client selector ── */}
        <div className="md:w-56 md:border-r md:min-h-[calc(100vh-80px)] shrink-0" style={{ borderColor: 'var(--card-border)' }}>
          <div className="p-3">
            <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2 px-1">{t('studioClients', lang)}</p>
            {!persons.length ? (
              <p className="text-xs text-zinc-500 px-1 leading-snug">{t('studioNoClients', lang)}</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {persons.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPersonId(p.id); setLoadedDraft(null) }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors w-full ${
                      selectedPersonId === p.id
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/25'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-semibold shrink-0" style={{ color: 'var(--color-amber-500)' }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        {!selectedPerson ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-zinc-500 text-sm">{t('studioSelectClient', lang)}</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Client header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--card-border)' }}>
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold" style={{ color: 'var(--color-amber-500)' }}>
                {selectedPerson.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-100">{selectedPerson.name}</p>
                <p className="text-xs text-zinc-500">
                  {selectedPerson.birthYear}.{String(selectedPerson.birthMonth).padStart(2,'0')}.{String(selectedPerson.birthDay).padStart(2,'0')}
                  {selectedPerson.birthHour !== null ? ` ${String(selectedPerson.birthHour).padStart(2,'0')}:${String(selectedPerson.birthMinute ?? 0).padStart(2,'0')}` : ''}
                  {' · '}{selectedPerson.gender === 'male' ? (lang === 'bg' ? 'Мъж' : lang === 'ru' ? 'Мужчина' : 'Male') : (lang === 'bg' ? 'Жена' : lang === 'ru' ? 'Женщина' : 'Female')}
                </p>
              </div>
              {/* Import JSON */}
              <div className="ml-auto flex items-center gap-2">
                {importError && <span className="text-xs text-red-400">{importError}</span>}
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors hover:bg-zinc-700/40"
                >
                  <Upload size={12} />
                  {t('studioImportJson', lang)}
                </button>
                <input ref={importRef} type="file" accept=".json" onChange={handleImportJson} className="hidden" />
              </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 px-4 pt-3 pb-0">
              {([
                { id: 'chat' as StudioTab, icon: MessageCircle, label: lang === 'bg' ? 'Чат' : lang === 'ru' ? 'Чат' : 'Chat' },
                { id: 'builder' as StudioTab, icon: FileText, label: t('studioBuilder', lang) },
                { id: 'drafts' as StudioTab, icon: Archive, label: t('studioDrafts', lang) },
              ]).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setStudioTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-colors border border-b-0 ${
                    studioTab === id
                      ? 'bg-violet-500/15 text-violet-300 border-violet-500/25'
                      : 'text-zinc-500 hover:text-zinc-300 border-transparent hover:border-zinc-700'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 border-t overflow-auto" style={{ borderColor: 'var(--card-border)' }}>
              {studioTab === 'chat' && (
                <SubChatPanel key={selectedPerson.id} person={selectedPerson} lang={lang} />
              )}
              {studioTab === 'builder' && (
                <BuilderPanel key={selectedPerson.id + (loadedDraft?.id ?? '')} person={selectedPerson} lang={lang} />
              )}
              {studioTab === 'drafts' && (
                <DraftsPanel
                  key={selectedPerson.id}
                  person={selectedPerson}
                  lang={lang}
                  onLoad={(draft) => { setLoadedDraft(draft); setStudioTab('builder') }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
