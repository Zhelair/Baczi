import type { Language, ElementKey } from './types'

// ─── Heavenly Stems (天干) ───────────────────────────────────────────────────
export const STEMS: Record<string, { elementKey: ElementKey; polarity: Record<Language, string>; element: Record<Language, string> }> = {
  '甲': { elementKey: 'wood',  polarity: { bg: 'Ян', ru: 'Ян', en: 'Yang' }, element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' } },
  '乙': { elementKey: 'wood',  polarity: { bg: 'Ин', ru: 'Инь', en: 'Yin'  }, element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' } },
  '丙': { elementKey: 'fire',  polarity: { bg: 'Ян', ru: 'Ян', en: 'Yang' }, element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire' } },
  '丁': { elementKey: 'fire',  polarity: { bg: 'Ин', ru: 'Инь', en: 'Yin'  }, element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire' } },
  '戊': { elementKey: 'earth', polarity: { bg: 'Ян', ru: 'Ян', en: 'Yang' }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'} },
  '己': { elementKey: 'earth', polarity: { bg: 'Ин', ru: 'Инь', en: 'Yin'  }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'} },
  '庚': { elementKey: 'metal', polarity: { bg: 'Ян', ru: 'Ян', en: 'Yang' }, element: { bg: 'Метал', ru: 'Металл', en: 'Metal'} },
  '辛': { elementKey: 'metal', polarity: { bg: 'Ин', ru: 'Инь', en: 'Yin'  }, element: { bg: 'Метал', ru: 'Металл', en: 'Metal'} },
  '壬': { elementKey: 'water', polarity: { bg: 'Ян', ru: 'Ян', en: 'Yang' }, element: { bg: 'Вода',  ru: 'Вода',   en: 'Water'} },
  '癸': { elementKey: 'water', polarity: { bg: 'Ин', ru: 'Инь', en: 'Yin'  }, element: { bg: 'Вода',  ru: 'Вода',   en: 'Water'} },
}

// ─── Earthly Branches (地支) ─────────────────────────────────────────────────
export const BRANCHES: Record<string, { elementKey: ElementKey; animal: Record<Language, string>; element: Record<Language, string>; hours: string }> = {
  '子': { elementKey: 'water', animal: { bg: 'Плъх',    ru: 'Крыса',   en: 'Rat'     }, element: { bg: 'Вода',  ru: 'Вода',   en: 'Water'}, hours: '23:00-01:00' },
  '丑': { elementKey: 'earth', animal: { bg: 'Вол',     ru: 'Бык',     en: 'Ox'      }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'}, hours: '01:00-03:00' },
  '寅': { elementKey: 'wood',  animal: { bg: 'Тигър',   ru: 'Тигр',    en: 'Tiger'   }, element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' }, hours: '03:00-05:00' },
  '卯': { elementKey: 'wood',  animal: { bg: 'Заек',    ru: 'Кролик',  en: 'Rabbit'  }, element: { bg: 'Дърво', ru: 'Дерево', en: 'Wood' }, hours: '05:00-07:00' },
  '辰': { elementKey: 'earth', animal: { bg: 'Дракон',  ru: 'Дракон',  en: 'Dragon'  }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'}, hours: '07:00-09:00' },
  '巳': { elementKey: 'fire',  animal: { bg: 'Змия',    ru: 'Змея',    en: 'Snake'   }, element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire' }, hours: '09:00-11:00' },
  '午': { elementKey: 'fire',  animal: { bg: 'Кон',     ru: 'Лошадь',  en: 'Horse'   }, element: { bg: 'Огън',  ru: 'Огонь',  en: 'Fire' }, hours: '11:00-13:00' },
  '未': { elementKey: 'earth', animal: { bg: 'Коза',    ru: 'Коза',    en: 'Goat'    }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'}, hours: '13:00-15:00' },
  '申': { elementKey: 'metal', animal: { bg: 'Маймуна', ru: 'Обезьяна',en: 'Monkey'  }, element: { bg: 'Метал', ru: 'Металл', en: 'Metal'}, hours: '15:00-17:00' },
  '酉': { elementKey: 'metal', animal: { bg: 'Петел',   ru: 'Петух',   en: 'Rooster' }, element: { bg: 'Метал', ru: 'Металл', en: 'Metal'}, hours: '17:00-19:00' },
  '戌': { elementKey: 'earth', animal: { bg: 'Куче',    ru: 'Собака',  en: 'Dog'     }, element: { bg: 'Земя',  ru: 'Земля',  en: 'Earth'}, hours: '19:00-21:00' },
  '亥': { elementKey: 'water', animal: { bg: 'Прасе',   ru: 'Свинья',  en: 'Pig'     }, element: { bg: 'Вода',  ru: 'Вода',   en: 'Water'}, hours: '21:00-23:00' },
}

// ─── Hidden stems (地支藏干) — classical assignments ─────────────────────────
export const HIDDEN_STEMS: Record<string, string[]> = {
  '子': ['癸'],
  '丑': ['己', '癸', '辛'],
  '寅': ['甲', '丙', '戊'],
  '卯': ['乙'],
  '辰': ['戊', '乙', '癸'],
  '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'],
  '未': ['己', '丁', '乙'],
  '申': ['庚', '壬', '戊'],
  '酉': ['辛'],
  '戌': ['戊', '辛', '丁'],
  '亥': ['壬', '甲'],
}

// ─── UI strings ───────────────────────────────────────────────────────────────
export const UI: Record<string, Record<Language, string>> = {
  // Screens
  today:           { bg: 'Днес',        ru: 'Сегодня',   en: 'Today'       },
  chart:           { bg: 'Картата',     ru: 'Карта',     en: 'Chart'       },
  lucky:           { bg: 'Дни на удача',ru: 'Удача',     en: 'Lucky Dates' },
  settings:        { bg: 'Настройки',   ru: 'Настройки', en: 'Settings'    },
  ask:             { bg: 'Попитай',     ru: 'Спроси',    en: 'Ask'         },
  admin:           { bg: 'Админ',       ru: 'Админ',     en: 'Admin'       },
  activations:     { bg: 'Активации',   ru: 'Активации', en: 'Activations' },
  fengshui:        { bg: 'Фън Шуй',     ru: 'Фэн Шуй',   en: 'Feng Shui'   },
  qmdj:            { bg: 'КМДЖ',        ru: 'ЦМДЦ',       en: 'QMDJ'        },
  // Auth
  passphraseTitle: { bg: '🔮 Въведи паролата', ru: '🔮 Введи пароль', en: '🔮 Enter Passphrase' },
  passphraseHint:  { bg: 'Паролата ти е получена при покупка', ru: 'Пароль получен при покупке', en: 'Your passphrase was provided upon purchase' },
  passphraseLabel: { bg: 'Парола',       ru: 'Пароль',    en: 'Passphrase'  },
  enter:           { bg: 'Влез',         ru: 'Войти',     en: 'Enter'       },
  // Setup
  setupTitle:      { bg: '✨ Твоята БаЦзи карта', ru: '✨ Твоя Ба-Цзы карта', en: '✨ Your BaZi Chart' },
  yourName:        { bg: 'Твоето иvme',  ru: 'Ваше имя',  en: 'Your name'   },
  birthDate:       { bg: 'Дата на раждане (ДД.ММ.ГГГГ)', ru: 'Дата рождения (ДД.ММ.ГГГГ)', en: 'Birth date (DD.MM.YYYY)' },
  birthTime:       { bg: 'Час на раждане (ЧЧ:ММ) — незадължително', ru: 'Время рождения (ЧЧ:ММ) — необязательно', en: 'Birth time (HH:MM) — optional' },
  male:            { bg: 'Мъж',          ru: 'Мужчина',   en: 'Male'        },
  female:          { bg: 'Жена',         ru: 'Женщина',   en: 'Female'      },
  gender:          { bg: 'Пол',          ru: 'Пол',       en: 'Gender'      },
  calculate:       { bg: '🔮 Изчисли картата', ru: '🔮 Рассчитать карту', en: '🔮 Calculate Chart' },
  // Pillars
  yearPillar:      { bg: 'Година',       ru: 'Год',       en: 'Year'        },
  monthPillar:     { bg: 'Месец',        ru: 'Месяц',     en: 'Month'       },
  dayPillar:       { bg: 'Ден',          ru: 'День',      en: 'Day'         },
  hourPillar:      { bg: 'Час',          ru: 'Час',       en: 'Hour'        },
  unknownHour:     { bg: 'Неизвестен',   ru: 'Неизвестно',en: 'Unknown'     },
  dayMaster:       { bg: 'Господар на деня', ru: 'Хозяин дня', en: 'Day Master' },
  zodiac:          { bg: 'Зодия',        ru: 'Зодиак',    en: 'Zodiac'      },
  luckCycles:      { bg: 'Цикли на удача', ru: 'Циклы удачи', en: 'Luck Cycles' },
  // Life areas
  finance:         { bg: 'Финанси',      ru: 'Финансы',   en: 'Finance'     },
  work:            { bg: 'Работа',       ru: 'Работа',    en: 'Work'        },
  love:            { bg: 'Любов',        ru: 'Любовь',    en: 'Love'        },
  health:          { bg: 'Здраве',       ru: 'Здоровье',  en: 'Health'      },
  travel:          { bg: 'Пътувания',    ru: 'Путешествия',en: 'Travel'     },
  creativity:      { bg: 'Творчество',   ru: 'Творчество',en: 'Creativity'  },
  home:            { bg: 'Дом',          ru: 'Дом',       en: 'Home'        },
  legal:           { bg: 'Договори',     ru: 'Договоры',  en: 'Legal'       },
  // Today screen
  todayEnergy:     { bg: 'Енергията на деня', ru: 'Энергия дня', en: "Today's Energy" },
  yourReading:     { bg: 'Личното ти четене', ru: 'Ваше чтение', en: 'Your Reading'   },
  luckyHours:      { bg: 'Щастливи часове', ru: 'Удачные часы', en: 'Lucky Hours'     },
  getReading:      { bg: '🔮 Вземи дневното четене (50 жетона)', ru: '🔮 Получить дневное чтение (50 жетонов)', en: '🔮 Get Daily Reading (50 tokens)' },
  quickLuck:       { bg: '⚡ Бърза проверка (20 жетона)', ru: '⚡ Быстрая проверка (20 жетонов)', en: '⚡ Quick Luck Check (20 tokens)' },
  loading:         { bg: 'Зареждане...', ru: 'Загрузка...', en: 'Loading...' },
  // Tokens
  tokens:          { bg: 'жетони',       ru: 'жетонов',   en: 'tokens'      },
  tokensLeft:      { bg: 'Оставащи жетони', ru: 'Оставшиеся жетоны', en: 'Tokens remaining' },
  resetsOn:        { bg: 'Нулира се на', ru: 'Сброс',      en: 'Resets on'   },
  // Errors
  errorInvalid:    { bg: 'Невалидна парола', ru: 'Неверный пароль', en: 'Invalid passphrase' },
  errorTokens:     { bg: 'Жетоните свършиха. Нулира се на 1-ви.', ru: 'Жетоны закончились. Сброс 1-го числа.', en: 'Out of tokens. Resets on the 1st.' },
  errorGeneral:    { bg: 'Нещо се обърка. Опитай пак.', ru: 'Что-то пошло не так. Попробуйте снова.', en: 'Something went wrong. Try again.' },
  // Settings
  editProfile:     { bg: 'Редактирай профил', ru: 'Редактировать профиль', en: 'Edit Profile' },
  language:        { bg: 'Език',         ru: 'Язык',      en: 'Language'    },
  clearData:       { bg: 'Изчисти всички данни', ru: 'Очистить все данные', en: 'Clear All Data' },
  clearConfirm:    { bg: 'Сигурен ли си? Всички данни ще бъдат изтрити.', ru: 'Уверены? Все данные будут удалены.', en: 'Are you sure? All data will be deleted.' },
  tier:            { bg: 'Ниво',         ru: 'Уровень',   en: 'Tier'        },
  free:            { bg: 'Безплатен',    ru: 'Бесплатный',en: 'Free'        },
  pro:             { bg: 'Про',          ru: 'Про',       en: 'Pro'         },
  max:             { bg: 'Макс',         ru: 'Макс',      en: 'Max'         },
  // Navigation
  learn:           { bg: 'Обучение',    ru: 'Обучение',   en: 'Learn'       },
  // Learning screen
  learnTitle:      { bg: 'Обучение',    ru: 'Обучение',   en: 'Learning'    },
  learnTopics:     { bg: 'теми',        ru: 'тем',        en: 'topics'      },
  learnNotes:      { bg: 'Бележки',     ru: 'Заметки',    en: 'Notes'       },
  learnAll:        { bg: 'Всички',      ru: 'Все',        en: 'All'         },
  learnInProgress: { bg: 'В процес',    ru: 'В процессе', en: 'In Progress' },
  learnNotStarted: { bg: 'Не започнати',ru: 'Не начато',  en: 'Not Started' },
  learnCompleted:  { bg: 'Завършени',   ru: 'Завершено',  en: 'Completed'   },
  learnStudy:      { bg: 'Учи',         ru: 'Учиться',    en: 'Study'       },
  learnQuiz:       { bg: 'Тест',        ru: 'Тест',       en: 'Quiz'        },
  learnMarkDone:   { bg: 'Маркирай',    ru: 'Отметить',   en: 'Mark Done'   },
  learnNote:       { bg: 'бележка',     ru: 'заметка',    en: 'note'        },
  learnNoteP:      { bg: 'бележки',     ru: 'заметки',    en: 'notes'       },
  learnNoNotes:    { bg: 'Няма бележки', ru: 'Нет заметок', en: 'No notes yet' },
  learnAddNote:    { bg: '+ Добави бележка', ru: '+ Добавить заметку', en: '+ Add Note' },
  learnBackToTopics: { bg: '← Обучение', ru: '← Обучение', en: '← Learning' },
  // Save to Notes (in AskBazi)
  saveToNotes:     { bg: 'Запази в бележките', ru: 'Сохранить в заметки', en: 'Save to Notes' },
  saveNoteTitle:   { bg: 'Запази бележка',     ru: 'Сохранить заметку',   en: 'Save Note'     },
  saveNoteTopic:   { bg: 'Тема',               ru: 'Тема',                en: 'Topic'         },
  saveNoteContent: { bg: 'Съдържание',          ru: 'Содержание',          en: 'Content'       },
  saveNoteGeneral: { bg: 'Общо (без тема)',     ru: 'Общее (без темы)',     en: 'General (no topic)' },
  noteSaved:       { bg: 'Бележката е запазена!', ru: 'Заметка сохранена!', en: 'Note saved!'  },
  // Locked feature screen
  lockedProOnly:   { bg: 'Про и Макс функция', ru: 'Функция Про и Макс', en: 'Pro & Max Feature' },
  lockedSubtitle:  { bg: 'Достъпно за абонати на Про и Макс', ru: 'Доступно для подписчиков Про и Макс', en: 'Available for Pro and Max subscribers' },
  lockedCta:       { bg: 'Въведи своята Про парола', ru: 'Введите пароль Pro', en: 'Enter your Pro passphrase' },
  lockedPassLabel: { bg: 'Парола за Про/Макс', ru: 'Пароль Про/Макс', en: 'Pro/Max Passphrase' },
  lockedActivationsTitle: { bg: 'Активации', ru: 'Активации', en: 'Activations' },
  lockedActivationsDesc:  {
    bg: 'Виж как годишните, месечните и цикличните енергии взаимодействат с твоята натална карта. Открий сблъсъци, комбинации и хармонии — и как да използваш тези сили в своя полза.',
    ru: 'Узнайте, как годовые, месячные и цикличные энергии взаимодействуют с вашей натальной картой. Откройте столкновения, комбинации и гармонии — и как использовать эти силы в своих интересах.',
    en: 'See how annual, monthly, and luck-cycle energies interact with your natal chart. Discover clashes, combinations, and harmonies — and how to use these forces to your advantage.'
  },
  lockedFengshuiTitle: { bg: 'Фън Шуй', ru: 'Фэн Шуй', en: 'Feng Shui' },
  lockedFengshuiDesc:  {
    bg: 'Открий личния си Куа компас и Летящите звезди. Намери оптималните посоки за богатство, здраве и взаимоотношения — персонализирано за твоята карта и жилище.',
    ru: 'Откройте личный компас Куа и Летящие звёзды. Найдите оптимальные направления для богатства, здоровья и отношений — персонально для вашей карты и жилища.',
    en: 'Unlock your personal Kua compass and Flying Stars analysis. Find optimal directions for wealth, health, and relationships — personalised for your chart and home.'
  },
  lockedQmdjTitle: { bg: 'Ци Мън Дун Цзя', ru: 'Ци Мэнь Дунь Цзя', en: 'Qi Men Dun Jia' },
  lockedQmdjDesc:  {
    bg: 'Древната китайска стратегическа система за намиране на най-доброто време и посока за важни действия. Включва 9 дворци, 8 врати, звезди и божества — всичко в реално време.',
    ru: 'Древняя китайская стратегическая система для поиска лучшего времени и направления для важных действий. Включает 9 дворцов, 8 врат, звёзды и божества — всё в реальном времени.',
    en: 'The ancient Chinese strategic planning system for finding the best timing and direction for important actions. Includes 9 palaces, 8 gates, stars and deities — all in real time.'
  },
}

// ─── Life area emojis ─────────────────────────────────────────────────────────
export const LIFE_AREA_EMOJIS: Record<string, string> = {
  finance:    '💰',
  work:       '💼',
  love:       '❤️',
  health:     '🌿',
  travel:     '✈️',
  creativity: '🎨',
  home:       '🏠',
  legal:      '📝',
}

export function t(key: string, lang: Language): string {
  return UI[key]?.[lang] ?? UI[key]?.['en'] ?? key
}

export function stemLabel(gan: string, lang: Language): { element: string; polarity: string; elementKey: ElementKey } {
  const s = STEMS[gan]
  if (!s) return { element: gan, polarity: '', elementKey: 'earth' }
  return { element: s.element[lang], polarity: s.polarity[lang], elementKey: s.elementKey }
}

export function branchLabel(zhi: string, lang: Language): { animal: string; element: string; elementKey: ElementKey } {
  const b = BRANCHES[zhi]
  if (!b) return { animal: zhi, element: '', elementKey: 'earth' }
  return { animal: b.animal[lang], element: b.element[lang], elementKey: b.elementKey }
}
