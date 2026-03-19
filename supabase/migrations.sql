-- Run this once in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS token_balances (
  passphrase_hash TEXT PRIMARY KEY,
  tier            TEXT    NOT NULL CHECK (tier IN ('free', 'pro', 'max')),
  balance         INTEGER NOT NULL,
  reset_date      DATE    NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS needed — only accessed via service role key from serverless functions
