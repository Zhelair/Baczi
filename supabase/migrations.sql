-- Run this once in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS token_balances (
  passphrase_hash TEXT PRIMARY KEY,
  tier            TEXT    NOT NULL CHECK (tier IN ('free', 'pro', 'max', 'admin')),
  balance         INTEGER NOT NULL,
  reset_date      DATE    NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- App config table — admin-editable JSON settings for AI and BaZi tuning
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default config (safe to re-run)
INSERT INTO app_config (key, value) VALUES
  ('ai', '{
    "model": "deepseek-chat",
    "temperature": 0.7,
    "maxTokens": 1500,
    "systemPromptExtra": ""
  }'::jsonb),
  ('bazi', '{
    "tokenCosts": { "daily_reading": 50, "luck_check": 20, "lucky_dates": 30 },
    "monthlyTokens": { "free": 500, "pro": 2000, "max": 10000, "admin": 999999 },
    "knowledgeLimit": 6,
    "confidenceLevels": ["high", "medium"]
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- No RLS needed — only accessed via service role key from serverless functions
