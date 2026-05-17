-- pgTAP suite: verify RLS + RPC behavior for acquisition_models and
-- acquisition_model_results.
--
-- Mirrors the connections_rls test pattern.
-- Covers the 4 smoke cases from REQ-EXIT-01:
--   1. Owner computes a 3-holder model — verifies payout splits (4.8M/2.4M/0.8M)
--      and that 3 result rows are inserted.
--   2. 6th model creation raises the 5-model limit error.
--   3. Non-owner cannot call compute_acquisition_model on another workspace.
--   4. archive_acquisition_model frees a slot (5→4 active, new model succeeds).
--
-- Run locally:
--   supabase db reset && psql $DATABASE_URL -f supabase/tests/acquisition_models.sql

BEGIN;

SELECT plan(14);

-- ── Seed users ────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('eeee0001-0000-0000-0000-000000000001', 'acq-owner@pgtap.local',    '',
   NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('eeee0001-0000-0000-0000-000000000002', 'acq-nonowner@pgtap.local', '',
   NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated');

-- ── Seed workspace ────────────────────────────────────────────────────────────

INSERT INTO workspaces (id, name, owner_user_id, entity_status, country, city, sector, funding_stage, one_liner)
VALUES ('ffff0001-0000-0000-0000-000000000001', 'AcqTestCo',
        'eeee0001-0000-0000-0000-000000000001', 'product_only',
        'SA', 'Riyadh', 'fintech', 'pre_seed', 'pgTAP test workspace for acquisition models');

-- ── Seed 3 ordinary shareholders (60%/30%/10% = 600/300/100 shares) ──────────

INSERT INTO shareholders (id, workspace_id, name, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES
  ('gggg0001-0000-0000-0000-000000000001', 'ffff0001-0000-0000-0000-000000000001',
   'Holder A', 'individual', '2026-01-01', 'ordinary', '{"shares":"600"}'::jsonb),
  ('gggg0001-0000-0000-0000-000000000002', 'ffff0001-0000-0000-0000-000000000001',
   'Holder B', 'individual', '2026-01-01', 'ordinary', '{"shares":"300"}'::jsonb),
  ('gggg0001-0000-0000-0000-000000000003', 'ffff0001-0000-0000-0000-000000000001',
   'Holder C', 'individual', '2026-01-01', 'ordinary', '{"shares":"100"}'::jsonb);

-- Simulate authenticated session for the workspace owner
SELECT set_config('request.jwt.claims',
  '{"sub":"eeee0001-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- ── Case 1: Owner computes a model — 10M acq / 2M debt → 8M net ──────────────

SELECT lives_ok(
  $$ SELECT compute_acquisition_model(
       'ffff0001-0000-0000-0000-000000000001'::uuid,
       10000000, 2000000, 'pgTAP Model 1'
     ) $$,
  'Case 1a: owner can call compute_acquisition_model'
);

SELECT is(
  (SELECT COUNT(*)::int FROM acquisition_models
   WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
     AND deleted_at IS NULL),
  1,
  'Case 1b: exactly 1 model row created'
);

SELECT is(
  (SELECT COUNT(*)::int FROM acquisition_model_results r
   JOIN acquisition_models m ON m.id = r.model_id
   WHERE m.workspace_id = 'ffff0001-0000-0000-0000-000000000001'),
  3,
  'Case 1c: 3 result rows (one per holder)'
);

-- Verify payout values (±1 SAR tolerance for integer rounding)
SELECT ok(
  ABS((SELECT payout_sar FROM acquisition_model_results r
       JOIN acquisition_models m ON m.id = r.model_id
       WHERE m.workspace_id = 'ffff0001-0000-0000-0000-000000000001'
         AND r.shareholder_name = 'Holder A') - 4800000) <= 1,
  'Case 1d: Holder A payout ≈ 4,800,000 SAR (60%)'
);

SELECT ok(
  ABS((SELECT payout_sar FROM acquisition_model_results r
       JOIN acquisition_models m ON m.id = r.model_id
       WHERE m.workspace_id = 'ffff0001-0000-0000-0000-000000000001'
         AND r.shareholder_name = 'Holder B') - 2400000) <= 1,
  'Case 1e: Holder B payout ≈ 2,400,000 SAR (30%)'
);

SELECT ok(
  ABS((SELECT payout_sar FROM acquisition_model_results r
       JOIN acquisition_models m ON m.id = r.model_id
       WHERE m.workspace_id = 'ffff0001-0000-0000-0000-000000000001'
         AND r.shareholder_name = 'Holder C') - 800000) <= 1,
  'Case 1f: Holder C payout ≈ 800,000 SAR (10%)'
);

-- net_proceeds_sar stored correctly
SELECT is(
  (SELECT net_proceeds_sar::bigint FROM acquisition_models
   WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
     AND deleted_at IS NULL
   LIMIT 1),
  8000000::bigint,
  'Case 1g: net_proceeds_sar = 8,000,000'
);

-- ── Case 2: 6th model raises limit error ──────────────────────────────────────

-- Pre-fill 4 more model rows directly to reach 5 active
INSERT INTO acquisition_models (workspace_id, label, acquisition_price_sar, debt_sar, net_proceeds_sar, created_by)
SELECT 'ffff0001-0000-0000-0000-000000000001', 'Filler ' || g, 1000000, 0, 1000000,
       'eeee0001-0000-0000-0000-000000000001'
FROM generate_series(2, 5) g;

SELECT is(
  (SELECT COUNT(*)::int FROM acquisition_models
   WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
     AND deleted_at IS NULL),
  5,
  'Case 2a: 5 active models confirmed before limit test'
);

SELECT throws_ok(
  $$ SELECT compute_acquisition_model(
       'ffff0001-0000-0000-0000-000000000001'::uuid,
       9000000, 0, 'Should fail'
     ) $$,
  NULL, NULL,
  'Case 2b: 6th model is rejected with limit error'
);

-- ── Case 3: Non-owner cannot compute a model ──────────────────────────────────

SELECT set_config('request.jwt.claims',
  '{"sub":"eeee0001-0000-0000-0000-000000000002","role":"authenticated"}', true);

SELECT throws_ok(
  $$ SELECT compute_acquisition_model(
       'ffff0001-0000-0000-0000-000000000001'::uuid,
       5000000, 0, 'Non-owner attempt'
     ) $$,
  NULL, NULL,
  'Case 3: non-owner is blocked from computing a model'
);

-- ── Case 4: archive_acquisition_model frees the slot ─────────────────────────

SELECT set_config('request.jwt.claims',
  '{"sub":"eeee0001-0000-0000-0000-000000000001","role":"authenticated"}', true);

SELECT lives_ok(
  $$ SELECT archive_acquisition_model(
       (SELECT id FROM acquisition_models
        WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
          AND deleted_at IS NULL
        ORDER BY created_at
        LIMIT 1)
     ) $$,
  'Case 4a: owner can archive a model'
);

SELECT is(
  (SELECT COUNT(*)::int FROM acquisition_models
   WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
     AND deleted_at IS NULL),
  4,
  'Case 4b: active count drops to 4 after archive'
);

SELECT lives_ok(
  $$ SELECT compute_acquisition_model(
       'ffff0001-0000-0000-0000-000000000001'::uuid,
       7000000, 0, 'Model after archive'
     ) $$,
  'Case 4c: new model succeeds after freeing a slot'
);

SELECT is(
  (SELECT COUNT(*)::int FROM acquisition_models
   WHERE workspace_id = 'ffff0001-0000-0000-0000-000000000001'
     AND deleted_at IS NULL),
  5,
  'Case 4d: active count back to 5 after new model'
);

SELECT * FROM finish();

ROLLBACK;
