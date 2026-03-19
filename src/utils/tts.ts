import type { Language } from '../engine/types'

const LANG_CODE: Record<Language, string> = {
  bg: 'bg-BG',
  ru: 'ru-RU',
  en: 'en-US',
}

export function speak(text: string, lang: Language, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANG_CODE[lang]
  utterance.rate = 0.92
  utterance.pitch = 1.0
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function isSpeaking() {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window
