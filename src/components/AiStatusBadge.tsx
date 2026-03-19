import type { Language } from '../engine/types'

interface Props {
  loading: boolean
  lang: Language
}

export default function AiStatusBadge({ loading, lang }: Props) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ai-thinking-badge text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full ai-thinking-dot animate-pulse" />
        {lang === 'bg' ? 'Мисля...' : lang === 'ru' ? 'Думаю...' : 'Thinking...'}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ai-connected-badge text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full ai-connected-dot" />
      {lang === 'bg' ? 'AI активен' : lang === 'ru' ? 'AI активен' : 'AI Active'}
    </span>
  )
}
