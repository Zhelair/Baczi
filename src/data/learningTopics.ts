import type { Language } from '../engine/types'

export type TopicCategory = 'basics' | 'bazi' | 'fengshui' | 'qmdj'

export interface LearningTopic {
  id: string
  category: TopicCategory
  title: Record<Language, string>
  description: Record<Language, string>
  studyPrompt: Record<Language, string>
  quizPrompt: Record<Language, string>
}

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: 'what-is-bazi',
    category: 'basics',
    title: {
      bg: 'Какво е БаЦзъ?',
      ru: 'Что такое Ба-Цзы?',
      en: 'What is BaZi?',
    },
    description: {
      bg: 'Основи на китайската астрология — четирите стълба на съдбата и тяхното значение.',
      ru: 'Основы китайской астрологии — четыре столпа судьбы и их значение.',
      en: 'Foundations of Chinese astrology — the four pillars of destiny and their meaning.',
    },
    studyPrompt: {
      bg: 'Обясни ми какво е БаЦзъ. Започни от самото начало — какво представлява системата, откъде идва и как работи като цяло. Говори просто и ясно.',
      ru: 'Объясни мне, что такое Ба-Цзы. Начни с самого начала — что это за система, откуда она пришла и как работает в целом. Говори просто и понятно.',
      en: 'Explain what BaZi is. Start from the very beginning — what the system is, where it comes from, and how it works as a whole. Speak simply and clearly.',
    },
    quizPrompt: {
      bg: 'Проверете знанията ми за основите на БаЦзъ. Задавай ми въпроси един по един, изчаквай отговора ми, после коментирай и задавай следващия.',
      ru: 'Проверь мои знания об основах Ба-Цзы. Задавай мне вопросы один за другим, жди моего ответа, затем комментируй и задавай следующий.',
      en: 'Quiz me on the basics of BaZi. Ask questions one at a time, wait for my answer, then comment and ask the next one.',
    },
  },
  {
    id: 'five-elements',
    category: 'basics',
    title: {
      bg: 'Петте елемента',
      ru: 'Пять элементов',
      en: 'The Five Elements',
    },
    description: {
      bg: 'Дърво, Огън, Земя, Метал, Вода — как взаимодействат и какво означават.',
      ru: 'Дерево, Огонь, Земля, Металл, Вода — как они взаимодействуют и что означают.',
      en: 'Wood, Fire, Earth, Metal, Water — how they interact and what they mean.',
    },
    studyPrompt: {
      bg: 'Научи ме за петте елемента в БаЦзъ — Дърво, Огън, Земя, Метал, Вода. Как се пораждат, как се контролират и как се прилагат в картата?',
      ru: 'Научи меня о пяти элементах в Ба-Цзы — Дерево, Огонь, Земля, Металл, Вода. Как они порождают и контролируют друг друга, как применяются в карте?',
      en: 'Teach me about the five elements in BaZi — Wood, Fire, Earth, Metal, Water. How do they generate and control each other, and how are they applied in the chart?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за петте елемента. Задавай въпроси за цикъла на пораждане, контрол и значението на всеки елемент.',
      ru: 'Проверь мои знания о пяти элементах. Задавай вопросы о цикле порождения, контроля и значении каждого элемента.',
      en: 'Quiz me on the five elements. Ask about the generation cycle, control cycle, and the meaning of each element.',
    },
  },
  {
    id: 'day-master',
    category: 'bazi',
    title: {
      bg: 'Господарят на деня',
      ru: 'Хозяин дня',
      en: 'The Day Master',
    },
    description: {
      bg: 'Денният стем е твоята основна енергия — сърцето на цялата карта.',
      ru: 'Дневной стебель — это ваша основная энергия и сердце всей карты.',
      en: 'The day stem is your core energy — the heart of the entire chart.',
    },
    studyPrompt: {
      bg: 'Обясни ми за Господаря на деня в моята карта. Какво означава моят денен стем, каква е неговата природа и как влияе на целия ми живот?',
      ru: 'Объясни мне о Хозяине дня в моей карте. Что означает мой дневной стебель, какова его природа и как он влияет на всю мою жизнь?',
      en: 'Explain the Day Master in my chart. What does my day stem mean, what is its nature, and how does it shape my whole life?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за Господаря на деня — значение, сила, слабост и как взаимодейства с другите елементи в картата.',
      ru: 'Проверь мои знания о Хозяине дня — значение, сила, слабость и взаимодействие с другими элементами карты.',
      en: 'Quiz me on the Day Master — its meaning, strength, weakness, and how it interacts with other elements in the chart.',
    },
  },
  {
    id: 'heavenly-stems',
    category: 'bazi',
    title: {
      bg: 'Небесните стебла (天干)',
      ru: 'Небесные стволы (天干)',
      en: 'Heavenly Stems (天干)',
    },
    description: {
      bg: 'Десетте небесни стебла — тяхната природа, елемент и полярност.',
      ru: 'Десять небесных стволов — их природа, элемент и полярность.',
      en: 'The ten heavenly stems — their nature, element, and polarity.',
    },
    studyPrompt: {
      bg: 'Научи ме за десетте Небесни стебла (天干) — Цзя, И, Бин, Дин, У, Дзи, Гън, Синь, Жен, Куей. Разкажи за природата на всяко, елемента и полярността.',
      ru: 'Расскажи мне о десяти Небесных стволах (天干) — Цзя, И, Бин, Дин, У, Цзи, Гэн, Синь, Жэнь, Гуй. Расскажи о природе каждого, элементе и полярности.',
      en: 'Teach me about the ten Heavenly Stems (天干) — Jiǎ, Yǐ, Bǐng, Dīng, Wù, Jǐ, Gēng, Xīn, Rén, Guǐ. Tell me about each one\'s nature, element, and polarity.',
    },
    quizPrompt: {
      bg: 'Изпитай ме за Небесните стебла — кой елемент е кое стебло, полярност, и природата на всяко.',
      ru: 'Проверь мои знания о Небесных стволах — какой элемент соответствует каждому стволу, полярность и природа.',
      en: 'Quiz me on the Heavenly Stems — which element is which stem, polarity, and the nature of each.',
    },
  },
  {
    id: 'earthly-branches',
    category: 'bazi',
    title: {
      bg: 'Земните клони (地支)',
      ru: 'Земные ветви (地支)',
      en: 'Earthly Branches (地支)',
    },
    description: {
      bg: '12-те животни и техните елементи, скрити стебла и взаимодействия.',
      ru: '12 животных, их элементы, скрытые стебли и взаимодействия.',
      en: 'The 12 animals, their elements, hidden stems, and interactions.',
    },
    studyPrompt: {
      bg: 'Обясни ми Земните клони (地支) — 12-те животни. Включи елементите им, скритите стебла (藏干) и основните взаимодействия (сблъсъци, комбинации, хармонии).',
      ru: 'Объясни мне Земные ветви (地支) — 12 животных. Включи их элементы, скрытые стебли (藏干) и основные взаимодействия (столкновения, комбинации, гармонии).',
      en: 'Explain the Earthly Branches (地支) — the 12 animals. Include their elements, hidden stems (藏干), and the main interactions (clashes, combinations, harmonies).',
    },
    quizPrompt: {
      bg: 'Изпитай ме за Земните клони — животни, елементи, скрити стебла и взаимодействия между клоните.',
      ru: 'Проверь мои знания о Земных ветвях — животные, элементы, скрытые стебли и взаимодействия.',
      en: 'Quiz me on the Earthly Branches — animals, elements, hidden stems, and interactions between branches.',
    },
  },
  {
    id: 'luck-cycles',
    category: 'bazi',
    title: {
      bg: 'Цикли на удача (大运)',
      ru: 'Циклы удачи (大运)',
      en: 'Luck Cycles (大运)',
    },
    description: {
      bg: '10-годишните цикли на съдбата — как ги четем и как влияят на живота.',
      ru: '10-летние циклы судьбы — как их читать и как они влияют на жизнь.',
      en: '10-year destiny cycles — how to read them and how they shape life.',
    },
    studyPrompt: {
      bg: 'Научи ме за 10-годишните цикли на удача (大运) в БаЦзъ. Как се изчисляват, как се четат и как взаимодействат с натал ната карта?',
      ru: 'Расскажи мне о 10-летних циклах удачи (大运) в Ба-Цзы. Как они рассчитываются, как их читать и как они взаимодействуют с натальной картой?',
      en: 'Teach me about the 10-year luck cycles (大运) in BaZi. How are they calculated, how to read them, and how do they interact with the natal chart?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за 10-годишните цикли на удача — изчисление, четене, и влияние върху картата.',
      ru: 'Проверь мои знания о 10-летних циклах удачи — расчёт, чтение и влияние на карту.',
      en: 'Quiz me on luck cycles — calculation, reading, and influence on the natal chart.',
    },
  },
  {
    id: 'activations',
    category: 'bazi',
    title: {
      bg: 'Четене на активациите',
      ru: 'Чтение активаций',
      en: 'Reading Activations',
    },
    description: {
      bg: 'Как годишните и месечните енергии взаимодействат с твоята карта.',
      ru: 'Как годовые и месячные энергии взаимодействуют с вашей картой.',
      en: 'How annual and monthly energies interact with your chart.',
    },
    studyPrompt: {
      bg: 'Обясни ми как да четa активациите в БаЦзъ — сблъсъци (六冲), комбинации (六合), хармонии (三合) между годишните/месечните стебла и клони и натал ната карта.',
      ru: 'Объясни мне, как читать активации в Ба-Цзы — столкновения (六冲), комбинации (六合), гармонии (三合) между годовыми/месячными стеблями и ветвями и натальной картой.',
      en: 'Explain how to read activations in BaZi — clashes (六冲), combinations (六合), harmonies (三合) between annual/monthly stems and branches and the natal chart.',
    },
    quizPrompt: {
      bg: 'Изпитай ме за активациите — видове взаимодействия, тяхното значение и как да ги прилагам в картата.',
      ru: 'Проверь мои знания об активациях — виды взаимодействий, их значение и как применять в карте.',
      en: 'Quiz me on activations — types of interactions, their meaning, and how to apply them in the chart.',
    },
  },
  {
    id: 'fengshui-kua',
    category: 'fengshui',
    title: {
      bg: 'Фън Шуй и числото Куа',
      ru: 'Фэн Шуй и число Куа',
      en: 'Feng Shui & Kua Number',
    },
    description: {
      bg: 'Личното число Куа, осемте посоки и как да използваш благоприятните.',
      ru: 'Личное число Куа, восемь направлений и как использовать благоприятные.',
      en: 'Your personal Kua number, the eight directions, and how to use the auspicious ones.',
    },
    studyPrompt: {
      bg: 'Обясни ми Фън Шуй и числото Куа. Как се изчислява моето число Куа, какво означават четирите благоприятни и четирите неблагоприятни посоки?',
      ru: 'Объясни мне Фэн Шуй и число Куа. Как рассчитывается моё число Куа, что означают четыре благоприятных и четыре неблагоприятных направления?',
      en: 'Explain Feng Shui and the Kua number. How is my Kua number calculated, and what do the four auspicious and four inauspicious directions mean?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за Фън Шуй и числото Куа — изчисление, посоки, значение на Шен Ци, Тиен И, Ян Нян и Фу Уей.',
      ru: 'Проверь мои знания о Фэн Шуй и числе Куа — расчёт, направления, значение Шэн Ци, Тянь И, Янь Нянь и Фу Вэй.',
      en: 'Quiz me on Feng Shui and the Kua number — calculation, directions, meaning of Sheng Qi, Tian Yi, Yan Nian, and Fu Wei.',
    },
  },
  {
    id: 'flying-stars',
    category: 'fengshui',
    title: {
      bg: 'Летящите звезди (玄空飛星)',
      ru: 'Летящие звёзды (玄空飛星)',
      en: 'Flying Stars (玄空飛星)',
    },
    description: {
      bg: 'Ксуан Конг Фей Синг — как звездите влияят на пространството и времето.',
      ru: 'Сюань Кун Фэй Синь — как звёзды влияют на пространство и время.',
      en: 'Xuan Kong Fei Xing — how stars influence space and time.',
    },
    studyPrompt: {
      bg: 'Научи ме за Летящите звезди (玄空飛星) във Фън Шуй. Какво са 9-те звезди, как летят всяка година и как влияят на различните сектори на дома?',
      ru: 'Расскажи мне о Летящих звёздах (玄空飛星) в Фэн Шуй. Что такое 9 звёзд, как они летят каждый год и как влияют на разные секторы дома?',
      en: 'Teach me about Flying Stars (玄空飛星) in Feng Shui. What are the 9 stars, how do they fly each year, and how do they affect different sectors of the home?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за Летящите звезди — деветте звезди, тяхното значение, благоприятни и неблагоприятни.',
      ru: 'Проверь мои знания о Летящих звёздах — девять звёзд, их значение, благоприятные и неблагоприятные.',
      en: 'Quiz me on Flying Stars — the nine stars, their meaning, auspicious and inauspicious.',
    },
  },
  {
    id: 'qmdj-intro',
    category: 'qmdj',
    title: {
      bg: 'Въведение в КМДЖ',
      ru: 'Введение в ЦМДЦ',
      en: 'QMDJ Introduction',
    },
    description: {
      bg: 'Ци Мън Дун Цзя — 9-те дворци, 8-те врати, звездите и как се прилагат.',
      ru: 'Ци Мэнь Дунь Цзя — 9 дворцов, 8 врат, звёзды и их применение.',
      en: 'Qi Men Dun Jia — 9 palaces, 8 gates, stars, and how to apply them.',
    },
    studyPrompt: {
      bg: 'Обясни ми Ци Мън Дун Цзя (奇門遁甲). Какво представлява системата, как работи 9-те двор ца, 8-те врати и как да я използвам за вземане на решения?',
      ru: 'Объясни мне Ци Мэнь Дунь Цзя (奇門遁甲). Что это за система, как работают 9 дворцов, 8 врат и как использовать её для принятия решений?',
      en: 'Explain Qi Men Dun Jia (奇門遁甲). What is the system, how do the 9 palaces and 8 gates work, and how do I use it for decision-making?',
    },
    quizPrompt: {
      bg: 'Изпитай ме за КМДЖ — деветте дворца, осемте врати, звездите и как да определя благоприятна посока.',
      ru: 'Проверь мои знания о ЦМДЦ — девять дворцов, восемь врат, звёзды и как определить благоприятное направление.',
      en: 'Quiz me on QMDJ — the nine palaces, eight gates, stars, and how to determine an auspicious direction.',
    },
  },
]

export const CATEGORY_LABELS: Record<TopicCategory, Record<Language, string>> = {
  basics:   { bg: 'Основи',   ru: 'Основы',    en: 'Basics'    },
  bazi:     { bg: 'БаЦзъ',    ru: 'Ба-Цзы',    en: 'BaZi'      },
  fengshui: { bg: 'Фън Шуй',  ru: 'Фэн Шуй',   en: 'Feng Shui' },
  qmdj:     { bg: 'КМДЖ',     ru: 'ЦМДЦ',      en: 'QMDJ'      },
}
