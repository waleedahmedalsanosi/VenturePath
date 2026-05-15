-- financing_rounds: tracks each fundraising round end-to-end.
-- Rounds group investors together and drive the close event that auto-converts
-- outstanding iSAFEs / SAFEs to ordinary shares.

CREATE TABLE IF NOT EXISTS financing_rounds (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                    TEXT        NOT NULL,
  status                  TEXT        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'open', 'closed')),
  instrument_type         TEXT        NOT NULL DEFAULT 'isafe'
                          CHECK (instrument_type IN ('isafe', 'safe', 'convertible_note', 'ordinary')),
  pre_money_valuation_sar NUMERIC,
  target_raise_sar        NUMERIC,
  actual_raise_sar        NUMERIC,
  fd_shares_pre_round     NUMERIC,
  lead_investor           TEXT,
  close_date              DATE,
  board_resolution_id     UUID        REFERENCES resolutions(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ
);

-- Link each investor/shareholder row to the round they joined in.
ALTER TABLE shareholders
  ADD COLUMN IF NOT EXISTS funding_round_id UUID REFERENCES financing_rounds(id);

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE financing_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financing_rounds_owner_all"
  ON financing_rounds
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "financing_rounds_member_read"
  ON financing_rounds
  FOR SELECT
  TO authenticated
  USING (user_can_access_workspace(workspace_id));

-- ── updated_at trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_financing_rounds_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER financing_rounds_updated_at
  BEFORE UPDATE ON financing_rounds
  FOR EACH ROW EXECUTE FUNCTION set_financing_rounds_updated_at();
