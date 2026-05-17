-- Migration: settings_infra
-- Adds date_format + timezone to user_profiles, account_deletion_requests table,
-- and user_notification_preferences table.
--
-- Migration path for existing callsites:
--   Existing new Date().toLocaleDateString() calls are NOT rewritten here.
--   Use lib/date/format.ts formatDate(date, userPrefs) in new code.
--   A v2 task should thread userPrefs through page-level data loaders and
--   replace ad-hoc toLocaleDateString calls.

-- ── 1. Extend user_profiles ──────────────────────────────────────────────────
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS date_format TEXT NOT NULL DEFAULT 'iso'
    CHECK (date_format IN ('iso', 'us', 'eu')),
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh';

-- ── 2. account_deletion_requests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'cancelled')),
  processed_at  TIMESTAMPTZ,
  processed_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users may only INSERT their own row (no UPDATE / DELETE — that's admin only).
CREATE POLICY "users insert own deletion request"
  ON public.account_deletion_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users may SELECT their own row so the UI can show "request received" state.
CREATE POLICY "users read own deletion request"
  ON public.account_deletion_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ── 3. user_notification_preferences ─────────────────────────────────────────
-- One row per (user_id, notification_type).
-- Types mirror account_notifications.type enum values.
-- NOTE: Existing notification triggers do NOT yet check this table.
--   Honoring these preferences at send-time is a v2 item.
--   This table lets users SET preferences now; enforcement ships later.

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN (
      'inquiry_received',
      'inquiry_accepted',
      'inquiry_declined',
      'rofr_notified',
      'investor_update_opened',
      'compliance_overdue',
      'round_visibility_changed'
    )),
  email_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  inapp_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_type)
);

ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own notification prefs"
  ON public.user_notification_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
