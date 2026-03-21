import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles, History, Download, Trash2, FolderOpen, X, Save, Upload, Volume2, VolumeX, Mic, MicOff, BookmarkPlus, Check } from 'lucide-react'
import { loadAuth, saveAuth as _saveAuth, loadChatSessions, saveChatSessions, loadNotes, saveNotes, addHistoryEntry, updateHistoryEntry, type ChatSession, type LearningNote } from '../utils/storage'
import { speak, stopSpeaking, ttsAvailable, startSTT, sttAvailable, stripMarkdown, type STTHandle } from '../utils/tts'
import { LEARNING_TOPICS } from '../data/learningTopics'
import { t } from '../engine/translations'
import type { BaziChart } from '../engine/types'
import type { Language } from '../engine/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface StudyContext {
  topicId: string
  topicTitle: string
  mode: 'study' | 'quiz'
  prompt: string
}

interface Props {
  chart: BaziChart
  lang: Language
  studyContext?: StudyContext | null
  onNavigateToNotes?: () => void
}

const STARTERS: Record<Language, string[]> = {
  bg: [
    'Какъв е моят Господар на деня?',
    'Кои часове са ми щастливи днес?',
    'Как изглежда финансовата ми енергия?',
    'Кое е най-силното в картата ми?',
  ],
  ru: [
    'Кто мой Хозяин дня?',
    'Какие часы для меня сегодня удачны?',
    'Как выглядит моя финансовая энергия?',
    'Что самое сильное в моей карте?',
  ],
  en: [
    'Who is my Day Master?',
    'What are my lucky hours today?',
    'How does my financial energy look?',
    'What is the strongest element in my chart?',
  ],
}

const PLACEHOLDER: Record<Language, string> = {
  bg: 'Задай въпрос за твоята карта...',
  ru: 'Задай вопрос о своей карте...',
  en: 'Ask about your chart...',
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function AskBazi({ chart, lang, studyContext, onNavigateToNotes }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadChatSessions())
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  // Save to Notes state
  const [saveNoteFor, setSaveNoteFor] = useState<number | null>(null)  // message index
  const [saveNoteTopic, setSaveNoteTopic] = useState('general')
  const [saveNoteContent, setSaveNoteContent] = useState('')
  const [savedNoteIdx, setSavedNoteIdx] = useState<number | null>(null) // flash confirmation
  const sttRef = useRef<STTHandle | null>(null)
  const importRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const studySentRef = useRef(false)
  const historyIdRef = useRef<string | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Stop TTS when unmounting
  useEffect(() => () => stopSpeaking(), [])

  // Auto-send study/quiz prompt when coming from Learning screen
  useEffect(() => {
    if (studyContext && !studySentRef.current) {
      studySentRef.current = true
      historyIdRef.current = null
      setMessages([])
      send(studyContext.prompt)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyContext])

  function speakMessage(idx: number, text: string) {
    if (speakingIdx === idx) {
      stopSpeaking()
      setSpeakingIdx(null)
      return
    }
    setSpeakingIdx(idx)
    speak(text, lang, () => setSpeakingIdx(null))
  }

  function readAll() {
    const assistantTexts = messages
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join(' ... ')
    if (!assistantTexts) return
    setSpeakingIdx(-1) // -1 = reading all
    speak(assistantTexts, lang, () => setSpeakingIdx(null))
  }

  function stopAll() {
    stopSpeaking()
    setSpeakingIdx(null)
  }

  function toggleRecording() {
    if (isRecording) {
      sttRef.current?.stop()
      sttRef.current = null
      setIsRecording(false)
      return
    }
    setIsRecording(true)
    sttRef.current = startSTT(
      lang,
      (text) => setInput(text),
      () => { setIsRecording(false); sttRef.current = null },
      () => { setIsRecording(false); sttRef.current = null },
    )
    if (!sttRef.current) setIsRecording(false)
  }

  function discardRecording() {
    sttRef.current?.stop()
    sttRef.current = null
    setIsRecording(false)
    setInput('')
  }

  function saveSession() {
    const name = saveName.trim() || new Date().toLocaleDateString(lang === 'bg' ? 'bg-BG' : lang === 'ru' ? 'ru-RU' : 'en-GB')
    const session: ChatSession = {
      id: Date.now().toString(),
      name,
      date: new Date().toISOString().split('T')[0],
      messages,
    }
    const updated = [session, ...sessions]
    saveChatSessions(updated)
    setSessions(updated)
    setSaveName('')
    setShowSaveInput(false)
  }

  function openSaveNote(idx: number, content: string) {
    setSaveNoteFor(idx)
    setSaveNoteContent(stripMarkdown(content))
    setSaveNoteTopic(studyContext?.topicId ?? 'general')
  }

  function confirmSaveNote() {
    if (!saveNoteContent.trim()) return
    const topic = LEARNING_TOPICS.find(t => t.id === saveNoteTopic)
    const note: LearningNote = {
      id: Date.now().toString(),
      topicId: saveNoteTopic,
      topicTitle: topic ? topic.title[lang] : (lang === 'bg' ? 'Общо' : lang === 'ru' ? 'Общее' : 'General'),
      content: saveNoteContent.trim(),
      date: new Date().toISOString().split('T')[0],
    }
    const updated = [note, ...loadNotes()]
    saveNotes(updated)
    setSavedNoteIdx(saveNoteFor)
    setSaveNoteFor(null)
    setSaveNoteContent('')
    setTimeout(() => setSavedNoteIdx(null), 2500)
  }

  function deleteSession(id: string) {
    const updated = sessions.filter(s => s.id !== id)
    saveChatSessions(updated)
    setSessions(updated)
  }

  function loadSession(session: ChatSession) {
    setMessages(session.messages)
    setShowHistory(false)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as Partial<ChatSession>
        if (!parsed.messages || !Array.isArray(parsed.messages)) {
          alert(lang === 'bg' ? 'Невалиден файл' : lang === 'ru' ? 'Неверный файл' : 'Invalid file format')
          return
        }
        const imported: ChatSession = {
          id: Date.now().toString(),
          name: parsed.name ?? file.name.replace('.json', ''),
          date: parsed.date ?? new Date().toISOString().split('T')[0],
          messages: parsed.messages,
        }
        const updated = [imported, ...sessions]
        saveChatSessions(updated)
        setSessions(updated)
        setShowHistory(true)
      } catch {
        alert(lang === 'bg' ? 'Грешка при четене на файла' : lang === 'ru' ? 'Ошибка чтения файла' : 'Error reading file')
      }
    }
    reader.readAsText(file)
    // Reset so same file can be imported again
    e.target.value = ''
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth?.token ?? ''}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          chart,
          language: lang,
        }),
      })

      const data = await res.json() as { reply?: string; error?: string; balance?: number }

      if (!res.ok) {
        if (res.status === 429) {
          setError(lang === 'bg' ? 'Недостатъчно жетони' : lang === 'ru' ? 'Недостаточно токенов' : 'Insufficient tokens')
        } else {
          setError(data.error ?? 'Error')
        }
        setMessages(prev => prev.slice(0, -1))
        return
      }

      const reply = data.reply!
      const updatedMessages = [...newMessages, { role: 'assistant' as const, content: reply }]
      setMessages(updatedMessages)

      if (data.balance !== undefined) {
        const stored = loadAuth()
        if (stored) _saveAuth({ ...stored, balance: data.balance })
      }

      // Auto-save to history (upsert per session)
      const summary = stripMarkdown(reply).slice(0, 140)
      const firstUserMsg = updatedMessages.find(m => m.role === 'user')?.content ?? ''
      const entry = {
        tool: 'ask' as const,
        title: firstUserMsg.slice(0, 60) + (firstUserMsg.length > 60 ? '…' : ''),
        summary,
        date: new Date().toISOString().split('T')[0],
        data: { messages: updatedMessages },
      }
      if (historyIdRef.current) updateHistoryEntry(historyIdRef.current, entry)
      else historyIdRef.current = addHistoryEntry(entry)
    } catch {
      setError(lang === 'bg' ? 'Грешка при връзката' : lang === 'ru' ? 'Ошибка соединения' : 'Connection error')
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const empty = messages.length === 0
  const assistantCount = messages.filter(m => m.role === 'assistant').length

  return (
    <div className="flex flex-col h-screen pb-20 md:pb-0 max-w-4xl mx-auto w-full px-0 md:px-4">
      {/* Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">
                {studyContext
                  ? studyContext.topicTitle
                  : (lang === 'bg' ? 'Попитай картата' : lang === 'ru' ? 'Спроси карту' : 'Ask your chart')}
              </h2>
              {studyContext && (
                <p className="text-xs text-amber-500">
                  {studyContext.mode === 'study'
                    ? (lang === 'bg' ? '📖 Режим учене' : lang === 'ru' ? '📖 Режим учёбы' : '📖 Study mode')
                    : (lang === 'bg' ? '🎯 Режим тест' : lang === 'ru' ? '🎯 Режим теста' : '🎯 Quiz mode')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Read all / stop */}
            {ttsAvailable && assistantCount > 0 && (
              speakingIdx !== null ? (
                <button
                  onClick={stopAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                >
                  <VolumeX size={13} />
                  {lang === 'bg' ? 'Спри' : lang === 'ru' ? 'Стоп' : 'Stop'}
                </button>
              ) : (
                <button
                  onClick={readAll}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  title={lang === 'bg' ? 'Прочети всичко' : lang === 'ru' ? 'Читать всё' : 'Read all'}
                >
                  <Mic size={13} />
                  {lang === 'bg' ? 'Прочети' : lang === 'ru' ? 'Читать' : 'Read all'}
                </button>
              )
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setShowSaveInput(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                title={lang === 'bg' ? 'Запази сесията' : lang === 'ru' ? 'Сохранить сессию' : 'Save session'}
              >
                <Save size={13} />
                {lang === 'bg' ? 'Запази' : lang === 'ru' ? 'Сохранить' : 'Save'}
              </button>
            )}
            <button
              onClick={() => setShowHistory(v => !v)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                showHistory ? 'bg-amber-500/10 text-amber-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <History size={13} />
              {sessions.length > 0 && (
                <span className="bg-amber-500 text-black text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {sessions.length}
                </span>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          {lang === 'bg' ? '15 жетона на въпрос' : lang === 'ru' ? '15 токенов за вопрос' : '15 tokens per question'}
          {lang === 'bg' && (
            <span className="ml-2 text-zinc-700" title="Bulgarian TTS depends on your browser/OS. If it sounds wrong, your device may lack a Bulgarian voice.">· ⓘ гласът зависи от браузъра</span>
          )}
        </p>

        {showSaveInput && (
          <div className="mt-3 flex gap-2">
            <input
              autoFocus
              type="text"
              placeholder={lang === 'bg' ? 'Име на сесията...' : lang === 'ru' ? 'Название сессии...' : 'Session name...'}
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveSession()}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button onClick={saveSession} className="px-3 py-1.5 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors">
              OK
            </button>
            <button onClick={() => setShowSaveInput(false)} className="px-2 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
              <X size={14} />
            </button>
          </div>
        )}

        {showHistory && (
          <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-200">
                {lang === 'bg' ? 'Запазени сесии' : lang === 'ru' ? 'Сохранённые сессии' : 'Saved sessions'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-zinc-800"
                  title={lang === 'bg' ? 'Импортирай JSON' : lang === 'ru' ? 'Импорт JSON' : 'Import JSON'}
                >
                  <Upload size={12} />
                  {lang === 'bg' ? 'Импортирай' : lang === 'ru' ? 'Импорт' : 'Import'}
                </button>
                <button onClick={() => setShowHistory(false)} className="text-zinc-600 hover:text-zinc-400">
                  <X size={14} />
                </button>
              </div>
            </div>
            {sessions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-zinc-600">
                {lang === 'bg' ? 'Няма запазени сесии' : lang === 'ru' ? 'Нет сохранённых сессий' : 'No saved sessions yet'}
              </p>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-zinc-800">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center gap-2 px-4 py-3 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{s.name}</p>
                      <p className="text-xs text-zinc-600">{s.date} · {s.messages.length} {lang === 'bg' ? 'съобщения' : lang === 'ru' ? 'сообщений' : 'messages'}</p>
                    </div>
                    <button onClick={() => loadSession(s)} className="p-1.5 text-zinc-500 hover:text-amber-400 transition-colors" title="Load">
                      <FolderOpen size={14} />
                    </button>
                    <button
                      onClick={() => downloadJson(s, `bazi-${s.name.replace(/\s+/g, '-')}.json`)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-200 transition-colors"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button onClick={() => deleteSession(s.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-2">
        {empty && (
          <div className="pt-4">
            <p className="text-xs text-zinc-600 mb-3 text-center">
              {lang === 'bg' ? 'Бързи въпроси:' : lang === 'ru' ? 'Быстрые вопросы:' : 'Quick questions:'}
            </p>
            <div className="space-y-2">
              {STARTERS[lang].map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-amber-500/40 hover:bg-zinc-800 text-zinc-300 text-sm transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                <span className="text-xs">☯</span>
              </div>
            )}
            <div className="flex flex-col gap-1 max-w-[82%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-amber-500 text-black rounded-br-sm font-medium'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
                }`}
              >
                {m.role === 'assistant' ? stripMarkdown(m.content) : m.content}
              </div>
              {/* Action buttons for assistant messages */}
              {m.role === 'assistant' && (
                <div className="self-start flex items-center gap-2 flex-wrap">
                  {ttsAvailable && (
                    <button
                      onClick={() => speakMessage(i, m.content)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-colors ${
                        speakingIdx === i
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {speakingIdx === i ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      {speakingIdx === i
                        ? (lang === 'bg' ? 'спри' : lang === 'ru' ? 'стоп' : 'stop')
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
                      <BookmarkPlus size={11} />
                      {t('saveToNotes', lang)}
                    </button>
                  )}
                </div>
              )}

              {/* Save to Notes panel */}
              {m.role === 'assistant' && saveNoteFor === i && (
                <div className="mt-2 rounded-xl border border-zinc-700 bg-zinc-900 p-3 w-full max-w-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-300">{t('saveNoteTitle', lang)}</span>
                    <button onClick={() => setSaveNoteFor(null)} className="text-zinc-600 hover:text-zinc-400">
                      <X size={12} />
                    </button>
                  </div>
                  <select
                    value={saveNoteTopic}
                    onChange={e => setSaveNoteTopic(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 mb-2 focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="general">{t('saveNoteGeneral', lang)}</option>
                    {LEARNING_TOPICS.map(topic => (
                      <option key={topic.id} value={topic.id}>{topic.title[lang]}</option>
                    ))}
                  </select>
                  <textarea
                    value={saveNoteContent}
                    onChange={e => setSaveNoteContent(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-200 resize-none focus:outline-none focus:border-amber-500 transition-colors mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={confirmSaveNote}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold transition-colors"
                    >
                      {lang === 'bg' ? 'Запази' : lang === 'ru' ? 'Сохранить' : 'Save'}
                    </button>
                    {onNavigateToNotes && (
                      <button
                        onClick={() => { confirmSaveNote(); onNavigateToNotes() }}
                        className="px-3 py-1.5 rounded-lg border border-zinc-600 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                      >
                        {lang === 'bg' ? 'Виж бележките' : lang === 'ru' ? 'К заметкам' : 'View Notes'}
                      </button>
                    )}
                  </div>
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

        {error && (
          <p className="text-center text-xs text-red-400">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-2 flex-shrink-0">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-red-950/60 border border-red-700/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-300">
                {lang === 'bg' ? 'Записва...' : lang === 'ru' ? 'Запись...' : 'Recording...'}
              </span>
            </div>
            <button onClick={discardRecording} className="text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1">
              <X size={12} />
              {lang === 'bg' ? 'Откажи' : lang === 'ru' ? 'Отмена' : 'Discard'}
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
              : PLACEHOLDER[lang]
            }
            rows={1}
            disabled={loading || isRecording}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none disabled:opacity-50 max-h-28 py-1"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          {/* Mic button — STT */}
          {sttAvailable && !loading && (
            <button
              onClick={toggleRecording}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors mb-0.5 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title={isRecording
                ? (lang === 'bg' ? 'Спри записа' : lang === 'ru' ? 'Остановить' : 'Stop recording')
                : (lang === 'bg' ? 'Говори' : lang === 'ru' ? 'Говорить' : 'Speak')
              }
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
        <p className="text-xs text-zinc-700 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
