-- pgTAP suite: account_notifications table + trigger behavior + RLS.
-- Per REQ-PLAT-01. 7 cases.
--
-- Run locally: supabase db reset && psql ... -f supabase/tests/account_notifications.sql

BEGIN;

SELECT plan(7);

-- ── Seed ───────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('a1110001-0000-0000-0000-000000000000', 'notif_alice@test.local', '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('a2220002-0000-0000-0000-000000000000', 'notif_bob@test.local',   '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('a3330003-0000-0000-0000-000000000000', 'notif_inv@test.local',   '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated');

INSERT INTO workspaces (id, name, owner_user_id, entity_status, country, city, sector, funding_stage, one_liner)
VALUES
  ('b1110001-0000-0000-0000-000000000000', 'NotifAlice Co', 'a1110001-0000-0000-0000-000000000000', 'product_only', 'SA', 'Riyadh', 'fintech', 'pre_seed', 'Test workspace'),
  ('b2220002-0000-0000-0000-000000000000', 'NotifBob Co',   'a2220002-0000-0000-0000-000000000000', 'product_only', 'SA', 'Riyadh', 'fintech', 'pre_seed', 'Test workspace');

INSERT INTO shareholders (id, workspace_id, name, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES ('c1110001-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'Alice Founder', 'individual', '2026-01-01', 'ordinary', '{"shares":"100000","price_per_share_sar":"1"}'::jsonb);

INSERT INTO connection_listings (id, workspace_id, owner_user_id, listing_type, public_summary, type_data)
VALUES ('d1110001-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'a1110001-0000-0000-0000-000000000000', 'exit', 'Test exit listing', '{"ask_type":"open_to_offers"}'::jsonb);

-- ── Case 1: inquiry_received creates notification for listing owner ─────────

INSERT INTO connection_inquiries (id, listing_id, inquirer_user_id, inquirer_workspace_id, message)
VALUES ('e1110001-0000-0000-0000-000000000000', 'd1110001-0000-0000-0000-000000000000', 'a2220002-0000-0000-0000-000000000000', 'b2220002-0000-0000-0000-000000000000', 'Interested');

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications
    WHERE user_id = 'a1110001-0000-0000-0000-000000000000'
      AND type = 'inquiry_received'
      AND entity_id = 'e1110001-0000-0000-0000-000000000000'),
  1,
  'inquiry INSERT creates inquiry_received notification for listing owner'
);

-- ── Case 2: inquiry status → accepted creates inquiry_accepted for inquirer ─

UPDATE connection_inquiries SET status = 'accepted' WHERE id = 'e1110001-0000-0000-0000-000000000000';

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications
    WHERE user_id = 'a2220002-0000-0000-0000-000000000000'
      AND type = 'inquiry_accepted'
      AND entity_id = 'e1110001-0000-0000-0000-000000000000'),
  1,
  'inquiry status → accepted creates inquiry_accepted notification for inquirer'
);

-- ── Case 3: inquiry status → declined creates inquiry_declined for inquirer ─

INSERT INTO connection_inquiries (id, listing_id, inquirer_user_id, inquirer_workspace_id, message, status)
VALUES ('e2220002-0000-0000-0000-000000000000', 'd1110001-0000-0000-0000-000000000000', 'a3330003-0000-0000-0000-000000000000', 'b2220002-0000-0000-0000-000000000000', 'Investor inquiry', 'sent');

UPDATE connection_inquiries
  SET status = 'declined', responded_at = NOW(), closed_at = NOW(),
      closed_reason = 'not a fit', closed_by_user_id = 'a1110001-0000-0000-0000-000000000000'
  WHERE id = 'e2220002-0000-0000-0000-000000000000';

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications
    WHERE user_id = 'a3330003-0000-0000-0000-000000000000'
      AND type = 'inquiry_declined'
      AND entity_id = 'e2220002-0000-0000-0000-000000000000'),
  1,
  'inquiry status → declined creates inquiry_declined notification for inquirer'
);

-- ── Case 4: rofr INSERT creates rofr_notified for matching auth user ────────

INSERT INTO share_listings (id, workspace_id, shareholder_id, seller_user_id, shares_offered, ask_price_sar, status, expires_at)
VALUES ('f1110001-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'c1110001-0000-0000-0000-000000000000', 'a1110001-0000-0000-0000-000000000000', 10000, 10, 'open', NOW() + INTERVAL '30 days');

INSERT INTO rofr_notifications (id, workspace_id, listing_id, notified_shareholder_id, notified_email, window_expires_at)
VALUES ('f2220002-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'f1110001-0000-0000-0000-000000000000', 'c1110001-0000-0000-0000-000000000000', 'notif_bob@test.local', NOW() + INTERVAL '7 days');

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications
    WHERE user_id = 'a2220002-0000-0000-0000-000000000000'
      AND type = 'rofr_notified'
      AND entity_id = 'f2220002-0000-0000-0000-000000000000'),
  1,
  'rofr_notifications INSERT creates rofr_notified for matching auth user by email'
);

-- ── Case 5: investor_update_views INSERT creates notification for workspace owner

INSERT INTO financing_rounds (id, workspace_id, name, status, instrument_type)
VALUES ('f3330003-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'Seed', 'open', 'safe');

INSERT INTO investor_updates (id, workspace_id, round_id, subject, body, status)
VALUES ('f4440004-0000-0000-0000-000000000000', 'b1110001-0000-0000-0000-000000000000', 'f3330003-0000-0000-0000-000000000000', 'Q1 Update', 'Things going well.', 'published');

INSERT INTO investor_update_views (update_id, user_agent)
VALUES ('f4440004-0000-0000-0000-000000000000', 'Mozilla/5.0 test');

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications
    WHERE user_id = 'a1110001-0000-0000-0000-000000000000'
      AND type = 'investor_update_opened'
      AND entity_id = 'f4440004-0000-0000-0000-000000000000'),
  1,
  'investor_update_views INSERT creates investor_update_opened for workspace owner'
);

-- ── Case 6: RLS — user sees own notifications ───────────────────────────────

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"a1110001-0000-0000-0000-000000000000","role":"authenticated"}';

SELECT ok(
  (SELECT COUNT(*) FROM account_notifications) > 0,
  'authenticated user can read own notifications'
);

-- ── Case 7: RLS — user cannot see other users notifications ────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"a2220002-0000-0000-0000-000000000000","role":"authenticated"}';

SELECT is(
  (SELECT COUNT(*)::int FROM account_notifications WHERE user_id = 'a1110001-0000-0000-0000-000000000000'),
  0,
  'authenticated user cannot read other users notifications (RLS isolation)'
);

SELECT * FROM finish();
ROLLBACK;
