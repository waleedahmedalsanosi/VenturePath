-- Valuation Tool sessions (PRD EP-08).
-- Always Internal — no member-SELECT policy. Owner-only across the board.

CREATE TYPE valuation_methodology AS ENUM (
  'revenue_multiple', 'scorecard', 'berkus', 'dcf'
);

CREATE TABLE valuation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label           TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 120),
  methodology     valuation_methodology NOT NULL,
  inputs          JSONB NOT NULL,
  result_low_sar  NUMERIC(20, 2),
  result_mid_sar  NUMERIC(20, 2),
  result_high_sar NUMERIC(20, 2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX valuation_sessions_workspace_idx
  ON valuation_sessions (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

ALTER TABLE valuation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY valuation_select_owner ON valuation_sessions FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY valuation_insert_owner ON valuation_sessions FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY valuation_update_owner ON valuation_sessions FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY valuation_delete_owner ON valuation_sessions FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
