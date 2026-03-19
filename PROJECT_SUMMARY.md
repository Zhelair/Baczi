# BaCzi — Project Summary (for new chat continuation)

## What is BaCzi?
A mobile-first BaZi (Four Pillars of Destiny) web app.
- Users enter birth data → get daily AI readings, lucky hours, chart
- Passphrase-based access (no accounts), token system per tier
- Live at: baczi.vercel.app
- GitHub: public repo `Zhelair/Baczi`
- Branch: `claude/review-and-plan-romwu`

---

## Stack
| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Tailwind v4 + Vite |
| Backend API | Vercel serverless functions (`/api/auth.ts`, `/api/interpret.ts`) |
| AI | DeepSeek API (`deepseek-chat`) |
| Storage | Supabase (PostgreSQL) — token balances |
| Auth | Passphrase → JWT (jose), stored in localStorage |
| Chinese calendar | `lunar-javascript` (MIT, open source) |

---

## Key files
```
src/
  App.tsx                  — routing, theme management
  engine/
    types.ts               — UserProfile, BaziChart, Theme, etc.
    baziCalculator.ts      — chart calculation + true solar time correction
    translations.ts        — bg/ru/en strings
  screens/
    Passphrase.tsx         — login screen
    Setup.tsx              — birth data form + city search
    Today.tsx              — daily reading (main AI call)
    LuckyDates.tsx         — luck check (secondary AI call)
    MyChart.tsx            — birth chart display
    Settings.tsx           — theme switcher, language, profile
  components/
    ThinkingOrb.tsx        — animated AI loading indicator (orb + bouncing dots)
    AiStatusBadge.tsx      — "AI Active" / "Thinking..." pill in header
    TokenBadge.tsx         — shows token balance
    PillarCard.tsx         — pillar display
    TabBar.tsx             — bottom navigation
  utils/
    api.ts                 — API calls
    storage.ts             — localStorage helpers
  index.css                — Tailwind + 3 themes (Dark/Daylight/Neon)
api/
  auth.ts                  — passphrase → JWT + Supabase token balance
  interpret.ts             — DeepSeek AI reading generation
supabase/
  migrations.sql           — token_balances table DDL
```

---

## Vercel Environment Variables
```
SUPABASE_URL                = https://gfvnzzgvopcolmkfyuyl.supabase.co
SUPABASE_SERVICE_ROLE_KEY   = (service role key, not anon)
DEEPSEEK_API_KEY            = sk-...
JWT_SECRET                  = (random 32+ char string)
FREE_PASSPHRASES            = word1,word2,...
PRO_PASSPHRASES             = proword1,...
MAX_PASSPHRASES             = vipword1,...
```

## Supabase tables
```sql
-- token_balances (exists)
CREATE TABLE token_balances (
  passphrase_hash TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK (tier IN ('free','pro','max')),
  balance INTEGER NOT NULL,
  reset_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Features built so far
1. **Passphrase auth** — tier-based (free/pro/max), monthly token resets
2. **BaZi chart calculation** — 4 pillars, day master, luck cycles
3. **True Solar Time correction** — city search (Nominatim) + timezone (timeapi.io)
   - Formula: `(longitude − utcOffset×15) × 4 minutes`
   - Verified against MingLi.info: Almaty = −52.595 min ✅
4. **AI daily reading** — DeepSeek, 50 tokens
5. **AI luck check** — DeepSeek, 20 tokens
6. **3 Themes** — Dark (default) / Daylight (parchment) / Neon (purple/fuchsia)
   - Implemented via Tailwind v4 CSS variable overrides per `[data-theme]`
7. **AI thinking indicator** — ThinkingOrb + AiStatusBadge (like JobSensei)
8. **Token system** — Supabase, monthly reset, tier limits
9. **Multi-language** — Bulgarian / Russian / English
10. **Bug fix** — `lunar-javascript` uses `getTimeGan()`/`getTimeZhi()`, not `getHour*`

---

## Planned next: BaZi Knowledge Scraper Agent

### Goal
Build an automated knowledge extraction pipeline:
- Scrape BaZi articles → DeepSeek extracts structured rules → store in Supabase
- RAG injection: on each reading, look up relevant rules and add to system prompt
- Makes AI readings accurate per classical school, not just training data

### Target sites
1. **fourpillars.ru** — classical Russian BaZi
   - Sections to scrape: /articles, /sections/1 through /sections/9
2. **mingli.info** — comprehensive calculator + articles (Russian/English)

### Architecture
```
GitHub Actions cron (weekly)
  → scraper: fetch pages from target sites
  → DeepSeek: extract structured rules as JSON
  → Supabase: store in bazi_knowledge table

On each reading:
  → query bazi_knowledge by matching stems/branches
  → inject top 3-5 rules into DeepSeek system prompt
```

### Supabase table (to be created)
```sql
CREATE TABLE bazi_knowledge (
  id           SERIAL PRIMARY KEY,
  pattern      TEXT,       -- e.g. "Geng+Chen" or "year_self_punishment"
  rule_text    TEXT,       -- extracted rule in clear language
  school       TEXT,       -- "classical", "dong_gong", "joey_yap", etc.
  source_url   TEXT,
  confidence   TEXT,       -- "high" | "medium" | "low"
  tags         TEXT[],     -- ["clash", "year", "day_master"]
  lang         TEXT,       -- "ru" | "en"
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Cost estimate
| Task | Cost |
|------|------|
| Scrape + extract ~500 rules | ~$0.20 (DeepSeek) |
| Each reading with RAG context | ~$0.001 |
| 1000 readings/month | ~$3/month |

### Running
- Infrastructure: **GitHub Actions** (free, already have repo)
- Schedule: weekly cron
- No extra server/phone needed

---

## Planned: Admin Panel (after questionnaire from mom)
- Protected by `ADMIN_PASSPHRASE` env var
- UI inside the app (Settings → Admin)
- Practitioner config stored in Supabase `ai_config` table:
  - School/lineage preference
  - Calendar rules (Sun calendar, Joined Rat Hour, Prenatal year)
  - Sacred rules ("year clash = never recommend")
  - Conflict resolution hierarchy
  - Interpretation style (strict/mystical/practical)
- Injected server-side into every DeepSeek system prompt
- Config values NOT in GitHub (stored in Supabase only)

---

## Key notes / decisions
- **No Upstash** — switched to Supabase (already used in other projects)
- **lunar-javascript** method names: `getTimeGan()` / `getTimeZhi()` for hour pillar (NOT `getHourGan`)
- **Geography verified**: our solar time formula matches MingLi.info exactly (Almaty: −52.595 min)
- **GitHub is public** — all secrets in Vercel env vars, config values in Supabase
- **No keep-alive needed** with Supabase (Postgres vs Redis)
- **DeepSeek** used for all AI (cheap: ~$0.001/reading)
