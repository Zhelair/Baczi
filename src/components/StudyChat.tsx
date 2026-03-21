import { useState, useRef, useEffect } from 'react'
import { Send, ChevronLeft, CheckCircle2, BookmarkPlus, Check, X, Volume2, VolumeX, Mic, MicOff } from 'lucide-react'
import { loadAuth, saveAuth, loadNotes, saveNotes, addHistoryEntry, updateHistoryEntry, type LearningNote } from '../utils/storage'
import { speak, stopSpeaking, ttsAvailable, startSTT, sttAvailable, stripMarkdown, type STTHandle } from '../utils/tts'
import { LEARNING_TOPICS } from '../data/learningTopics'
import { t } from '../engine/translations'
import type { BaziChart, Language } from '../engine/types'
import type { LearningTopic } from '../data/learningTopics'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  topic: LearningTopic
  mode: 'study' | 'quiz'
  chart: BaziChart
  lang: Language
  onBack: () => void
  onMarkDone: () => void
}

export default function StudyChat({ topic, mode, chart, lang, onBack, onMarkDone }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [saveNoteFor, setSaveNoteFor] = useState<number | null>(null)
  const [saveNoteTopic, setSaveNoteTopic] = useState(topic.id)
  const [saveNoteContent, setSaveNoteContent] = useState('')
  const [savedNoteIdx, setSavedNoteIdx] = useState<number | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const sttRef = useRef<STTHandle | null>(null)
  const initSentRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => () => stopSpeaking(), [])

  // Auto-send first prompt on mount
  useEffect(() => {
    if (!initSentRef.current) {
      initSentRef.current = true
      const prompt = mode === 'study' ? topic.studyPrompt[lang] : topic.quizPrompt[lang]
      send(prompt)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function speakMsg(idx: number, text: string) {
    if (speakingIdx === idx) { stopSpeaking(); setSpeakingIdx(null); return }
    setSpeakingIdx(idx)
    speak(text, lang, () => setSpeakingIdx(null))
  }

  function toggleRecording() {
    if (isRecording) {
      sttRef.current?.stop(); sttRef.current = null; setIsRecording(false); return
    }
    setIsRecording(true)
    sttRef.current = startSTT(lang,
      (text) => setInput(text),
      () => { setIsRecording(false); sttRef.current = null },
      () => { setIsRecording(false); sttRef.current = null },
    )
    if (!sttRef.current) setIsRecording(false)
  }

  function openSaveNote(idx: number, content: string) {
    setSaveNoteFor(idx)
    setSaveNoteContent(stripMarkdown(content))
    setSaveNoteTopic(topic.id)
  }

  function confirmSaveNote() {
    if (!saveNoteContent.trim()) return
    const topicObj = LEARNING_TOPICS.find(t => t.id === saveNoteTopic)
    const note: LearningNote = {
      id: Date.now().toString(),
      topicId: saveNoteTopic,
      topicTitle: topicObj ? topicObj.title[lang] : topic.title[lang],
      content: saveNoteContent.trim(),
      date: new Date().toISOString().split('T')[0],
    }
    saveNotes([note, ...loadNotes()])
    setSavedNoteIdx(saveNoteFor)
    setSaveNoteFor(null)
    setSaveNoteContent('')
    setTimeout(() => setSavedNoteIdx(null), 2500)
  }

  function saveLastToNotes() {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant) return
    const idx = messages.lastIndexOf(lastAssistant)
    openSaveNote(idx, lastAssistant.content)
  }

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    setInput('')
    setError('')
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const auth = loadAuth()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth?.token ?? ''}` },
        body: JSON.stringify({ messages: newMessages, chart, language: lang }),
      })
      const data = await res.json() as { reply?: string; error?: string; balance?: number }

      if (!res.ok) {
        if (res.status === 429) setError(lang === 'bg' ? 'Недостатъчно жетони' : lang === 'ru' ? 'Недостаточно токенов' : 'Insufficient tokens')
        else setError(data.error ?? 'Error')
        setMessages(prev => prev.slice(0, -1))
        return
      }

      const reply = data.reply!
      const updated = [...newMessages, { role: 'assistant' as const, content: reply }]
      setMessages(updated)

      if (data.balance !== undefined) {
        const stored = loadAuth()
        if (stored) saveAuth({ ...stored, balance: data.balance })
      }

      // Auto-save to history (upsert)
      const summary = stripMarkdown(reply).slice(0, 140)
      const modeLabel = mode === 'study' ? '📖' : '🎯'
      const entry = {
        tool: 'study' as const,
        title: `${modeLabel} ${topic.title[lang]}`,
        summary,
        date: new Date().toISOString().split('T')[0],
        data: { topicId: topic.id, mode, messages: updated },
      }
      if (historyId) updateHistoryEntry(historyId, entry)
      else setHistoryId(addHistoryEntry(entry))

    } catch {
      setError(lang === 'bg' ? 'Грешка при връзката' : lang === 'ru' ? 'Ошибка соединения' : 'Connection error')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const lastAssistantIdx = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1)
  const modeLabel = mode === 'study'
    ? (lang === 'bg' ? '📖 Режим учене' : lang === 'ru' ? '📖 Режим учёбы' : '📖 Study mode')
    : (lang === 'bg' ? '🎯 Режим тест' : lang === 'ru' ? '🎯 Режим теста' : '🎯 Quiz mode')

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-0 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ChevronLeft size={16} />
              {lang === 'bg' ? 'Назад' : lang === 'ru' ? 'Назад' : 'Back'}
            </button>
            <div>
              <h2 className="font-semibold text-zinc-100 leading-tight">{topic.title[lang]}</h2>
              <p className="text-xs text-amber-500">{modeLabel}</p>
            </div>
          </div>
          <button
            onClick={onMarkDone}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-700/50 text-emerald-400 hover:bg-emerald-950/30 text-xs font-medium transition-colors"
          >
            <CheckCircle2 size={13} />
            {lang === 'bg' ? 'Готово' : lang === 'ru' ? 'Готово' : 'Done'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                <span className="text-xs">☯</span>
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[85%]">
              <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-amber-500 text-black rounded-br-sm font-medium'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}>
                {m.role === 'assistant' ? stripMarkdown(m.content) : m.content}
              </div>

              {m.role === 'assistant' && (
                <div className="self-start flex items-center gap-2 flex-wrap">
                  {ttsAvailable && (
                    <button
                      onClick={() => speakMsg(i, m.content)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-colors ${
                        speakingIdx === i ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {speakingIdx === i ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      {speakingIdx === i ? (lang === 'bg' ? 'спри' : lang === 'ru' ? 'стоп' : 'stop')
                                         : (lang === 'bg' ? 'прочети' : lang === 'ru' ? 'читать' : 'listen')}
                    </button>
                  )}
                  {savedNoteIdx === i ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-emerald-400">
                      <Check size={11} /> {t('noteSaved', lang)}
                    </span>
                  ) : (
                    <button
                      onClick={() => openSaveNote(i, m.content)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-zinc-600 hover:text-amber-400 transition-colors"
                    >
                      <BookmarkPlus size={11} /> {t('saveToNotes', lang)}
                    </button>
                  )}
                </div>
              )}

              {/* Save to notes panel */}
              {m.role === 'assistant' && saveNoteFor === i && (
                <div className="mt-1 rounded-xl border border-zinc-700 bg-zinc-900 p-3 w-full max-w-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-300">{t('saveNoteTitle', lang)}</span>
                    <button onClick={() => setSaveNoteFor(null)} className="text-zinc-600 hover:text-zinc-400"><X size={12} /></button>
                  </div>
                  <select
                    value={saveNoteTopic}
                    onChange={e => setSaveNoteTopic(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 mb-2 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="general">{t('saveNoteGeneral', lang)}</option>
                    {LEARNING_TOPICS.map(tp => (
                      <option key={tp.id} value={tp.id}>{tp.title[lang]}</option>
                    ))}
                  </select>
                  <textarea
                    value={saveNoteContent}
                    onChange={e => setSaveNoteContent(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 resize-none focus:outline-none focus:border-amber-500 transition-colors mb-2"
                  />
                  <button
                    onClick={confirmSaveNote}
                    className="w-full px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
                  >
                    {lang === 'bg' ? 'Запази' : lang === 'ru' ? 'Сохранить' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
              <span className="text-xs">☯</span>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-center text-xs text-red-400">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Persistent "Save last response" bar */}
      {lastAssistantIdx >= 0 && !loading && (
        <div className="flex-shrink-0 pt-2 pb-1 border-t border-zinc-800/60">
          {savedNoteIdx === lastAssistantIdx ? (
            <p className="text-center text-xs text-emerald-400 py-1 flex items-center justify-center gap-1">
              <Check size={11} /> {t('noteSaved', lang)}
            </p>
          ) : (
            <button
              onClick={saveLastToNotes}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-500 hover:text-amber-400 transition-colors"
            >
              <BookmarkPlus size={12} />
              {lang === 'bg' ? 'Запази последния отговор в бележките' : lang === 'ru' ? 'Сохранить последний ответ в заметки' : 'Save last response to Notes'}
            </button>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 pt-1">
        {isRecording && (
          <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-300">{lang === 'bg' ? 'Записва...' : lang === 'ru' ? 'Запись...' : 'Recording...'}</span>
            </div>
            <button onClick={() => { sttRef.current?.stop(); sttRef.current = null; setIsRecording(false); setInput('') }}
              className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1">
              <X size={12} /> {lang === 'bg' ? 'Откажи' : lang === 'ru' ? 'Отмена' : 'Discard'}
            </button>
          </div>
        )}
        <div className={`flex gap-2 items-end bg-zinc-900 border rounded-2xl px-4 py-2 transition-colors ${isRecording ? 'border-red-500/50' : 'border-zinc-800 focus-within:border-amber-500/50'}`}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isRecording
              ? (lang === 'bg' ? 'Говори...' : lang === 'ru' ? 'Говорите...' : 'Speak now...')
              : (lang === 'bg' ? 'Задай въпрос...' : lang === 'ru' ? 'Задай вопрос...' : 'Ask a question...')
            }
            rows={1}
            disabled={loading || isRecording}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none disabled:opacity-50 max-h-28 py-1"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          {sttAvailable && !loading && (
            <button
              onClick={toggleRecording}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors mb-0.5 ${
                isRecording ? 'bg-red-500 hover:bg-red-400 animate-pulse' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isRecording ? <MicOff size={14} className="text-white" /> : <Mic size={14} />}
            </button>
          )}
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading || isRecording}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors mb-0.5"
          >
            <Send size={14} className="text-black" />
          </button>
        </div>
      </div>
    </div>
  )
}
