import type { ReactNode } from 'react'
import type { GuideEntry } from '../data/guideContent'

interface Props {
  guideMode: boolean
  entry: GuideEntry
  onOpen: (entry: GuideEntry) => void
  children: ReactNode
  className?: string
}

export default function GuideElement({ guideMode, entry, onOpen, children, className = '' }: Props) {
  if (!guideMode) return <>{children}</>

  return (
    <div
      className={`relative cursor-pointer rounded-xl ${className}`}
      onClick={() => onOpen(entry)}
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-xl border-2 border-amber-400/50 animate-pulse pointer-events-none z-10" />
      {children}
    </div>
  )
}
