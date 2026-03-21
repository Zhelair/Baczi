-- GIN index on tags array for fast overlaps (&&) queries
-- Without this, every .overlaps('tags', ...) does a full table scan of all rows
CREATE INDEX IF NOT EXISTS bazi_knowledge_tags_gin_idx
  ON bazi_knowledge
  USING gin (tags);
