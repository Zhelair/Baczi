import { useState, useRef, useEffect } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { loadAuth } from '../utils/storage'
import type { BaziChart } from '../engine/types'
import type { Language } from '../engine/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  chart: BaziChart
  lang: Language
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

export default function AskBazi({ chart, lang }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply! }])

      // Update balance in storage
      if (data.balance !== undefined) {
        const stored = loadAuth()
        if (stored) {
          const { saveAuth } = await import('../utils/storage')
          saveAuth({ ...stored, balance: data.balance })
        }
      }
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

  return (
    <div className="flex flex-col h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-zinc-100">
            {lang === 'bg' ? 'Попитай картата' : lang === 'ru' ? 'Спроси карту' : 'Ask your chart'}
          </h2>
        </div>
        <p className="text-xs text-zinc-500">
          {lang === 'bg' ? '15 жетона на въпрос' : lang === 'ru' ? '15 токенов за вопрос' : '15 tokens per question'}
        </p>
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
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-amber-500 text-black rounded-br-sm font-medium'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}
            >
              {m.content}
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
        <div className="flex gap-2 items-end bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 focus-within:border-amber-500/50 transition-colors">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={PLACEHOLDER[lang]}
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none disabled:opacity-50 max-h-28 py-1"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
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
