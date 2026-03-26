/**
 * POST /api/studio
 * Generate a consultation draft for a client.
 * Body: { personName, chart, topic, customPrompt, language, includeReasoning }
 * Auth: Bearer JWT (editor or admin tier only)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Tier = 'free' | 'pro' | 'max' | 'admin' | 'editor'

const CHAR_TO_PINYIN: Record<string, string> = {
  '甲':'Jia','乙':'Yi','丙':'Bing','丁':'Ding','戊':'Wu',
  '己':'Ji','庚':'Geng','辛':'Xin','壬':'Ren','癸':'Gui',
  '子':'Zi','丑':'Chou','寅':'Yin','卯':'Mao','辰':'Chen',
  '巳':'Si','午':'Wu','未':'Wei','申':'Shen','酉':'You','戌':'Xu','亥':'Hai',
}

const TOPIC_PROMPTS: Record<string, Record<string, string>> = {
  weekly: {
    en: 'Create a personalized weekly BaZi energy forecast for this person. Cover each day of the coming week: dominant element, what to focus on, what to avoid, lucky hours. Use the chart data to personalize every recommendation.',
    ru: 'Создай персональный недельный прогноз BaZi для этого человека. Охвати каждый день недели: доминирующий элемент, на чём сосредоточиться, чего избегать, удачные часы. Используй данные карты для персонализации.',
    bg: 'Създай персонализирана седмична BaZi прогноза за този човек. Покрий всеки ден от следващата седмица: доминиращ елемент, на какво да се фокусира, какво да избягва, щастливи часове. Използвай данните от картата за персонализация.',
  },
  bazi: {
    en: 'Create a comprehensive personal BaZi consultation for this person. Include: Day Master analysis, element balance, current 10-year luck cycle assessment, main strengths and challenges, career and relationship insights, practical recommendations for this period.',
    ru: 'Создай комплексную личную консультацию BaZi для этого человека. Включи: анализ Хозяина дня, баланс элементов, оценку текущего 10-летнего цикла удачи, главные сильные стороны и вызовы, инсайты о карьере и отношениях, практические рекомендации.',
    bg: 'Създай комплексна лична BaZi консултация за този човек. Включи: анализ на Господаря на деня, баланс на елементите, оценка на текущия 10-годишен цикъл на удача, главни силни страни и предизвикателства, прозрения за кариера и взаимоотношения, практически препоръки.',
  },
  fengshui: {
    en: 'Create a personalized Feng Shui consultation for this person. Include: Kua number and personal directions (favorable/unfavorable), best and worst sectors for work/sleep/entrance, recommendations for activating wealth, health and relationship areas based on their BaZi chart.',
    ru: 'Создай персональную консультацию по Фэн Шуй. Включи: число Гуа и личные направления (благоприятные/неблагоприятные), лучшие и худшие секторы для работы/сна/входа, рекомендации по активации зон богатства, здоровья и отношений на основе карты Ба-Цзы.',
    bg: 'Създай персонализирана Фън Шуй консултация. Включи: число Гуа и лични посоки (благоприятни/неблагоприятни), най-добри и най-лоши сектори за работа/сън/вход, препоръки за активиране на зоните на богатство, здраве и взаимоотношения въз основа на BaZi картата.',
  },
  qimen: {
    en: 'Create a Qi Men Dun Jia forecast for this person for the coming week/month. Include: current palace energies, auspicious gates and doors, best timing and directions for important actions, specific days/hours to initiate projects or make decisions. Personalize based on their Day Master element.',
    ru: 'Создай прогноз Ци Мэнь Дунь Цзя для этого человека на ближайшую неделю/месяц. Включи: текущие энергии дворцов, благоприятные ворота и двери, лучшее время и направления для важных действий, конкретные дни/часы для начала проектов или принятия решений.',
    bg: 'Създай Ци Мен Дун Дзя прогноза за този човек за следващата седмица/месец. Включи: текущи енергии на дворците, благоприятни врати, най-доброто време и посоки за важни действия, конкретни дни/часове за стартиране на проекти или вземане на решения.',
  },
}

async function fetchKnowledgeForConsultation(chart: Record<string, unknown>, topic: string): Promise<string> {
  const allTags = new Set<string>()
  for (const key of ['year', 'month', 'day', 'hour']) {
    const p = chart[key] as Record<string, string> | null | undefined
    if (!p) continue
    if (p.gan && CHAR_TO_PINYIN[p.gan]) allTags.add(CHAR_TO_PINYIN[p.gan])
    if (p.zhi && CHAR_TO_PINYIN[p.zhi]) allTags.add(CHAR_TO_PINYIN[p.zhi])
  }
  if (!allTags.size) return ''

  const tags = [...allTags]
  const topicTag = topic === 'fengshui' ? 'fengshui' : topic === 'qimen' ? 'qimen' : undefined

  const queries = [
    supabase.from('bazi_knowledge').select('rule_text, pattern')
      .overlaps('tags', tags).eq('school', 'joey_yap').in('confidence', ['high', 'medium']).limit(10),
    supabase.from('bazi_knowledge').select('rule_text, pattern')
      .overlaps('tags', tags).in('confidence', ['high', 'medium']).limit(10),
    // Editor custom rules always included
    supabase.from('bazi_knowledge').select('rule_text, pattern')
      .eq('school', 'editor_custom').in('confidence', ['high', 'medium', 'low']).limit(10),
    ...(topicTag ? [supabase.from('bazi_knowledge').select('rule_text, pattern')
      .contains('tags', [topicTag]).in('confidence', ['high', 'medium']).limit(6)] : []),
  ]

  const results = await Promise.allSettled(queries)
  const seen = new Set<string>()
  const rules: string[] = []

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    const rows = (result.value as { data: Array<{ rule_text: string; pattern?: string }> | null }).data ?? []
    for (const row of rows) {
      if (!seen.has(row.rule_text)) {
        seen.add(row.rule_text)
        rules.push(`• ${row.pattern ? row.pattern + ': ' : ''}${row.rule_text}`)
        if (rules.length >= 20) break
      }
    }
    if (rules.length >= 20) break
  }

  return rules.length ? `Relevant BaZi rules for this consultation:\n${rules.join('\n')}` : ''
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' })

  let payload: { tier: Tier; hash: string }
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload: p } = await jwtVerify(auth.slice(7), secret)
    payload = p as { tier: Tier; hash: string }
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }

  if (payload.tier !== 'admin' && payload.tier !== 'editor') {
    return res.status(403).json({ error: 'Studio access requires editor or admin tier' })
  }

  const { personName, chart, topic = 'weekly', customPrompt, language = 'en', includeReasoning = false } = req.body ?? {}

  if (!personName || !chart) {
    return res.status(400).json({ error: 'personName and chart are required' })
  }

  const lang = language === 'bg' ? 'bg' : language === 'ru' ? 'ru' : 'en'
  const topicPrompts = TOPIC_PROMPTS[topic as keyof typeof TOPIC_PROMPTS] ?? TOPIC_PROMPTS.weekly
  const topicInstruction = customPrompt || topicPrompts[lang] || topicPrompts.en

  const knowledge = await fetchKnowledgeForConsultation(chart as Record<string, unknown>, topic as string)

  const langName = lang === 'bg' ? 'Bulgarian' : lang === 'ru' ? 'Russian' : 'English'

  const systemPrompt = [
    `You are a professional Chinese Metaphysics consultant specializing in BaZi (Four Pillars of Destiny), Feng Shui, and Qi Men Dun Jia.`,
    `You are preparing a professional consultation document for a client named ${personName}.`,
    `Always respond in ${langName}. Use a professional, warm, and insightful tone.`,
    `Client chart data: ${JSON.stringify(chart)}`,
    knowledge,
    includeReasoning
      ? `After your consultation text, add a "## Reasoning" section that explains: which pillars and interactions you referenced, which rules you applied, and why you made each key recommendation.`
      : '',
    `Format the consultation clearly with sections and headers. Be specific and personalized — reference actual chart elements (stems, branches, elements) in your text.`,
  ].filter(Boolean).join('\n\n')

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: topicInstruction },
        ],
        temperature: 0.75,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) throw new Error(`DeepSeek ${response.status}`)
    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    const content = data.choices[0].message.content

    // Split reasoning from main content if requested
    let mainContent = content
    let reasoning = ''
    if (includeReasoning) {
      const reasoningIdx = content.indexOf('## Reasoning')
      if (reasoningIdx !== -1) {
        mainContent = content.slice(0, reasoningIdx).trim()
        reasoning = content.slice(reasoningIdx).trim()
      }
    }

    return res.status(200).json({ content: mainContent, reasoning })
  } catch (err) {
    console.error('Studio generation error:', err)
    return res.status(500).json({ error: 'AI request failed' })
  }
}
