-- Investor Updates: periodic round updates sent to investors with view tracking.

CREATE TABLE investor_updates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id        UUID NOT NULL REFERENCES financing_rounds(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 300),
  body            TEXT NOT NULL,
  -- Snapshot of key metrics at time of send
  mrr_sar         NUMERIC(18,2),
  runway_months   NUMERIC(4,1),
  highlights      TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  -- Unique public token for anonymous link sharing
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE investor_update_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id   UUID NOT NULL REFERENCES investor_updates(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT
);

CREATE INDEX investor_updates_round_id_idx ON investor_updates (round_id) WHERE deleted_at IS NULL;
CREATE INDEX investor_update_views_update_id_idx ON investor_update_views (update_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_investor_updates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER investor_updates_updated_at
  BEFORE UPDATE ON investor_updates
  FOR EACH ROW EXECUTE FUNCTION set_investor_updates_updated_at();

-- RLS: workspace members manage their updates
ALTER TABLE investor_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_update_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members manage investor_updates"
  ON investor_updates FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Views: workspace members can read; anonymous inserts go via RPC
CREATE POLICY "workspace members read update_views"
  ON investor_update_views FOR SELECT
  USING (
    update_id IN (
      SELECT id FROM investor_updates
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
    )
  );

-- Public RPC to record a view without auth
CREATE OR REPLACE FUNCTION record_investor_update_view(
  p_token       TEXT,
  p_user_agent  TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_update_id UUID;
BEGIN
  SELECT id INTO v_update_id
  FROM investor_updates
  WHERE token = p_token AND status = 'published' AND deleted_at IS NULL;
  IF v_update_id IS NULL THEN RETURN; END IF;
  INSERT INTO investor_update_views (update_id, user_agent)
  VALUES (v_update_id, p_user_agent);
END;
$$;
REVOKE ALL ON FUNCTION record_investor_update_view(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_investor_update_view(TEXT, TEXT) TO anon, authenticated;
