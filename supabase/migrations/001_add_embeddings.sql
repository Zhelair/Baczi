-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to bazi_knowledge
ALTER TABLE bazi_knowledge
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat index for fast approximate nearest-neighbor cosine search
-- lists = 100 is a good default for ~4000-10000 rows
CREATE INDEX IF NOT EXISTS bazi_knowledge_embedding_idx
  ON bazi_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- RPC function: semantic similarity search over bazi_knowledge
-- Returns top match_count rows ordered by cosine similarity (closest first)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding   vector(1536),
  match_count       int     DEFAULT 25,
  confidence_filter text[]  DEFAULT ARRAY['high', 'medium']
)
RETURNS TABLE (
  id          bigint,
  pattern     text,
  rule_text   text,
  school      text,
  confidence  text,
  tags        text[],
  similarity  float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    pattern,
    rule_text,
    school,
    confidence,
    tags,
    1 - (embedding <=> query_embedding) AS similarity
  FROM bazi_knowledge
  WHERE embedding IS NOT NULL
    AND confidence = ANY(confidence_filter)
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
