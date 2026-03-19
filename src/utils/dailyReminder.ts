import { useEffect } from 'react'
import { loadReminderDate, saveReminderDate } from './storage'
import type { BaziChart } from '../engine/types'
import type { Language } from '../engine/types'

function buildSummary(chart: BaziChart, lang: Language): string {
  const dm = chart.dayMaster
  if (lang === 'bg') {
    return `☯ Твоят Господар на деня е ${dm.element} ${dm.polarity}. Отвори приложението за дневното четене.`
  }
  if (lang === 'ru') {
    return `☯ Твой Господин дня — ${dm.element} ${dm.polarity}. Открой приложение для ежедневного чтения.`
  }
  return `☯ Your Day Master is ${dm.element} ${dm.polarity}. Open the app for your daily reading.`
}

export function useDailyReminder(chart: BaziChart | null, lang: Language, hour = 10, minute = 30) {
  useEffect(() => {
    if (!chart || !('Notification' in window)) return

    // Request permission silently (doesn't show dialog if already denied)
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const chartSnapshot = chart
    const langSnapshot = lang

    const intervalId = setInterval(() => {
      if (Notification.permission !== 'granted') return

      const now = new Date()
      if (now.getHours() === hour && now.getMinutes() === minute) {
        const today = now.toISOString().split('T')[0]
        if (loadReminderDate() !== today) {
          saveReminderDate(today)
          new Notification('☯ BaZi', {
            body: buildSummary(chartSnapshot, langSnapshot),
            icon: '/favicon.ico',
          })
        }
      }
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [chart, lang, hour, minute])
}
