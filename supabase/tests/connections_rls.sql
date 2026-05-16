-- pgTAP suite: verify RLS + RPC behavior for connection_listings and
-- connection_inquiries.
--
-- Per eng review D7: full pgTAP coverage of all 15 DB code paths plus the
-- REGRESSION test for create_share_listing (must block when open exit
-- listing exists).
--
-- Run locally: `supabase db reset && psql ... -f supabase/tests/connections_rls.sql`

BEGIN;

SELECT plan(22);

-- ── Seed two workspaces with distinct owners ────────────────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local', '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local',   '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'eve@test.local',   '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated');

INSERT INTO workspaces (id, name, owner_user_id, entity_status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Co', '11111111-1111-1111-1111-111111111111', 'product_only'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Bob Co',   '22222222-2222-2222-2222-222222222222', 'product_only');

INSERT INTO shareholders (id, workspace_id, name, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Founder', 'individual', '2026-01-01', 'ordinary', '{"shares":"100000","price_per_share_sar":"1"}'::jsonb);

-- ── Case 1: Alice can create an exit listing in her own workspace ──────────

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT create_connection_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'exit',
       'Probuy is exploring a strategic exit. KSA market leader in B2B procurement.',
       '{"ask_type":"open_to_offers"}'::jsonb,
       NULL
     ) $$,
  'Alice can create exit listing in own workspace'
);

-- ── Case 2: Cross-workspace read — Bob (different workspace owner) can see Alice's listing

SET LOCAL "request.jwt.claims" TO '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

SELECT is(
  (SELECT COUNT(*)::int FROM connection_listings WHERE workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'Bob (cross-workspace) can read Alice listings'
);

-- ── Case 3: No-workspace user cannot read listings (Eve has no workspace) ──

SET LOCAL "request.jwt.claims" TO '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

SELECT is(
  (SELECT COUNT(*)::int FROM connection_listings),
  0,
  'No-workspace user (Eve) cannot read any listings'
);

-- ── Case 4: Non-owner cannot create a listing in someone else's workspace ──

SELECT throws_ok(
  $$ SELECT create_connection_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'partnership',
       'fake', '{}'::jsonb, NULL
     ) $$,
  NULL, NULL,
  'Eve cannot create listing in Alice workspace'
);

-- ── Case 5: Exit + partnership in same workspace blocked (DT2) ─────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT throws_ok(
  $$ SELECT create_connection_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'partnership',
       'looking for cofounder', '{}'::jsonb, NULL
     ) $$,
  NULL,
  'cannot create partnership listing while an open exit listing exists',
  'Cannot create partnership listing alongside an open exit listing'
);

-- ── Case 6: REGRESSION — create_share_listing blocked by open exit listing ─

SELECT throws_ok(
  $$ SELECT create_share_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
       '1000'::numeric, '50000'::numeric, NULL, NULL, '14 days'::interval
     ) $$,
  NULL,
  'cannot create share listing while an open exit listing exists; withdraw the exit listing first',
  'REGRESSION: Cannot create share listing while exit listing is open'
);

-- ── Case 7: Bob creates a partnership listing in his own workspace ─────────

SET LOCAL "request.jwt.claims" TO '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT create_connection_listing(
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
       'partnership',
       'Looking for a co-founder with KSA market expertise',
       '{"seeking_type":"co_founder","skills":["growth","b2b"],"commitment_type":"full_time"}'::jsonb,
       NULL
     ) $$,
  'Bob can create partnership listing'
);

-- ── Case 8: Self-inquiry blocked ────────────────────────────────────────────

SELECT throws_ok(
  $$ SELECT send_connection_inquiry(
       (SELECT id FROM connection_listings WHERE workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' LIMIT 1),
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
       NULL
     ) $$,
  NULL,
  'cannot inquire on your own workspace listing',
  'Bob cannot inquire on his own listing'
);

-- ── Case 9: Alice inquires on Bob's partnership listing ────────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT send_connection_inquiry(
       (SELECT id FROM connection_listings WHERE workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' LIMIT 1),
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'Interested in exploring this'
     ) $$,
  'Alice can inquire on Bob partnership listing'
);

-- ── Case 10: Duplicate inquiry blocked ─────────────────────────────────────

SELECT throws_ok(
  $$ SELECT send_connection_inquiry(
       (SELECT id FROM connection_listings WHERE workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' LIMIT 1),
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       NULL
     ) $$,
  NULL,
  'you already have an active inquiry on this listing',
  'Cannot send duplicate inquiry'
);

-- ── Case 11: Non-owner cannot accept inquiry ───────────────────────────────

SELECT throws_ok(
  $$ SELECT accept_connection_inquiry(
       (SELECT id FROM connection_inquiries LIMIT 1),
       NULL, 'standard', 14
     ) $$,
  NULL,
  'only the listing owner can accept',
  'Alice (inquirer) cannot accept her own inquiry'
);

-- ── Case 12: Owner accepts inquiry — creates data_room_link ────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT accept_connection_inquiry(
       (SELECT id FROM connection_inquiries LIMIT 1),
       NULL, 'standard', 14
     ) $$,
  'Bob (owner) can accept inquiry'
);

SELECT is(
  (SELECT status FROM connection_inquiries LIMIT 1),
  'accepted'::text,
  'Inquiry status transitioned to accepted'
);

SELECT is(
  (SELECT (data_room_link_id IS NOT NULL)::boolean FROM connection_inquiries LIMIT 1),
  true,
  'Inquiry accept created a data_room_link'
);

-- ── Case 13: Cannot re-accept an already-accepted inquiry ──────────────────

SELECT throws_ok(
  $$ SELECT accept_connection_inquiry(
       (SELECT id FROM connection_inquiries LIMIT 1),
       NULL, 'standard', 14
     ) $$,
  NULL, NULL,
  'Cannot accept an already-accepted inquiry'
);

-- ── Case 14: Inquirer can close an accepted inquiry ────────────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT close_connection_inquiry(
       (SELECT id FROM connection_inquiries LIMIT 1),
       'conversation complete'
     ) $$,
  'Alice (inquirer) can close accepted inquiry'
);

-- ── Case 15: Decline path — Alice creates a fresh listing, Bob inquires ────

-- Alice withdraws her exit listing first so we can test decline.
SELECT lives_ok(
  $$ SELECT withdraw_connection_listing(
       (SELECT id FROM connection_listings WHERE workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' LIMIT 1),
       'testing decline path'
     ) $$,
  'Alice can withdraw her own listing'
);

SELECT lives_ok(
  $$ SELECT create_connection_listing(
       'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
       'partnership',
       'Looking for advisor', '{"seeking_type":"advisor"}'::jsonb, NULL
     ) $$,
  'Alice creates new partnership listing after withdrawing exit'
);

SET LOCAL "request.jwt.claims" TO '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT send_connection_inquiry(
       (SELECT id FROM connection_listings WHERE workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND status = 'open' LIMIT 1),
       'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
       NULL
     ) $$,
  'Bob inquires on Alice partnership listing'
);

SET LOCAL "request.jwt.claims" TO '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

SELECT lives_ok(
  $$ SELECT decline_connection_inquiry(
       (SELECT id FROM connection_inquiries WHERE inquirer_user_id = '22222222-2222-2222-2222-222222222222' LIMIT 1),
       'not the right fit'
     ) $$,
  'Alice can decline Bob inquiry'
);

-- ── Case 16: Audit immutability extended to connection entities ────────────

INSERT INTO audit_events (workspace_id, actor_user_id, actor_email, entity_type, action, description)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'alice@test.local', 'connection_listing', 'connection_listing.created', 'test');

SET LOCAL ROLE postgres;

SELECT throws_ok(
  $$ UPDATE audit_events SET description = 'tampered' WHERE entity_type = 'connection_listing' $$,
  NULL,
  'audit_events for marketplace entities are immutable',
  'Cannot UPDATE connection_listing audit_events'
);

SELECT throws_ok(
  $$ DELETE FROM audit_events WHERE entity_type = 'connection_listing' $$,
  NULL,
  'audit_events for marketplace entities are immutable',
  'Cannot DELETE connection_listing audit_events'
);

SELECT * FROM finish();
ROLLBACK;
