-- REQ-INV-03: per-recipient tracking for investor updates.
-- Adds investor_update_recipients table + updated record_investor_update_view
-- to optionally mark opened_at when viewer's email is supplied via ?r= param.
-- investor_update_views (anonymous view counts) is kept untouched.

CREATE TABLE investor_update_recipients (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id          UUID        NOT NULL REFERENCES investor_updates(id) ON DELETE CASCADE,
  email              TEXT        NOT NULL,
  name               TEXT,
  sent_at            TIMESTAMPTZ,
  opened_at          TIMESTAMPTZ,
  resend_message_id  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT investor_update_recipients_update_email_key UNIQUE (update_id, email)
);

CREATE INDEX investor_update_recipients_update_id_idx
  ON investor_update_recipients (update_id);

ALTER TABLE investor_update_recipients ENABLE ROW LEVEL SECURITY;

-- Workspace members can SELECT their recipients (joined through investor_updates).
CREATE POLICY "workspace members read investor_update_recipients"
  ON investor_update_recipients FOR SELECT
  USING (
    update_id IN (
      SELECT id FROM investor_updates
      WHERE public.user_can_access_workspace(workspace_id)
    )
  );

-- Workspace members can INSERT/UPDATE their own recipients (send + re-send flows).
CREATE POLICY "workspace members write investor_update_recipients"
  ON investor_update_recipients FOR ALL
  USING (
    update_id IN (
      SELECT id FROM investor_updates
      WHERE public.user_can_access_workspace(workspace_id)
    )
  )
  WITH CHECK (
    update_id IN (
      SELECT id FROM investor_updates
      WHERE public.user_can_access_workspace(workspace_id)
    )
  );

-- Extend record_investor_update_view to optionally mark opened_at
-- when the recipient email is supplied (best-effort, no error if not found).
CREATE OR REPLACE FUNCTION record_investor_update_view(
  p_token       TEXT,
  p_user_agent  TEXT    DEFAULT NULL,
  p_email       TEXT    DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_update_id UUID;
BEGIN
  SELECT id INTO v_update_id
  FROM investor_updates
  WHERE token = p_token AND status = 'published' AND deleted_at IS NULL;
  IF v_update_id IS NULL THEN RETURN; END IF;

  -- Always record the anonymous view (existing behaviour).
  INSERT INTO investor_update_views (update_id, user_agent)
  VALUES (v_update_id, p_user_agent);

  -- Best-effort: if we know the recipient email, stamp opened_at.
  IF p_email IS NOT NULL THEN
    UPDATE investor_update_recipients
    SET opened_at = now()
    WHERE update_id = v_update_id
      AND email    = p_email
      AND opened_at IS NULL;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION record_investor_update_view(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_investor_update_view(TEXT, TEXT, TEXT) TO anon, authenticated;
