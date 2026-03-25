import type { Language } from '../engine/types'

export interface GuideEntry {
  title: Record<Language, string>
  body:  Record<Language, string>
}

// ─── Heavenly Stems guide content ─────────────────────────────────────────────
export const STEM_GUIDE: Record<string, GuideEntry> = {
  '甲': {
    title: { bg: '甲 — Ян Дърво', ru: '甲 — Ян Дерево', en: '甲 — Yang Wood' },
    body: {
      bg: 'Ян Дърво (甲) е силен, растящ борец. Символизира дъб, голям дървен ствол — амбиция, лидерство и директност. Хора с Ден甲 са целеустремени, но понякога твърдоглави.',
      ru: 'Ян Дерево (甲) — мощный, растущий воин. Символизирует дуб, большой ствол — амбиция, лидерство, прямота. Люди с Днём甲 целеустремлённы, но порой упрямы.',
      en: 'Yang Wood (甲) is a powerful, growing fighter. Symbolised by an oak or tall trunk — ambition, leadership, directness. Day甲 people are driven but sometimes stubborn.',
    },
  },
  '乙': {
    title: { bg: '乙 — Ин Дърво', ru: '乙 — Инь Дерево', en: '乙 — Yin Wood' },
    body: {
      bg: 'Ин Дърво (乙) е гъвкаво растение — лоза, цвете. Дипломатично, адаптивно, художествено. Постига целите си не чрез сила, а чрез гъвкавост и чар.',
      ru: 'Инь Дерево (乙) — гибкое растение, лоза, цветок. Дипломатично, адаптивно, художественно. Достигает целей не силой, а гибкостью и обаянием.',
      en: 'Yin Wood (乙) is a flexible plant — vine, flower. Diplomatic, adaptive, artistic. Achieves goals not through force but through flexibility and charm.',
    },
  },
  '丙': {
    title: { bg: '丙 — Ян Огън', ru: '丙 — Ян Огонь', en: '丙 — Yang Fire' },
    body: {
      bg: 'Ян Огън (丙) е слънцето — мощна, радиираща топлина. Харизматичен, щедър, оптимистичен. Естествен лидер, обичащ внимание. Може да изгори близките, ако не се контролира.',
      ru: 'Ян Огонь (丙) — это Солнце: мощное, излучающее тепло. Харизматичный, щедрый, оптимистичный. Природный лидер, любящий внимание. Может "выжечь" близких.',
      en: 'Yang Fire (丙) is the Sun — powerful, radiating warmth. Charismatic, generous, optimistic. Natural leader who loves attention. Can burn others out if unchecked.',
    },
  },
  '丁': {
    title: { bg: '丁 — Ин Огън', ru: '丁 — Инь Огонь', en: '丁 — Yin Fire' },
    body: {
      bg: 'Ин Огън (丁) е свещ или лампа — топла, вдъхновяваща, интелигентна светлина. Интроспективен, интуитивен, духовен. Силна емоционална дълбочина и творчество.',
      ru: 'Инь Огонь (丁) — свеча или лампа: тёплый, вдохновляющий, умный свет. Интроспективный, интуитивный, духовный. Сильная эмоциональная глубина и творчество.',
      en: 'Yin Fire (丁) is a candle or lamp — warm, inspiring, intelligent light. Introspective, intuitive, spiritual. Strong emotional depth and creativity.',
    },
  },
  '戊': {
    title: { bg: '戊 — Ян Земя', ru: '戊 — Ян Земля', en: '戊 — Yang Earth' },
    body: {
      bg: 'Ян Земя (戊) е голяма планина — стабилна, надеждна, непоколебима. Честен, директен, устойчив. Може да е негъвкав, но е изключително надежден. Роден защитник.',
      ru: 'Ян Земля (戊) — большая гора: стабильная, надёжная, непоколебимая. Честный, прямой, устойчивый. Может быть негибким, но крайне надёжным. Рождённый защитник.',
      en: 'Yang Earth (戊) is a great mountain — stable, reliable, immovable. Honest, direct, steadfast. May be inflexible but incredibly dependable. Born protector.',
    },
  },
  '己': {
    title: { bg: '己 — Ин Земя', ru: '己 — Инь Земля', en: '己 — Yin Earth' },
    body: {
      bg: 'Ин Земя (己) е плодородна почва — хранеща, търпелива, практична. Заземен, грижовен, умерен. Обича традиции и стабилност. Страхотен организатор зад кулисите.',
      ru: 'Инь Земля (己) — плодородная почва: питательная, терпеливая, практичная. Приземлённый, заботливый, умеренный. Любит традиции и стабильность. Отличный организатор.',
      en: 'Yin Earth (己) is fertile soil — nourishing, patient, practical. Grounded, caring, moderate. Loves tradition and stability. Great behind-the-scenes organiser.',
    },
  },
  '庚': {
    title: { bg: '庚 — Ян Метал', ru: '庚 — Ян Металл', en: '庚 — Yang Metal' },
    body: {
      bg: 'Ян Метал (庚) е меч или топор — остър, справедлив, безкомпромисен. Силен смисъл за правосъдие и принципи. Правда дори когато боли. Роден за кризи и трансформация.',
      ru: 'Ян Металл (庚) — меч или топор: острый, справедливый, бескомпромиссный. Сильное чувство справедливости. Правда, даже когда это больно. Рождён для кризисов.',
      en: 'Yang Metal (庚) is a sword or axe — sharp, just, uncompromising. Strong sense of justice and principles. Truth even when it hurts. Born for crises and transformation.',
    },
  },
  '辛': {
    title: { bg: '辛 — Ин Метал', ru: '辛 — Инь Металл', en: '辛 — Yin Metal' },
    body: {
      bg: 'Ин Метал (辛) е бижу или игла — прецизен, утончен, перфекционистичен. Висок стандарт за всичко. Очарователен на повърхността, но скрива болка. Чувствителен и естетичен.',
      ru: 'Инь Металл (辛) — украшение или игла: точный, утончённый, перфекционистичный. Высокие стандарты. Очарователен снаружи, скрывает боль. Чувствительный и эстетичный.',
      en: 'Yin Metal (辛) is a jewel or needle — precise, refined, perfectionist. High standards for everything. Charming on the surface, hides pain. Sensitive and aesthetic.',
    },
  },
  '壬': {
    title: { bg: '壬 — Ян Вода', ru: '壬 — Ян Вода', en: '壬 — Yang Water' },
    body: {
      bg: 'Ян Вода (壬) е океан или голяма река — силна, непредсказуема, мъдра. Изключителен ум и стратегическо мислене. Адаптивен, може да бъде повлиян от средата си. Мъдрец.',
      ru: 'Ян Вода (壬) — океан или большая река: мощная, непредсказуемая, мудрая. Исключительный интеллект и стратегическое мышление. Адаптивный, мудрец.',
      en: 'Yang Water (壬) is an ocean or great river — powerful, unpredictable, wise. Exceptional intelligence and strategic thinking. Adaptive, may be influenced by environment. Sage.',
    },
  },
  '癸': {
    title: { bg: '癸 — Ин Вода', ru: '癸 — Инь Вода', en: '癸 — Yin Water' },
    body: {
      bg: 'Ин Вода (癸) е дъжд, роса или поточе — деликатна, интуитивна, дълбоко емоционална. Изключително чувствителна към околната среда. Художник, мечтател, медиум.',
      ru: 'Инь Вода (癸) — дождь, роса или ручеёк: деликатная, интуитивная, глубоко эмоциональная. Очень чувствительна к среде. Художник, мечтатель, медиум.',
      en: 'Yin Water (癸) is rain, dew, or a stream — delicate, intuitive, deeply emotional. Highly sensitive to environment. Artist, dreamer, medium.',
    },
  },
}

// ─── Earthly Branches guide content ───────────────────────────────────────────
export const BRANCH_GUIDE: Record<string, GuideEntry> = {
  '子': {
    title: { bg: '子 — Плъх (Вода)', ru: '子 — Крыса (Вода)', en: '子 — Rat (Water)' },
    body: {
      bg: 'Плъхът е умен, адаптивен и пъргав. Пик на Ин Вода: 23:00-01:00. Скрити скъпоценности — символ на скрита мъдрост и потенциал. Активен нощем, стратегически мислещ.',
      ru: 'Крыса умна, адаптивна и проворна. Пик Инь Воды: 23:00-01:00. Скрытые сокровища — символ скрытой мудрости и потенциала. Активна ночью, стратегически мыслит.',
      en: 'Rat is clever, adaptive, resourceful. Peak Yin Water: 23:00-01:00. Hidden treasures — symbol of hidden wisdom and potential. Active at night, strategic thinker.',
    },
  },
  '丑': {
    title: { bg: '丑 — Вол (Земя)', ru: '丑 — Бык (Земля)', en: '丑 — Ox (Earth)' },
    body: {
      bg: 'Волът е трудолюбив, постоянен и надежден. Пик: 01:00-03:00. Символ на упорита работа и постепенен напредък. Може да му липсва гъвкавост, но постига всяка цел.',
      ru: 'Бык трудолюбив, постоянен и надёжен. Пик: 01:00-03:00. Символ упорного труда и постепенного прогресса. Может не хватать гибкости, но достигает любой цели.',
      en: 'Ox is hardworking, persistent, reliable. Peak: 01:00-03:00. Symbol of hard work and steady progress. May lack flexibility but achieves every goal.',
    },
  },
  '寅': {
    title: { bg: '寅 — Тигър (Дърво)', ru: '寅 — Тигр (Дерево)', en: '寅 — Tiger (Wood)' },
    body: {
      bg: 'Тигърът е смел, непредсказуем и харизматичен. Пик: 03:00-05:00. Символ на лидерство и бунт. Ражда трансформиращи промени. Не се влиза в конфликт с Тигъра.',
      ru: 'Тигр смел, непредсказуем и харизматичен. Пик: 03:00-05:00. Символ лидерства и бунта. Порождает трансформирующие перемены. Не стоит конфликтовать с Тигром.',
      en: 'Tiger is brave, unpredictable, charismatic. Peak: 03:00-05:00. Symbol of leadership and rebellion. Sparks transformational changes. Don\'t cross a Tiger.',
    },
  },
  '卯': {
    title: { bg: '卯 — Заек (Дърво)', ru: '卯 — Кролик (Дерево)', en: '卯 — Rabbit (Wood)' },
    body: {
      bg: 'Заекът е дипломатичен, изтънчен и спокоен. Пик: 05:00-07:00. Символ на мир, красота и изтънченост. Обича хармония, избягва конфликти. Естествен дипломат.',
      ru: 'Кролик дипломатичен, утончён и спокоен. Пик: 05:00-07:00. Символ мира, красоты и изящества. Любит гармонию, избегает конфликтов. Природный дипломат.',
      en: 'Rabbit is diplomatic, refined, peaceful. Peak: 05:00-07:00. Symbol of peace, beauty, and elegance. Loves harmony, avoids conflict. Natural diplomat.',
    },
  },
  '辰': {
    title: { bg: '辰 — Дракон (Земя)', ru: '辰 — Дракон (Земля)', en: '辰 — Dragon (Earth)' },
    body: {
      bg: 'Драконът е единственото митично животно. Пик: 07:00-09:00. Символ на мощ, богатство и духовност. Самороден лидер с вродена харизма. Трансформира всичко около себе си.',
      ru: 'Дракон — единственное мифическое животное. Пик: 07:00-09:00. Символ мощи, богатства и духовности. Самородный лидер с врождённой харизмой. Трансформирует всё вокруг.',
      en: 'Dragon is the only mythical animal. Peak: 07:00-09:00. Symbol of power, wealth, and spirituality. Natural born leader with innate charisma. Transforms everything around it.',
    },
  },
  '巳': {
    title: { bg: '巳 — Змия (Огън)', ru: '巳 — Змея (Огонь)', en: '巳 — Snake (Fire)' },
    body: {
      bg: 'Змията е мъдра, интуитивна и мистериозна. Пик: 09:00-11:00. Символ на дълбока мъдрост и трансформация. Чете хората интуитивно. Привлекателна, но трудно предвидима.',
      ru: 'Змея мудра, интуитивна и таинственна. Пик: 09:00-11:00. Символ глубокой мудрости и трансформации. Читает людей интуитивно. Привлекательная, но труднопредсказуемая.',
      en: 'Snake is wise, intuitive, mysterious. Peak: 09:00-11:00. Symbol of deep wisdom and transformation. Reads people intuitively. Attractive but hard to predict.',
    },
  },
  '午': {
    title: { bg: '午 — Кон (Огън)', ru: '午 — Лошадь (Огонь)', en: '午 — Horse (Fire)' },
    body: {
      bg: 'Конят е свободолюбив, енергичен и страстен. Пик: 11:00-13:00. Символ на свобода, скорост и действие. Мрази ограниченията. Харизматичен, но неспокоен по природа.',
      ru: 'Лошадь свободолюбива, энергична и страстна. Пик: 11:00-13:00. Символ свободы, скорости и действия. Ненавидит ограничения. Харизматична, но беспокойна.',
      en: 'Horse is freedom-loving, energetic, passionate. Peak: 11:00-13:00. Symbol of freedom, speed, and action. Hates restrictions. Charismatic but restless by nature.',
    },
  },
  '未': {
    title: { bg: '未 — Коза (Земя)', ru: '未 — Коза (Земля)', en: '未 — Goat (Earth)' },
    body: {
      bg: 'Козата е творческа, нежна и артистична. Пик: 13:00-15:00. Символ на творчество, красота и загриженост. Емпатична, но може да е зависима от мнението на другите.',
      ru: 'Коза творческая, нежная и артистичная. Пик: 13:00-15:00. Символ творчества, красоты и заботы. Эмпатична, но может зависеть от мнения других.',
      en: 'Goat is creative, gentle, artistic. Peak: 13:00-15:00. Symbol of creativity, beauty, and care. Empathic but may depend on others\' opinions.',
    },
  },
  '申': {
    title: { bg: '申 — Маймуна (Метал)', ru: '申 — Обезьяна (Металл)', en: '申 — Monkey (Metal)' },
    body: {
      bg: 'Маймуната е умна, хитра и иновативна. Пик: 15:00-17:00. Символ на интелект и адаптация. Бърза мисъл и множество таланти. Може да е непостоянна и манипулативна.',
      ru: 'Обезьяна умна, хитра и инновационна. Пик: 15:00-17:00. Символ интеллекта и адаптации. Быстрый ум и множество талантов. Может быть непостоянной и манипулятивной.',
      en: 'Monkey is clever, witty, innovative. Peak: 15:00-17:00. Symbol of intelligence and adaptation. Quick mind and multiple talents. Can be fickle and manipulative.',
    },
  },
  '酉': {
    title: { bg: '酉 — Петел (Метал)', ru: '酉 — Петух (Металл)', en: '酉 — Rooster (Metal)' },
    body: {
      bg: 'Петелът е прецизен, перфекционист и директен. Пик: 17:00-19:00. Символ на наблюдателност и точност. Критичен, но справедлив. Обича реда и детайлите.',
      ru: 'Петух точен, перфекционист и прямолинеен. Пик: 17:00-19:00. Символ наблюдательности и точности. Критичен, но справедлив. Любит порядок и детали.',
      en: 'Rooster is precise, perfectionist, direct. Peak: 17:00-19:00. Symbol of observation and accuracy. Critical but fair. Loves order and detail.',
    },
  },
  '戌': {
    title: { bg: '戌 — Куче (Земя)', ru: '戌 — Собака (Земля)', en: '戌 — Dog (Earth)' },
    body: {
      bg: 'Кучето е лоялно, честно и справедливо. Пик: 19:00-21:00. Символ на вярност и защита. Непоколебим борец за справедливост. Понякога прекалено критично към себе си.',
      ru: 'Собака лояльна, честна и справедлива. Пик: 19:00-21:00. Символ верности и защиты. Непоколебимый борец за справедливость. Иногда излишне самокритична.',
      en: 'Dog is loyal, honest, just. Peak: 19:00-21:00. Symbol of faithfulness and protection. Unwavering fighter for justice. Sometimes overly self-critical.',
    },
  },
  '亥': {
    title: { bg: '亥 — Прасе (Вода)', ru: '亥 — Свинья (Вода)', en: '亥 — Pig (Water)' },
    body: {
      bg: 'Прасето е великодушно, наивно и чисто. Пик: 21:00-23:00. Символ на изобилие и чистота. Добро по природа, понякога лековерно. Обича удоволствия и хармония.',
      ru: 'Свинья великодушна, наивна и чиста. Пик: 21:00-23:00. Символ изобилия и чистоты. Добра по природе, иногда доверчива. Любит удовольствия и гармонию.',
      en: 'Pig is generous, naive, pure. Peak: 21:00-23:00. Symbol of abundance and purity. Good by nature, sometimes gullible. Loves pleasure and harmony.',
    },
  },
}

// ─── QMDJ Gate guide content ───────────────────────────────────────────────────
export const GATE_GUIDE: Record<string, GuideEntry> = {
  open: {
    title: { bg: '开 — Открита врата', ru: '开 — Открытые врата', en: '开 — Open Gate' },
    body: {
      bg: 'Открита (开) е най-благоприятната врата. Символизира напредък, бизнес и нови начинания. Когато е активна — идеален момент за стартиране на проекти, преговори и движение напред.',
      ru: 'Открытые (开) — самые благоприятные врата. Символизируют прогресс, бизнес и новые начинания. Когда активны — идеальный момент для запуска проектов, переговоров и движения вперёд.',
      en: 'Open (开) is the most auspicious gate. Symbolises progress, business, and new ventures. When active — ideal moment for starting projects, negotiations, and moving forward.',
    },
  },
  rest: {
    title: { bg: '休 — Почивка', ru: '休 — Покой', en: '休 — Rest Gate' },
    body: {
      bg: 'Почивка (休) е мека, дипломатична врата. Благоприятна за почивка, водни дейности и дипломация. По-добра за вътрешна работа, отколкото за агресивно действие.',
      ru: 'Покой (休) — мягкие, дипломатические врата. Благоприятны для отдыха, водных дел и дипломатии. Лучше для внутренней работы, чем для агрессивных действий.',
      en: 'Rest (休) is a soft, diplomatic gate. Good for rest, water activities, and diplomacy. Better for inner work than aggressive action.',
    },
  },
  life: {
    title: { bg: '生 — Живот', ru: '生 — Жизнь', en: '生 — Life Gate' },
    body: {
      bg: 'Живот (生) е врата на растежа и грижата. Идеална за земеделие, нови проекти и отглеждане на нещо ново. Подхранваща и стабилна — добра за дългосрочни начинания.',
      ru: 'Жизнь (生) — врата роста и заботы. Идеальна для земледелия, новых проектов и взращивания чего-то нового. Питательная и стабильная — хороша для долгосрочных начинаний.',
      en: 'Life (生) is the gate of growth and nurturing. Ideal for agriculture, new projects, and raising something new. Nourishing and stable — good for long-term ventures.',
    },
  },
}

// ─── Kua Energy guide content ──────────────────────────────────────────────────
export const ENERGY_GUIDE: Record<string, GuideEntry> = {
  shengqi: {
    title: { bg: '生气 — Шън Ци (Жизнена сила)', ru: '生气 — Шэн Ци (Жизненная сила)', en: '生气 — Sheng Qi (Vitality)' },
    body: {
      bg: 'Шън Ци е твоята най-мощна посока. Носи богатство, успех и здраве. Спи с глава натам, работи в тази посока, постави бюрото си насочено натам. Това е посоката, в която трябва да се насочиш за важни срещи и преговори.',
      ru: 'Шэн Ци — ваше самое мощное направление. Приносит богатство, успех и здоровье. Спите головой туда, работайте в этом направлении, поставьте стол так, чтобы смотреть туда. Это направление для важных встреч и переговоров.',
      en: 'Sheng Qi is your most powerful direction. Brings wealth, success, and health. Sleep with your head facing it, work in this direction, position your desk towards it. Use for important meetings and negotiations.',
    },
  },
  tianyi: {
    title: { bg: '天医 — Тян Йи (Небесен лекар)', ru: '天医 — Тянь И (Небесный врач)', en: '天医 — Tian Yi (Heavenly Doctor)' },
    body: {
      bg: 'Тян Йи е посоката за здраве и изцеление. Ако си болен, легни в тази посока. Добра и за ментална яснота, медитация и намиране на баланс. Втора по сила след Шън Ци.',
      ru: 'Тянь И — направление здоровья и исцеления. Если больны — ложитесь в этом направлении. Хорошо для ясности ума, медитации и нахождения баланса. Второе по силе после Шэн Ци.',
      en: 'Tian Yi is the direction for health and healing. If ill, lie in this direction. Good for mental clarity, meditation, and finding balance. Second in power after Sheng Qi.',
    },
  },
  yannian: {
    title: { bg: '延年 — Ян Нян (Дълголетие)', ru: '延年 — Янь Нянь (Долголетие)', en: '延年 — Yan Nian (Longevity)' },
    body: {
      bg: 'Ян Нян е посоката за дълги отношения, романтика и договори. Поставяй важни документи в тази посока. Добра за семейна хармония и дългосрочни партньорства.',
      ru: 'Янь Нянь — направление для долгих отношений, романтики и договоров. Держите важные документы в этом направлении. Хороша для семейной гармонии и долгосрочных партнёрств.',
      en: 'Yan Nian is the direction for lasting relationships, romance, and contracts. Keep important documents in this direction. Good for family harmony and long-term partnerships.',
    },
  },
}
