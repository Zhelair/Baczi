import type { Language } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Palace = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
export type Gate  = 'rest' | 'death' | 'injury' | 'du' | 'scenery' | 'open' | 'fear' | 'life'
export type Star  = 'tianpeng' | 'tianrui' | 'tianchong' | 'tianfu' | 'tianqin' | 'tianxin' | 'tianZhu' | 'tianren' | 'tianying'
export type Deity = 'zhifu' | 'tengche' | 'taiyin' | 'liuhe' | 'baihu' | 'xuanwu' | 'jiudi' | 'jiutian'
export type Polarity = 'yang' | 'yin'

export interface PalaceData {
  palace:  Palace
  stem:    string   // heavenly stem in this palace
  gate:    Gate
  star:    Star
  deity:   Deity
  isOpen:  boolean  // gate = open (吉)
  isDu:    boolean  // gate = du (吉)
}

export interface QmdjChart {
  ju:       number        // 1-9
  polarity: Polarity      // yang (阳遁) / yin (阴遁)
  palaces:  PalaceData[]  // 9 palaces
  date:     Date
}

// ─── Lo Shu palace → direction ───────────────────────────────────────────────

export type PalaceDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'CENTER'

export const PALACE_DIR: Record<Palace, PalaceDir> = {
  1: 'N', 2: 'SW', 3: 'E', 4: 'SE',
  5: 'CENTER', 6: 'NW', 7: 'W', 8: 'NE', 9: 'S',
}

// ─── Base assignments (Ju 1 Yang) ─────────────────────────────────────────────
// In Ju 1 Yang遁, the reference arrangement is:
// Gate 休(rest) at palace 1, 伤(injury) at 3, 杜(du) at 4,
// 景(scenery) at 9, 死(death) at 2, 惊(fear) at 7, 开(open) at 6, 生(life) at 8
// (宫5 = center, no gate, rotates through)

// Base gate positions (palace for each gate when Ju=1 Yang)
const BASE_GATE: Record<Gate, Palace> = {
  rest:    1,
  injury:  3,
  du:      4,
  scenery: 9,
  death:   2,
  fear:    7,
  open:    6,
  life:    8,
}

// Base star positions (Ju 1 Yang)
const BASE_STAR: Record<Star, Palace> = {
  tianpeng:  1,
  tianrui:   2,
  tianchong: 3,
  tianfu:    4,
  tianqin:   9,  // 天禽 stays center / follows 5
  tianxin:   6,
  tianZhu:   7,
  tianren:   8,
  tianying:  9,
}

// Base deity positions (Ju 1 Yang)
const BASE_DEITY: Record<Deity, Palace> = {
  zhifu:   1,
  tengche: 2,
  taiyin:  3,
  liuhe:   4,
  baihu:   6,
  xuanwu:  7,
  jiudi:   8,
  jiutian: 9,
}

// Base stems (Ju 1 Yang) — 10 stems cycle across 8 palaces + center (戊 is always center)
// Palaces 1-9, 戊 occupies palace 5 (center)
const BASE_STEM: Record<Palace, string> = {
  1: '壬', 2: '癸', 3: '庚', 4: '辛',
  5: '戊', 6: '乙', 7: '丙', 8: '丁', 9: '己',
}

// ─── Ju calculation ───────────────────────────────────────────────────────────
// Simplified approach: determine Yang/Yin cycle + Ju number from current jieqi period

// 24 Jieqi cycle — approximate dates (month, day) and their Yang/Yin + Ju
// Yang Dun (阳遁): Dongzhi (冬至, ~Dec 21) through Xiazhi (夏至, ~Jun 21)
// Yin Dun (阴遁): Xiazhi (夏至, ~Jun 21) through Dongzhi (冬至, ~Dec 21)
// Ju cycles 1→9 (Yang) or 9→1 (Yin) across the 24 jieqi

// Each Ju covers one jieqi period (~15 days)
// Reference table: (jieqi index 0=Dongzhi, +1 per jieqi)
// Yang: Dongzhi(1), Xiaohan(2), Dahan(3), Lichun(4), Yushui(5), Jingzhe(6),
//       Chunfen(7), Qingming(8), Guyu(9), Lixia(1), Xiaoman(2), Mangzhong(3)
//       [cycles 1-9 then 1-3 = 12 jieqi for half year]
// Yin:  Xiazhi(9), Xiaoshu(8), Dashu(7), Liqiu(6), Chushu(5), Bailu(4),
//       Qiufen(3), Hanlu(2), Shuangjiang(1), Lidong(9), Xiaoxue(8), Daxue(7)

// Jieqi approximate dates in the year (month 1-12, day)
const JIEQI: { month: number; day: number; yang: boolean; ju: number }[] = [
  { month: 12, day: 22, yang: true,  ju: 1 }, // 冬至 Dongzhi
  { month:  1, day:  6, yang: true,  ju: 2 }, // 小寒 Xiaohan
  { month:  1, day: 20, yang: true,  ju: 3 }, // 大寒 Dahan
  { month:  2, day:  4, yang: true,  ju: 4 }, // 立春 Lichun
  { month:  2, day: 19, yang: true,  ju: 5 }, // 雨水 Yushui
  { month:  3, day:  6, yang: true,  ju: 6 }, // 惊蛰 Jingzhe
  { month:  3, day: 21, yang: true,  ju: 7 }, // 春分 Chunfen
  { month:  4, day:  5, yang: true,  ju: 8 }, // 清明 Qingming
  { month:  4, day: 20, yang: true,  ju: 9 }, // 谷雨 Guyu
  { month:  5, day:  6, yang: true,  ju: 1 }, // 立夏 Lixia
  { month:  5, day: 21, yang: true,  ju: 2 }, // 小满 Xiaoman
  { month:  6, day:  6, yang: true,  ju: 3 }, // 芒种 Mangzhong
  { month:  6, day: 21, yang: false, ju: 9 }, // 夏至 Xiazhi (Yin begins)
  { month:  7, day:  7, yang: false, ju: 8 }, // 小暑 Xiaoshu
  { month:  7, day: 23, yang: false, ju: 7 }, // 大暑 Dashu
  { month:  8, day:  7, yang: false, ju: 6 }, // 立秋 Liqiu
  { month:  8, day: 23, yang: false, ju: 5 }, // 处暑 Chushu
  { month:  9, day:  8, yang: false, ju: 4 }, // 白露 Bailu
  { month:  9, day: 23, yang: false, ju: 3 }, // 秋分 Qiufen
  { month: 10, day:  8, yang: false, ju: 2 }, // 寒露 Hanlu
  { month: 10, day: 23, yang: false, ju: 1 }, // 霜降 Shuangjiang
  { month: 11, day:  7, yang: false, ju: 9 }, // 立冬 Lidong
  { month: 11, day: 22, yang: false, ju: 8 }, // 小雪 Xiaoxue
  { month: 12, day:  7, yang: false, ju: 7 }, // 大雪 Daxue
]

export function getJu(date: Date): { ju: number; polarity: Polarity } {
  const month = date.getMonth() + 1
  const day   = date.getDate()

  // Find which jieqi period we're in
  // Convert to a comparable number
  const current = month * 100 + day

  // Find the most recent jieqi that has passed
  let best = JIEQI[JIEQI.length - 1]  // default to Daxue (Dec 7)
  for (const j of JIEQI) {
    const jDate = j.month * 100 + j.day
    if (jDate <= current && jDate >= best.month * 100 + best.day) {
      best = j
    }
  }

  return { ju: best.ju, polarity: best.yang ? 'yang' : 'yin' }
}

// ─── Palace rotation ──────────────────────────────────────────────────────────

function rotatePalace(base: Palace, ju: number, polarity: Polarity): Palace {
  // Yang: rotate forward (clockwise in Lo Shu order)
  // Yin:  rotate backward
  // Lo Shu stepping order: 1→2→3→4→5→6→7→8→9→1
  const offset = polarity === 'yang' ? (ju - 1) : -(ju - 1)
  return (((base - 1 + offset + 9 * 100) % 9) + 1) as Palace
}

// ─── Chart generation ─────────────────────────────────────────────────────────

export function generateQmdjChart(date: Date = new Date()): QmdjChart {
  const { ju, polarity } = getJu(date)

  const palaces: PalaceData[] = (Array.from({ length: 9 }, (_, i) => i + 1) as Palace[]).map(palace => {
    // Find which gate, star, deity, stem lands on this palace
    const gate  = (Object.keys(BASE_GATE)  as Gate[] ).find(g => rotatePalace(BASE_GATE[g],  ju, polarity) === palace)!
    const star  = (Object.keys(BASE_STAR)  as Star[] ).find(s => rotatePalace(BASE_STAR[s],  ju, polarity) === palace)!
    const deity = (Object.keys(BASE_DEITY) as Deity[]).find(d => rotatePalace(BASE_DEITY[d], ju, polarity) === palace)!
    const stemBase = BASE_STEM[palace] ?? '戊'

    return {
      palace,
      stem:   stemBase,
      gate:   gate  ?? 'rest',
      star:   star  ?? 'tianpeng',
      deity:  deity ?? 'zhifu',
      isOpen: gate === 'open',
      isDu:   gate === 'du',
    }
  })

  return { ju, polarity, palaces, date }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const GATE_INFO: Record<Gate, {
  chinese: string
  name: Record<Language, string>
  category: 'auspicious' | 'neutral' | 'inauspicious'
  meaning: Record<Language, string>
}> = {
  open:    { chinese: '开', name: { bg: 'Открита',   ru: 'Открытые', en: 'Open'    }, category: 'auspicious',   meaning: { bg: 'Начинания, бизнес, движение напред',           ru: 'Начинания, бизнес, движение вперёд',          en: 'New ventures, business, forward movement'     } },
  rest:    { chinese: '休', name: { bg: 'Почивка',   ru: 'Покой',    en: 'Rest'    }, category: 'auspicious',   meaning: { bg: 'Почивка, дипломация, водни дейности',          ru: 'Отдых, дипломатия, водные дела',              en: 'Rest, diplomacy, water-related activities'    } },
  life:    { chinese: '生', name: { bg: 'Живот',     ru: 'Жизнь',    en: 'Life'    }, category: 'auspicious',   meaning: { bg: 'Земеделие, отглеждане, нови проекти',          ru: 'Земледелие, взращивание, новые проекты',      en: 'Agriculture, nurturing, new growth projects'  } },
  du:      { chinese: '杜', name: { bg: 'Блокада',   ru: 'Блок',     en: 'Du'      }, category: 'neutral',      meaning: { bg: 'Укриване, защита, избягване на конфликти',    ru: 'Укрытие, защита, уклонение от конфликтов',   en: 'Hiding, defense, avoiding confrontation'      } },
  scenery: { chinese: '景', name: { bg: 'Пейзаж',   ru: 'Пейзаж',   en: 'Scenery' }, category: 'neutral',      meaning: { bg: 'Огнени дейности, публичност, краткотрайно',   ru: 'Огненные дела, публичность, кратковременное', en: 'Fire activities, publicity, short-term gains' } },
  fear:    { chinese: '惊', name: { bg: 'Страх',     ru: 'Страх',    en: 'Fear'    }, category: 'inauspicious', meaning: { bg: 'Изненади, обвинения, правни проблеми',         ru: 'Сюрпризы, обвинения, судебные проблемы',     en: 'Surprises, accusations, legal trouble'        } },
  death:   { chinese: '死', name: { bg: 'Смърт',     ru: 'Смерть',   en: 'Death'   }, category: 'inauspicious', meaning: { bg: 'Провал, болест, траур — избягвай важни дела', ru: 'Провал, болезнь, траур — избегай важных дел', en: 'Failure, illness, mourning — avoid major acts'} },
  injury:  { chinese: '伤', name: { bg: 'Наранява',  ru: 'Травма',   en: 'Injury'  }, category: 'inauspicious', meaning: { bg: 'Конфликти, наранявания, юридически спорове',   ru: 'Конфликты, травмы, судебные споры',          en: 'Conflicts, injuries, legal disputes'          } },
}

export const STAR_INFO_QMDJ: Record<Star, {
  chinese: string
  name: Record<Language, string>
  category: 'auspicious' | 'neutral' | 'inauspicious'
  meaning: Record<Language, string>
}> = {
  tianpeng:  { chinese: '天蓬', name: { bg: 'Тянпен',   ru: 'Тянь Пэн',  en: 'Tian Peng'  }, category: 'inauspicious', meaning: { bg: 'Вода, тъмнина, рискове',           ru: 'Вода, тьма, риски',               en: 'Water, darkness, risks'           } },
  tianrui:   { chinese: '天芮', name: { bg: 'Тянжуй',   ru: 'Тянь Жуй',  en: 'Tian Rui'   }, category: 'inauspicious', meaning: { bg: 'Болест, препятствия',              ru: 'Болезнь, препятствия',             en: 'Illness, obstacles'               } },
  tianchong: { chinese: '天冲', name: { bg: 'Тянчун',   ru: 'Тянь Чун',  en: 'Tian Chong' }, category: 'neutral',      meaning: { bg: 'Дърво, инициатива, движение',     ru: 'Дерево, инициатива, движение',     en: 'Wood, initiative, movement'       } },
  tianfu:    { chinese: '天辅', name: { bg: 'Тянфу',    ru: 'Тянь Фу',   en: 'Tian Fu'    }, category: 'auspicious',   meaning: { bg: 'Образование, подкрепа, мъдрост', ru: 'Образование, поддержка, мудрость', en: 'Education, support, wisdom'       } },
  tianqin:   { chinese: '天禽', name: { bg: 'Тянцин',   ru: 'Тянь Цинь', en: 'Tian Qin'   }, category: 'auspicious',   meaning: { bg: 'Централна земя, баланс',          ru: 'Центральная земля, баланс',        en: 'Central earth, balance'           } },
  tianxin:   { chinese: '天心', name: { bg: 'Тянсин',   ru: 'Тянь Синь', en: 'Tian Xin'   }, category: 'auspicious',   meaning: { bg: 'Метал, изцеление, прозрение',     ru: 'Металл, исцеление, прозрение',     en: 'Metal, healing, insight'          } },
  tianZhu:   { chinese: '天柱', name: { bg: 'Тянчжу',   ru: 'Тянь Чжу',  en: 'Tian Zhu'   }, category: 'inauspicious', meaning: { bg: 'Нарушения, разруха, конфликти',   ru: 'Нарушения, разруха, конфликты',    en: 'Disruption, destruction, conflict'} },
  tianren:   { chinese: '天任', name: { bg: 'Тянжен',   ru: 'Тянь Жэнь', en: 'Tian Ren'   }, category: 'auspicious',   meaning: { bg: 'Земя, стабилност, доверие',       ru: 'Земля, стабильность, доверие',     en: 'Earth, stability, trust'          } },
  tianying:  { chinese: '天英', name: { bg: 'Тяньин',   ru: 'Тянь Ин',   en: 'Tian Ying'  }, category: 'neutral',      meaning: { bg: 'Огън, слава, но краткотрайно',    ru: 'Огонь, слава, но краткосрочно',    en: 'Fire, fame, but short-lived'      } },
}

export const DEITY_INFO: Record<Deity, {
  chinese: string
  name: Record<Language, string>
  category: 'auspicious' | 'neutral' | 'inauspicious'
  meaning: Record<Language, string>
}> = {
  zhifu:   { chinese: '值符', name: { bg: 'Джъфу',     ru: 'Чжи Фу',    en: 'Zhi Fu'    }, category: 'auspicious',   meaning: { bg: 'Лидерство, авторитет, победа',    ru: 'Лидерство, авторитет, победа',    en: 'Leadership, authority, victory'   } },
  tengche: { chinese: '螣蛇', name: { bg: 'Тенгше',    ru: 'Тэн Шэ',    en: 'Teng She'  }, category: 'inauspicious', meaning: { bg: 'Лъжи, илюзии, измама',           ru: 'Ложь, иллюзии, обман',            en: 'Lies, illusions, deception'       } },
  taiyin:  { chinese: '太阴', name: { bg: 'Тайин',     ru: 'Тай Инь',   en: 'Tai Yin'   }, category: 'auspicious',   meaning: { bg: 'Тайни, скрита подкрепа, жени',   ru: 'Тайны, скрытая поддержка, женщины', en: 'Secrets, hidden support, women'  } },
  liuhe:   { chinese: '六合', name: { bg: 'Лиухе',     ru: 'Лю Хэ',     en: 'Liu He'    }, category: 'auspicious',   meaning: { bg: 'Партньорства, хармония, бизнес', ru: 'Партнёрства, гармония, бизнес',    en: 'Partnerships, harmony, business'  } },
  baihu:   { chinese: '白虎', name: { bg: 'Байху',     ru: 'Бай Ху',    en: 'Bai Hu'    }, category: 'inauspicious', meaning: { bg: 'Насилие, конфликти, наранявания', ru: 'Насилие, конфликты, травмы',       en: 'Violence, conflict, injuries'     } },
  xuanwu:  { chinese: '玄武', name: { bg: 'Сюануу',    ru: 'Сюань У',   en: 'Xuan Wu'   }, category: 'inauspicious', meaning: { bg: 'Кражба, измама, тайни врагове',   ru: 'Воровство, обман, тайные враги',   en: 'Theft, fraud, hidden enemies'     } },
  jiudi:   { chinese: '九地', name: { bg: 'Джюди',     ru: 'Цзю Ди',    en: 'Jiu Di'    }, category: 'neutral',      meaning: { bg: 'Скриване, укритие, земни дела',  ru: 'Скрытие, убежище, земные дела',   en: 'Hiding, shelter, earth matters'   } },
  jiutian: { chinese: '九天', name: { bg: 'Джютян',    ru: 'Цзю Тянь',  en: 'Jiu Tian'  }, category: 'auspicious',   meaning: { bg: 'Небесна помощ, бързо движение',  ru: 'Небесная помощь, быстрое движение', en: 'Heavenly aid, swift movement'    } },
}

export const GATE_COLORS: Record<'auspicious' | 'neutral' | 'inauspicious', { bg: string; border: string; text: string }> = {
  auspicious:   { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-300'  },
  neutral:      { bg: 'bg-zinc-800/40',   border: 'border-zinc-700/40',   text: 'text-zinc-300'   },
  inauspicious: { bg: 'bg-red-900/20',    border: 'border-red-800/40',    text: 'text-red-400'    },
}

export const POLARITY_LABEL: Record<Polarity, Record<Language, string>> = {
  yang: { bg: 'Ян Дун (阳遁)', ru: 'Ян Дунь (阳遁)', en: 'Yang Dun (阳遁)' },
  yin:  { bg: 'Ин Дун (阴遁)', ru: 'Инь Дунь (阴遁)', en: 'Yin Dun (阴遁)'  },
}
