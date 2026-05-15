-- ── Investor CRM / pipeline ────────────────────────────────────────────────
-- Tracks investor conversations during an open round.

CREATE TABLE investor_pipeline (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id         UUID        NOT NULL REFERENCES financing_rounds(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  email            TEXT,
  firm             TEXT,
  status           TEXT        NOT NULL DEFAULT 'prospect'
                   CHECK (status IN ('prospect','contacted','in_discussion','term_sheet','passed','invested')),
  notes            TEXT,
  last_contacted_at DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ
);

ALTER TABLE investor_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investor_pipeline_owner_all"
  ON investor_pipeline FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "investor_pipeline_member_read"
  ON investor_pipeline FOR SELECT TO authenticated
  USING (user_can_access_workspace(workspace_id));

CREATE OR REPLACE FUNCTION set_investor_pipeline_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER investor_pipeline_updated_at
  BEFORE UPDATE ON investor_pipeline
  FOR EACH ROW EXECUTE FUNCTION set_investor_pipeline_updated_at();

-- ── Data room links ─────────────────────────────────────────────────────────
-- Token-gated public pages that show a round's data_room-visibility documents.

CREATE TABLE data_room_links (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id     UUID        REFERENCES financing_rounds(id) ON DELETE SET NULL,
  token        TEXT        NOT NULL UNIQUE
               DEFAULT encode(gen_random_bytes(18), 'base64url'),
  label        TEXT        NOT NULL DEFAULT 'Investor Link',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  view_count   INTEGER     NOT NULL DEFAULT 0,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE data_room_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "data_room_links_owner_all"
  ON data_room_links FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()));

-- Public helper: resolves a token to workspace metadata + documents.
-- SECURITY DEFINER bypasses RLS so unauthenticated visitors can read.
CREATE OR REPLACE FUNCTION get_data_room(p_token text)
RETURNS TABLE (
  workspace_name  text,
  round_name      text,
  round_status    text,
  doc_id          uuid,
  doc_name        text,
  doc_size_bytes  bigint,
  doc_mime_type   text,
  doc_created_at  timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT
    w.name           AS workspace_name,
    r.name           AS round_name,
    r.status         AS round_status,
    d.id             AS doc_id,
    d.name           AS doc_name,
    d.size_bytes     AS doc_size_bytes,
    d.mime_type      AS doc_mime_type,
    d.created_at     AS doc_created_at
  FROM data_room_links l
  JOIN workspaces w ON w.id = l.workspace_id
  LEFT JOIN financing_rounds r ON r.id = l.round_id
  LEFT JOIN documents d
    ON d.workspace_id = l.workspace_id
    AND d.visibility IN ('data_room','public')
    AND d.deleted_at IS NULL
  WHERE l.token = p_token
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > NOW())
  ORDER BY d.created_at ASC;
$$;

-- Increment view counter — also called without auth from public page.
CREATE OR REPLACE FUNCTION record_data_room_view(p_token text)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  UPDATE data_room_links
  SET view_count = view_count + 1
  WHERE token = p_token
    AND is_active = true;
$$;
