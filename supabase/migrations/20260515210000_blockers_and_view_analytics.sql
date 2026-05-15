-- ── Round blockers ──────────────────────────────────────────────────────────
-- Punch list of items preventing round close. Founder marks each as resolved
-- when handled. Persists for audit; soft-deletable.

CREATE TABLE round_blockers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  round_id     UUID        NOT NULL REFERENCES financing_rounds(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  resolved     BOOLEAN     NOT NULL DEFAULT false,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE round_blockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "round_blockers_owner_all"
  ON round_blockers FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid()));

CREATE POLICY "round_blockers_member_read"
  ON round_blockers FOR SELECT TO authenticated
  USING (user_can_access_workspace(workspace_id));

CREATE OR REPLACE FUNCTION set_round_blockers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE TRIGGER round_blockers_updated_at
  BEFORE UPDATE ON round_blockers
  FOR EACH ROW EXECUTE FUNCTION set_round_blockers_updated_at();

-- ── Data room view analytics ────────────────────────────────────────────────
-- Per-visit log for data_room_links. The aggregate `view_count` on
-- data_room_links is kept as a fast counter; this table captures detail
-- (when, optional user agent) for engagement analytics.

CREATE TABLE data_room_views (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id     UUID        NOT NULL REFERENCES data_room_links(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent  TEXT
);

CREATE INDEX data_room_views_link_viewed_idx
  ON data_room_views(link_id, viewed_at DESC);

ALTER TABLE data_room_views ENABLE ROW LEVEL SECURITY;

-- Views are inserted via SECURITY DEFINER RPC; reads are owner-scoped via the
-- parent link's workspace.
CREATE POLICY "data_room_views_owner_read"
  ON data_room_views FOR SELECT TO authenticated
  USING (
    link_id IN (
      SELECT id FROM data_room_links
      WHERE workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = auth.uid())
    )
  );

-- Replace record_data_room_view to also append a row to data_room_views.
CREATE OR REPLACE FUNCTION record_data_room_view(p_token text, p_user_agent text DEFAULT NULL)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_link_id UUID;
BEGIN
  UPDATE data_room_links
  SET view_count = view_count + 1
  WHERE token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING id INTO v_link_id;

  IF v_link_id IS NOT NULL THEN
    INSERT INTO data_room_views (link_id, user_agent)
    VALUES (v_link_id, p_user_agent);
  END IF;
END;
$$;
