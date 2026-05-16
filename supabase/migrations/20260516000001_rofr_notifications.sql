-- rofr_notifications: per-shareholder ROFR (Right of First Refusal) record
-- when a share_listing is created. Each existing shareholder in the workspace
-- gets one row; responses are 'exercise' (intends to buy), 'decline', or
-- 'no_response' (the lazy default if window_expires_at passes with no action).
-- Per eng review T2 + A4 (lazy expiry): no scheduled job needed — recordResponse
-- and the listing-detail page resolve "no_response" on read against NOW() vs
-- window_expires_at.

CREATE TABLE IF NOT EXISTS rofr_notifications (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  listing_id                  UUID        NOT NULL REFERENCES share_listings(id) ON DELETE CASCADE,
  notified_shareholder_id     UUID        NOT NULL REFERENCES shareholders(id) ON DELETE RESTRICT,
  notified_email              TEXT,
  window_expires_at           TIMESTAMPTZ NOT NULL,
  response                    TEXT        CHECK (response IN ('exercise', 'decline')),
  responded_at                TIMESTAMPTZ,
  responded_by_user_id        UUID        REFERENCES auth.users(id),
  email_sent_at               TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, notified_shareholder_id)
);

CREATE INDEX IF NOT EXISTS rofr_notifications_listing_idx
  ON rofr_notifications (listing_id);
CREATE INDEX IF NOT EXISTS rofr_notifications_workspace_idx
  ON rofr_notifications (workspace_id, window_expires_at);
CREATE INDEX IF NOT EXISTS rofr_notifications_pending_idx
  ON rofr_notifications (listing_id) WHERE response IS NULL;

COMMENT ON TABLE rofr_notifications IS
  'ROFR notification per existing shareholder. response NULL + window_expires_at < now() means lazy no_response.';
COMMENT ON COLUMN rofr_notifications.response IS
  'NULL while pending. Effective status derived: response OR (window_expires_at < now() ? no_response : pending).';

-- No deleted_at: ROFR notifications are an immutable audit trail of who was
-- notified and when. Use cascade from share_listings if a listing is force-deleted.

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE rofr_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rofr_notifications_owner_all"
  ON rofr_notifications FOR ALL TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "rofr_notifications_member_read"
  ON rofr_notifications FOR SELECT TO authenticated
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));

-- ── updated_at trigger ─────────────────────────────────────────────────────

CREATE TRIGGER rofr_notifications_updated_at
  BEFORE UPDATE ON rofr_notifications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
