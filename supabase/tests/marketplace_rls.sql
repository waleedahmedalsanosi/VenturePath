-- pgTAP suite: verify RLS isolation on share_listings and rofr_notifications.
-- Per eng review T2 lock: first RLS test suite in the repo. Sets the
-- foundation pattern other tables (financing_rounds, shareholders) will
-- adopt in follow-up work.
--
-- Run locally: `supabase db reset && psql ... -f supabase/tests/marketplace_rls.sql`
-- CI: see .github/workflows/db-tests.yml

BEGIN;

SELECT plan(10);

-- ── Seed two workspaces with distinct owners ────────────────────────────────

-- Insert into auth.users via SQL is only possible in test environments where
-- the auth schema is owned by the test role. The Supabase CLI's `db reset`
-- gives us that. We bypass the GoTrue API and insert minimal rows.
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local',   '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated');

INSERT INTO workspaces (id, name, owner_user_id, entity_status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Co', '11111111-1111-1111-1111-111111111111', 'product_only'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Co',   '22222222-2222-2222-2222-222222222222', 'product_only');

INSERT INTO shareholders (id, workspace_id, name, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Founder', 'individual', '2026-01-01', 'ordinary', '{"shares":"100000","price_per_share_sar":"1"}'::jsonb),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Founder',   'individual', '2026-01-01', 'ordinary', '{"shares":"100000","price_per_share_sar":"1"}'::jsonb);

-- ── Case 1: Alice can list her own shares ──────────────────────────────────

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT create_share_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
       '1000'::numeric, '50000'::numeric, NULL, NULL, '14 days'::interval
     ) $$,
  'Alice can list shares in her own workspace'
);

SELECT is(
  (SELECT COUNT(*)::int FROM share_listings WHERE workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Alice sees her own listing'
);

-- ── Case 2: Alice cannot see Bob's workspace via RLS ───────────────────────

SELECT is(
  (SELECT COUNT(*)::int FROM share_listings WHERE workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  0,
  'Alice cannot read Bob workspace listings'
);

-- ── Case 3: Alice cannot list shares in Bob's workspace ────────────────────

SELECT throws_ok(
  $$ SELECT create_share_listing(
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
       'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
       '1000'::numeric, '50000'::numeric, NULL, NULL, '14 days'::interval
     ) $$,
  NULL,
  'only the workspace owner can list shares',
  'Alice cannot list shares in Bob workspace'
);

-- ── Case 4: Cannot list more shares than held ──────────────────────────────

SELECT throws_ok(
  $$ SELECT create_share_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
       '999999'::numeric, '1'::numeric, NULL, NULL, '14 days'::interval
     ) $$,
  NULL,
  NULL,
  'Cannot offer more shares than held'
);

-- ── Case 5: Switch to Bob, verify isolation works the other way ────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

SELECT is(
  (SELECT COUNT(*)::int FROM share_listings WHERE workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0,
  'Bob cannot read Alice workspace listings'
);

SELECT lives_ok(
  $$ SELECT create_share_listing(
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
       'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid,
       '2000'::numeric, '100000'::numeric, NULL, NULL, '14 days'::interval
     ) $$,
  'Bob can list shares in his own workspace'
);

-- ── Case 6: Withdraw is restricted to the seller ───────────────────────────

-- Switch back to Alice and try to withdraw Bob's listing
SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT throws_ok(
  $$ SELECT withdraw_share_listing(
       (SELECT id FROM share_listings WHERE workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' LIMIT 1),
       'attempt'
     ) $$,
  NULL,
  NULL,
  'Alice cannot withdraw Bob listing'
);

-- ── Case 7: Audit events for marketplace are immutable ─────────────────────

INSERT INTO audit_events (workspace_id, actor_user_id, actor_email, entity_type, action, description)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'alice@test.local', 'share_listing', 'share_listing.created', 'test');

SET LOCAL ROLE postgres;

SELECT throws_ok(
  $$ UPDATE audit_events SET description = 'tampered' WHERE entity_type = 'share_listing' $$,
  NULL,
  'audit_events for marketplace entities are immutable',
  'Cannot UPDATE marketplace audit_events'
);

SELECT throws_ok(
  $$ DELETE FROM audit_events WHERE entity_type = 'share_listing' $$,
  NULL,
  'audit_events for marketplace entities are immutable',
  'Cannot DELETE marketplace audit_events'
);

SELECT * FROM finish();
ROLLBACK;
