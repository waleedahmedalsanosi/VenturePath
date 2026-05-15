-- Closing & Legal: per-round items tracking KYC/AML, subscription agreements,
-- wires, share certs, and board sign-off.

CREATE TYPE closing_item_category AS ENUM (
  'kyc_aml',
  'subscription_agreement',
  'wire_confirmation',
  'share_certificate',
  'board_approval',
  'other'
);

CREATE TYPE closing_item_status AS ENUM (
  'pending',
  'in_progress',
  'complete',
  'waived'
);

CREATE TABLE closing_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id             UUID NOT NULL REFERENCES financing_rounds(id) ON DELETE CASCADE,
  -- Optional: link to a specific investor in the pipeline
  pipeline_contact_id  UUID REFERENCES investor_pipeline(id) ON DELETE SET NULL,
  category             closing_item_category NOT NULL,
  title                TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  status               closing_item_status NOT NULL DEFAULT 'pending',
  notes                TEXT,
  completed_at         TIMESTAMPTZ,
  due_date             DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX closing_items_round_id_idx ON closing_items (round_id) WHERE deleted_at IS NULL;
CREATE INDEX closing_items_workspace_id_idx ON closing_items (workspace_id) WHERE deleted_at IS NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_closing_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER closing_items_updated_at
  BEFORE UPDATE ON closing_items
  FOR EACH ROW EXECUTE FUNCTION set_closing_items_updated_at();

-- RLS
ALTER TABLE closing_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members manage closing_items"
  ON closing_items
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );
