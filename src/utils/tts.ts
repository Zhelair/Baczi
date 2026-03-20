import type { Language } from '../engine/types'

const LANG_CODE: Record<Language, string> = {
  bg: 'bg-BG',
  ru: 'ru-RU',
  en: 'en-GB',
}

/** Remove markdown formatting symbols so TTS doesn't read them aloud, and for clean display. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/gs, '$1')          // **bold**
    .replace(/\*(.+?)\*/gs, '$1')               // *italic*
    .replace(/__(.+?)__/gs, '$1')               // __bold__
    .replace(/_(.+?)_/gs, '$1')                 // _italic_
    .replace(/#{1,6}\s*/g, '')                  // ## headings
    .replace(/`([^`]+)`/g, '$1')               // `code`
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // [link](url)
    .replace(/[*_#`~>]/g, '')                   // any remaining symbols
    .replace(/\s{2,}/g, ' ')                    // collapse extra spaces
    .trim()
}

function pickVoice(lang: Language): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  const code = LANG_CODE[lang]
  const prefix = code.split('-')[0]

  // Collect all voices matching this language (exact first, then prefix)
  const exact   = voices.filter(v => v.lang === code)
  const prefixed = voices.filter(v => v.lang.startsWith(prefix) && v.lang !== code)
  const pool     = [...exact, ...prefixed]

  if (lang === 'en') {
    // Prefer known female or explicitly female-named voices
    const female = pool.find(v =>
      /female|woman|girl/i.test(v.name) ||
      /\b(samantha|victoria|karen|moira|tessa|fiona|serena|alice|kate|amy|emma|joanna)\b/i.test(v.name)
    )
    if (female) return female
  }

  if (lang === 'bg') {
    // Chrome on some OSes reports Bulgarian as 'bg' only — accept both
    const bgVoice = voices.find(v => v.lang === 'bg-BG' || v.lang === 'bg')
    if (bgVoice) return bgVoice
  }

  return pool[0] ?? null
}

export function speak(text: string, lang: Language, onEnd?: () => void) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const cleanText = stripMarkdown(text)

  function doSpeak() {
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = LANG_CODE[lang]
    utterance.rate = 0.92
    utterance.pitch = 1.0
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice
    if (onEnd) utterance.onend = onEnd
    window.speechSynthesis.speak(utterance)
  }

  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    doSpeak()
  } else {
    // Voices not loaded yet — wait for the event then speak
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      doSpeak()
    }
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export function isSpeaking() {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

// ── Speech-to-Text (STT) ──────────────────────────────────────────────────────

type SpeechRecognitionConstructor = new () => SpeechRecognition

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition ??
    null
  )
}

export const sttAvailable = typeof window !== 'undefined' && !!(
  (window as unknown as Record<string, unknown>).SpeechRecognition ??
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition
)

export interface STTHandle {
  stop: () => void
}

export function startSTT(
  lang: Language,
  onTranscript: (text: string) => void,
  onEnd: () => void,
  onError?: (err: string) => void,
): STTHandle | null {
  const Cls = getSpeechRecognitionClass()
  if (!Cls) return null

  const rec = new Cls()
  rec.lang = LANG_CODE[lang]
  rec.continuous = false
  rec.interimResults = false

  rec.onresult = (e: SpeechRecognitionEvent) => {
    let transcript = ''
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript
    }
    onTranscript(transcript.trim())
  }

  rec.onerror = (e: SpeechRecognitionErrorEvent) => {
    onError?.(e.error)
    onEnd()
  }

  rec.onend = onEnd

  try {
    rec.start()
  } catch {
    return null
  }

  return { stop: () => rec.stop() }
}
