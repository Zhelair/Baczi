import type { Language } from '../engine/types'
import type { GuideEntry } from '../data/guideContent'

interface Props {
  entry: GuideEntry
  lang: Language
  onClose: () => void
  onSaveNote?: (content: string) => void
}

export default function GuideModal({ entry, lang, onClose, onSaveNote }: Props) {
  const title = entry.title[lang]
  const body  = entry.body[lang]

  const saveLabel = lang === 'bg' ? 'Запази бележка' : lang === 'ru' ? 'Сохранить заметку' : 'Save note'
  const closeLabel = lang === 'bg' ? 'Затвори' : lang === 'ru' ? 'Закрыть' : 'Close'

  function handleSave() {
    onSaveNote?.(`**${title}**\n\n${body}`)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-t-2xl md:rounded-2xl px-6 py-5 shadow-2xl mx-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto mb-4 md:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between mb-3 gap-3">
          <h3 className="text-base font-semibold text-zinc-100 leading-snug">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 text-lg leading-none"
            aria-label={closeLabel}
          >✕</button>
        </div>

        {/* Body */}
        <p className="text-sm text-zinc-400 leading-relaxed mb-5">{body}</p>

        {/* Actions */}
        <div className="flex gap-2">
          {onSaveNote && (
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-colors"
            >
              📝 {saveLabel}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
