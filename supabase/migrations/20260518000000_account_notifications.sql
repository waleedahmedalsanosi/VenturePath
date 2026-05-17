-- account_notifications: aggregated in-app notification feed.
-- Per REQ-PLAT-01 (2026-05-18). Triggers populate this from:
--   connection_inquiries → inquiry_received / inquiry_accepted / inquiry_declined
--   rofr_notifications   → rofr_notified
--   investor_update_views → investor_update_opened
--
-- NOTE: compliance_overdue + round_visibility_changed types are reserved in the
-- CHECK but have no triggers yet (forward-compat per spec). Their triggers will
-- be added in a future migration.

-- ── Table ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS account_notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN (
    'inquiry_received',
    'inquiry_accepted',
    'inquiry_declined',
    'rofr_notified',
    'investor_update_opened',
    'compliance_overdue',
    'round_visibility_changed'
  )),
  title       TEXT        NOT NULL,
  url         TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  entity_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index: per-user unread (badge count query)
CREATE INDEX IF NOT EXISTS account_notifications_unread_idx
  ON account_notifications (user_id, is_read)
  WHERE is_read = FALSE;

-- Index: per-user recency (popover "last 20" query, regardless of read state)
CREATE INDEX IF NOT EXISTS account_notifications_recency_idx
  ON account_notifications (user_id, created_at DESC);

COMMENT ON TABLE account_notifications IS
  'Aggregated notification feed. Rows are written by SECURITY DEFINER trigger functions; users may only SELECT/UPDATE their own rows via RLS.';

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE account_notifications ENABLE ROW LEVEL SECURITY;

-- Users may read only their own notifications.
CREATE POLICY "account_notifications_own_select"
  ON account_notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users may mark their own notifications as read.
CREATE POLICY "account_notifications_own_update"
  ON account_notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- No INSERT/DELETE policies: all writes go through SECURITY DEFINER triggers.

-- ── Trigger: notify_on_inquiry_received ────────────────────────────────────
-- Fires AFTER INSERT on connection_inquiries.
-- Notifies the listing owner that someone has sent them an inquiry.

CREATE OR REPLACE FUNCTION notify_on_inquiry_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_user_id UUID;
BEGIN
  SELECT cl.owner_user_id
    INTO v_owner_user_id
    FROM connection_listings cl
    WHERE cl.id = NEW.listing_id;

  IF v_owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO account_notifications (user_id, type, title, url, entity_id)
  VALUES (
    v_owner_user_id,
    'inquiry_received',
    'New inquiry on your listing',
    '/connections',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_inquiry_received
  AFTER INSERT ON connection_inquiries
  FOR EACH ROW EXECUTE FUNCTION notify_on_inquiry_received();

-- ── Trigger: notify_on_inquiry_accepted_or_declined ────────────────────────
-- Fires AFTER UPDATE OF status on connection_inquiries.
-- Notifies the inquirer when their inquiry is accepted or declined.

CREATE OR REPLACE FUNCTION notify_on_inquiry_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_type  TEXT;
  v_title TEXT;
BEGIN
  -- Only act when status transitions from 'sent' to 'accepted' or 'declined'.
  IF OLD.status <> 'sent' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'accepted' THEN
    v_type  := 'inquiry_accepted';
    v_title := 'Your inquiry was accepted';
  ELSIF NEW.status = 'declined' THEN
    v_type  := 'inquiry_declined';
    v_title := 'Your inquiry was not accepted';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO account_notifications (user_id, type, title, url, entity_id)
  VALUES (
    NEW.inquirer_user_id,
    v_type,
    v_title,
    '/connections',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_inquiry_status_change
  AFTER UPDATE OF status ON connection_inquiries
  FOR EACH ROW EXECUTE FUNCTION notify_on_inquiry_status_change();

-- ── Trigger: notify_on_rofr ────────────────────────────────────────────────
-- Fires AFTER INSERT on rofr_notifications.
-- Looks up the auth.users row by notified_email (direct lookup, no
-- shareholders join — per the bug-fix in REQ-PLAT-01 spec).
-- If no matching auth user exists, skips silently (shareholder may not have
-- an account yet).

CREATE OR REPLACE FUNCTION notify_on_rofr()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NEW.notified_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = NEW.notified_email
    LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO account_notifications (user_id, type, title, url, entity_id)
  VALUES (
    v_user_id,
    'rofr_notified',
    'Right of first refusal — action required',
    '/marketplace',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_rofr
  AFTER INSERT ON rofr_notifications
  FOR EACH ROW EXECUTE FUNCTION notify_on_rofr();

-- ── Trigger: notify_on_investor_update_view ────────────────────────────────
-- Fires AFTER INSERT on investor_update_views.
-- Notifies the workspace owner that their investor update was opened.

CREATE OR REPLACE FUNCTION notify_on_investor_update_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_user_id UUID;
  v_update_id     UUID;
BEGIN
  -- Join through investor_updates → workspaces to get the workspace owner.
  SELECT w.owner_user_id, iu.id
    INTO v_owner_user_id, v_update_id
    FROM investor_updates iu
    JOIN workspaces w ON w.id = iu.workspace_id
    WHERE iu.id = NEW.update_id;

  IF v_owner_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO account_notifications (user_id, type, title, url, entity_id)
  VALUES (
    v_owner_user_id,
    'investor_update_opened',
    'Your investor update was opened',
    '/investor-updates',
    NEW.update_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_investor_update_view
  AFTER INSERT ON investor_update_views
  FOR EACH ROW EXECUTE FUNCTION notify_on_investor_update_view();
