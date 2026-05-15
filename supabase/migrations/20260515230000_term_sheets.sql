-- ── Term sheets ─────────────────────────────────────────────────────────────
-- Pre-signature record of agreed terms with an investor for a specific round.
-- Mirrors the shareholders.instrument_data shape so that a signed term sheet
-- can be promoted to a shareholder record cleanly.

CREATE TYPE term_sheet_status AS ENUM ('draft', 'sent', 'signed', 'declined', 'withdrawn');

CREATE TABLE term_sheets (
  id                   UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID              NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id             UUID              NOT NULL REFERENCES financing_rounds(id) ON DELETE CASCADE,
  pipeline_contact_id  UUID              REFERENCES investor_pipeline(id) ON DELETE SET NULL,
  investor_name        TEXT              NOT NULL,
  investor_email       TEXT,
  firm                 TEXT,
  instrument_type      TEXT              NOT NULL
                       CHECK (instrument_type IN ('isafe','safe','convertible_note','ordinary')),
  terms                JSONB             NOT NULL DEFAULT '{}'::jsonb,
  status               term_sheet_status NOT NULL DEFAULT 'draft',
  version              INTEGER           NOT NULL DEFAULT 1,
  notes                TEXT,
  sent_at              TIMESTAMPTZ,
  signed_at            TIMESTAMPTZ,
  created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX term_sheets_round_idx ON term_sheets(round_id) WHERE deleted_at IS NULL;
CREATE INDEX term_sheets_workspace_idx ON term_sheets(workspace_id) WHERE deleted_at IS NULL;

ALTER TABLE term_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "term_sheets_owner_all"
  ON term_sheets FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "term_sheets_member_read"
  ON term_sheets FOR SELECT TO authenticated
  USING (user_can_access_workspace(workspace_id));

CREATE OR REPLACE FUNCTION set_term_sheets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER term_sheets_updated_at
  BEFORE UPDATE ON term_sheets
  FOR EACH ROW EXECUTE FUNCTION set_term_sheets_updated_at();
