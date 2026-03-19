-- Run this in your Supabase SQL editor after migrations.sql

CREATE TABLE IF NOT EXISTS bazi_knowledge (
  id           SERIAL PRIMARY KEY,
  pattern      TEXT        NOT NULL,  -- e.g. "Geng+Chen" or "year_self_punishment"
  rule_text    TEXT        NOT NULL,  -- extracted rule in clear language (English)
  school       TEXT        NOT NULL DEFAULT 'unknown',  -- "classical", "dong_gong", "joey_yap", etc.
  source_url   TEXT        NOT NULL,
  confidence   TEXT        NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  tags         TEXT[]      NOT NULL DEFAULT '{}',  -- ["Geng", "Chen", "clash", "day_master"]
  lang         TEXT        NOT NULL DEFAULT 'ru',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for upsert (no duplicate rules from same source)
CREATE UNIQUE INDEX IF NOT EXISTS bazi_knowledge_pattern_source
  ON bazi_knowledge (pattern, source_url);

-- GIN index for fast array overlap queries (tags && ARRAY['Jia', 'Chen'])
CREATE INDEX IF NOT EXISTS bazi_knowledge_tags_gin
  ON bazi_knowledge USING GIN (tags);

-- No RLS needed — only accessed via service role key from serverless functions
