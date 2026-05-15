-- ── Pipeline enhancements ───────────────────────────────────────────────────
-- Adds ticket size and hot-lead flag to investor_pipeline.

ALTER TABLE investor_pipeline
  ADD COLUMN IF NOT EXISTS ticket_size_sar NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS is_hot          BOOLEAN NOT NULL DEFAULT false;
