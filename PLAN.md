# 🔮 BaZi Chart Web App — Project Plan

## Overview

A **local-first Progressive Web App (PWA)** that calculates personalized BaZi (Four Pillars of Destiny) charts and delivers daily readings in **Bulgarian, Russian, and English**.

No scraping. No database. No stored personal data. Fully legal. Fully private.

---

## Core Philosophy

- **Privacy by design** — birth data never leaves the user's device
- **No external dependencies** — BaZi is pure math, we calculate it ourselves
- **GDPR-clean** — zero personal data on any server, ever
- **Free to run** — no VPS, no paid hosting required
- **AI-powered interpretations** — DeepSeek V3 for rich, natural language readings

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite + Tailwind CSS | Fast, familiar, mobile-first |
| PWA | Vite PWA plugin | Installable on any device |
| BaZi Engine | `lunar-javascript` (JS library) | Complete Chinese calendar, well-tested |
| AI | DeepSeek V3 API | ~10x cheaper than Claude, excellent quality |
| API Proxy | Vercel Serverless Functions (free tier) | Hides DeepSeek API key from frontend |
| Storage | `localStorage` / `IndexedDB` | 100% client-side, no server storage |
| Icons | Lucide React | Consistent with other projects |

---

## Architecture

```
User's Device (Browser / PWA)
├── Birth data           → localStorage only, never sent anywhere
├── Calculated chart     → computed locally by BaZi engine
├── Cached daily reading → localStorage, refreshes each day
└── Language preference  → localStorage

                ↓ (only sends chart stems/branches, NO birth data)

Vercel Serverless Function (free tier, stateless)
└── POST /api/interpret
    ├── Receives: chart data (pillars, day master, today's pillars)
    ├── Calls: DeepSeek V3 API
    └── Returns: BG + RU + EN interpretation text
    (logs nothing, stores nothing)

DeepSeek V3 API
└── Generates natural language readings
```

---

## Data Flow

```
1. User enters: name, birthdate, birthtime, gender, language
2. Browser calculates (locally, instant):
   ├── Year Pillar (stem + branch + element + polarity)
   ├── Month Pillar (based on solar terms 节气)
   ├── Day Pillar (60-day cycle)
   ├── Hour Pillar (12 earthly branch periods)
   ├── Day Master (the Day stem = personal element)
   ├── 10-year Luck Cycles (大运, direction based on gender)
   └── TODAY's universal pillars (same math, today's date)
3. Structured chart data sent to /api/interpret
4. DeepSeek returns rich reading in BG / RU / EN
5. Result cached in localStorage for the day
```

---

## Privacy Model

| Data | Where stored | Server sees it? |
|------|-------------|-----------------|
| Name | localStorage | Never |
| Birth date | localStorage | Never |
| Birth time | localStorage | Never |
| Gender | localStorage | Never |
| Calculated chart (stems/branches) | localStorage + sent to API | Yes (anonymous, no PII) |
| Daily reading text | localStorage (cached) | Generated, not stored |
| API keys | Vercel env vars | Never in frontend code |

---

## Languages

- 🇧🇬 **Bulgarian** — primary language, all UI + readings
- 🇷🇺 **Russian** — secondary (natural, data source is Russian)
- 🇬🇧 **English** — tertiary (broader reach)

Language toggle visible on every screen. Preference saved in localStorage.

---

## App Screens

### Screen 1: Setup (first-time only)
```
✨ Вашата БаЦзи карта

Вашето ime:          [Ivan              ]
Дата на раждане:     [31.10.1992        ]  ← DD.MM.YYYY
Час на раждане:      [16:30             ]  ← HH:MM (optional)
Пол:                 ◉ Мъж  ○ Жена  ○ Не желая да посоча
Език:                ◉ BG  ○ RU  ○ EN

              [ 🔮 Изчисли картата → ]

ℹ️  Данните ви се съхраняват само на вашето устройство.
```

### Screen 2: Today's Reading (home screen)
```
🌅 ДНЕС — 20 март 2026, петък

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
УНИВЕРСАЛНА ЕНЕРГИЯ НА ДЕНЯ
День: 癸巳  Вода Змия (Инь)
Месяц: 辛卯  Метал Заек (Инь)
Год: 丙午  Огън Кон (Ян)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔮 ВАШАТА ЛИЧНА КАРТА
Господар на деня: Метал (庚)

📊 ВЗАИМОДЕЙСТВИЕ ДНЕС
[AI generated paragraph in BG]

🎯 ПРЕПОРЪКИ ЗА ДЕНЯ:
💰 Финанси        ──────── ★★★☆☆
💼 Работа         ──────── ★★★★☆
❤️  Отношения     ──────── ★★☆☆☆
🏠 Дом            ──────── ★★★☆☆
✈️  Пътувания     ──────── ★★★★★
📝 Договори       ──────── ★★☆☆☆
🌿 Здраве         ──────── ★★★☆☆
🎨 Творчество     ──────── ★★★★☆
```

### Screen 3: Lucky Dates (30-day calendar)
```
📅 БЛАГОПРИЯТНИ ДНИ — март/април 2026

Тема: [Работа ▾]  Дейност: [Преговори ▾]

[calendar grid with color-coded ratings]
🟢 Отлично  🟡 Добре  ⚪ Неутрално  🔴 Избягвай
```

### Screen 4: My BaZi Chart
```
🔮 КАРТАТА НА ИВАН

ЧЕТИРИТЕ СТЪЛБА:
       Час    Ден    Месяц   Год
Ствол:  甲     庚     戊      乙
Клон:   寅     辰     戌      丑
       Дърво  Метал  Земя    Метал
       Тигър  Дракон Куче    Вол

ГОСПОДАР НА ДЕНЯ: 庚 Метал (Ян)
КИТАЙСКИ ЗОДИАК: Тигър

ЦИКЛИ НА УДАЧА (10-годишни):
[timeline visualization]
```

### Screen 5: Settings
```
⚙️  Настройки

Профил:    Иван  [Редактирай]
Език:      🇧🇬 Bulgarian  [Промени]
Известия:  [toggle] Дневно напомняне в 08:00
Тема:      ◉ Тъмна  ○ Светла

[Изчисти всички данни]  ← with confirmation dialog
```

---

## BaZi Calculation Engine

Using `lunar-javascript` library:

```javascript
// What we calculate locally (zero network calls):

// 1. Convert Gregorian → Chinese calendar
const lunar = Solar.fromYmd(1992, 10, 31).getLunar()

// 2. Get the Four Pillars (八字)
const eightChar = lunar.getEightChar()
// → year: 壬申, month: 戊戌, day: 庚辰, hour: 庚申

// 3. Day Master (日主)
const dayMaster = eightChar.getDayGan() // → 庚 (Metal Yang)

// 4. Ten-year luck cycles (大运)
const yun = eightChar.getYun(gender) // gender: 1=male, 0=female
```

**Solar terms handled automatically** by the library (critical for correct month pillar).

**Timezone note:** BaZi uses local solar time at birth location. We'll ask for city/country and apply UTC offset. For MVP, we use the birth timezone; advanced feature later can add solar time correction.

---

## DeepSeek Integration

### What we send (no PII):
```json
{
  "chart": {
    "yearStem": "乙", "yearBranch": "丑",
    "monthStem": "戊", "monthBranch": "戌",
    "dayStem": "庚", "dayBranch": "辰",
    "hourStem": "庚", "hourBranch": "申"
  },
  "today": {
    "dayStem": "癸", "dayBranch": "巳",
    "monthStem": "辛", "monthBranch": "卯"
  },
  "dayMaster": "庚",
  "language": "bg",
  "requestType": "daily_reading"
}
```

### What we get back:
- Daily energy description (2-3 sentences)
- Life area ratings + explanation (Finance, Work, Love, etc.)
- One actionable tip for the day
- Lucky hours today

### Cost estimate (50 users × 30 days):
- ~800 tokens/request × 1500 requests/month = 1.2M tokens
- DeepSeek V3: ~$0.27/MTok in + $1.10/MTok out
- **Total: ~$2-4/month** ✅

---

## File Structure

```
baczi/
├── PLAN.md                        ← this file
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── engine/
│   │   ├── baziCalculator.ts      ← core BaZi calculation
│   │   ├── solarTerms.ts          ← solar terms helper
│   │   ├── translations.ts        ← stems/branches → BG/RU/EN names
│   │   └── types.ts               ← TypeScript interfaces
│   │
│   ├── screens/
│   │   ├── Setup.tsx              ← first-time birth data entry
│   │   ├── Today.tsx              ← daily reading (home)
│   │   ├── LuckyDates.tsx         ← 30-day calendar
│   │   ├── MyChart.tsx            ← full BaZi chart
│   │   └── Settings.tsx
│   │
│   ├── components/
│   │   ├── PillarCard.tsx         ← single pillar display
│   │   ├── LifeAreaRating.tsx     ← star rating per area
│   │   ├── LuckCycleTimeline.tsx  ← 10-year cycles visualization
│   │   ├── LanguageToggle.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── hooks/
│   │   ├── useProfile.ts          ← read/write localStorage profile
│   │   ├── useDailyReading.ts     ← fetch + cache daily reading
│   │   └── useLanguage.ts
│   │
│   └── utils/
│       ├── storage.ts             ← localStorage helpers
│       └── dateHelpers.ts
│
└── api/
    └── interpret.ts               ← Vercel serverless function
                                      (DeepSeek proxy, stateless)
```

---

## MVP Checklist

### Phase 1 — Core (MVP)
- [ ] Setup form (name, date, time, gender, language)
- [ ] BaZi calculation engine (all 4 pillars + day master)
- [ ] Today's universal pillars (calculated locally)
- [ ] DeepSeek daily reading API endpoint
- [ ] Today screen with reading + life area ratings
- [ ] My Chart screen (4 pillars display)
- [ ] 3-language support (BG/RU/EN)
- [ ] localStorage persistence
- [ ] Mobile-first responsive design
- [ ] PWA manifest (installable)

### Phase 2 — Enhanced
- [ ] 10-year luck cycle timeline visualization
- [ ] 30-day lucky dates calendar
- [ ] Dark/light mode toggle
- [ ] Web Push notifications (daily reminder)
- [ ] Lucky hours of the day
- [ ] Share reading as image

### Phase 3 — Future
- [ ] Multiple profiles (family members)
- [ ] Compatibility reading (two charts)
- [ ] Annual forecast
- [ ] Tavily enrichment (optional: real-world context)

---

## Environment Variables

```env
# Vercel serverless function only (never in frontend)
DEEPSEEK_API_KEY=sk-...

# Frontend (public, safe to expose)
VITE_API_BASE_URL=https://your-app.vercel.app
```

---

## Deployment

1. Push to GitHub
2. Connect repo to Vercel (free tier)
3. Set `DEEPSEEK_API_KEY` in Vercel env vars
4. Deploy → get HTTPS URL
5. Share link in Telegram — opens as PWA on mobile

**Cost: €0/month** (Vercel free tier handles 50 users easily)

---

## Security Notes

- API key only in Vercel server env, never in frontend bundle
- Rate limiting on `/api/interpret` endpoint (max 10 req/min per IP)
- No logging of request bodies on the server
- All localStorage data is unencrypted — acceptable since it's on the user's own device
- Input validation on birth date (must be valid date, not future)

---

## Notes on BaZi Accuracy

- We use `lunar-javascript` which handles solar terms correctly
- Month pillar boundary is the solar term (节气), NOT the lunar month start
- Hour pillar uses standard Chinese double-hours (子时 = 23:00-01:00, etc.)
- 10-year luck cycle direction: Yang male + Yin female = forward; Yin male + Yang female = backward
- For birth time unknown: hour pillar shown as "?" — reading still valid for other 3 pillars
- Timezone: user's birth location timezone used; solar time correction is a Phase 2 feature
