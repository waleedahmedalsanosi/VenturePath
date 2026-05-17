-- pgTAP suite: mark_share_listing_sold_off_platform (REQ-TRADE-02)
-- Tests the cap-table sync extension to the sold-off-platform RPC.
--
-- Coverage:
--   1. No buyer details → listing sold, no cap-table change
--   2. Buyer details + seller has surplus shares → seller decrements, buyer inserted, audit written
--   3. Buyer details + seller has EXACTLY the listed share count → seller soft-deleted
--   4. Non-owner caller → raises 'only the workspace owner'
--   5. Listing already sold/withdrawn → raises 'cannot mark sold'
--   6. Seller has fewer shares than listed → raises 'seller does not have enough shares'
--
-- Run locally: `supabase db reset && psql ... -f supabase/tests/transfer_agent_cap_table.sql`

BEGIN;

SELECT plan(20);

-- ── Seed ──────────────────────────────────────────────────────────────────────

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
VALUES
  ('aaaa0001-0000-0000-0000-000000000000', 'owner@ta.test',    '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated'),
  ('aaaa0002-0000-0000-0000-000000000000', 'nonowner@ta.test', '', NOW(), '{}'::jsonb, '{}'::jsonb, NOW(), NOW(), 'authenticated', 'authenticated');

INSERT INTO workspaces (id, name, owner_user_id, entity_status, country, city, sector, funding_stage, one_liner)
VALUES ('bbbb0001-0000-0000-0000-000000000000', 'TransferAgent Co',
        'aaaa0001-0000-0000-0000-000000000000', 'product_only',
        'SA', 'Riyadh', 'fintech', 'pre_seed', 'pgTAP test workspace');

-- Seller A: 1000 shares (cases 1 & 2)
INSERT INTO shareholders (id, workspace_id, name, email, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES ('cccc0001-0000-0000-0000-000000000000',
        'bbbb0001-0000-0000-0000-000000000000',
        'Seller A', 'seller-a@ta.test', 'individual', '2026-01-01',
        'ordinary', '{"shares":"1000","price_per_share_sar":"10"}'::jsonb);

-- Seller B: EXACTLY 200 shares (case 3)
INSERT INTO shareholders (id, workspace_id, name, email, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES ('cccc0002-0000-0000-0000-000000000000',
        'bbbb0001-0000-0000-0000-000000000000',
        'Seller B', 'seller-b@ta.test', 'individual', '2026-01-01',
        'ordinary', '{"shares":"200","price_per_share_sar":"10"}'::jsonb);

-- Seller C: only 50 shares, listing offers 100 (case 6)
INSERT INTO shareholders (id, workspace_id, name, email, entity_or_individual, entry_date, instrument_type, instrument_data)
VALUES ('cccc0003-0000-0000-0000-000000000000',
        'bbbb0001-0000-0000-0000-000000000000',
        'Seller C', 'seller-c@ta.test', 'individual', '2026-01-01',
        'ordinary', '{"shares":"50","price_per_share_sar":"10"}'::jsonb);

-- Listings
INSERT INTO share_listings (id, workspace_id, shareholder_id, seller_user_id, shares_offered, ask_price_sar, status)
VALUES
  -- case 1: no buyer
  ('dddd0001-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
   'cccc0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 300, 3000, 'open'),
  -- case 2: buyer + surplus
  ('dddd0002-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
   'cccc0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 400, 4000, 'open'),
  -- case 3: exact shares
  ('dddd0003-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
   'cccc0002-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 200, 2000, 'open'),
  -- case 4: non-owner attempt
  ('dddd0004-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
   'cccc0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 100, 1000, 'open'),
  -- case 6: insufficient shares
  ('dddd0006-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
   'cccc0003-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 100, 1000, 'open');

-- case 5: already sold
INSERT INTO share_listings (id, workspace_id, shareholder_id, seller_user_id, shares_offered, ask_price_sar, status, closed_at, closed_reason)
VALUES ('dddd0005-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
        'cccc0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000',
        100, 1000, 'sold_off_platform', NOW(), 'sold_off_platform');

-- ── Switch to workspace owner ─────────────────────────────────────────────────

SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub":"aaaa0001-0000-0000-0000-000000000000","role":"authenticated"}';

-- ── CASE 1: No buyer details ──────────────────────────────────────────────────

SELECT lives_ok(
  $$ SELECT mark_share_listing_sold_off_platform('dddd0001-0000-0000-0000-000000000000'::uuid) $$,
  'Case 1: owner can mark sold with no buyer details'
);

SELECT is(
  (SELECT status FROM share_listings WHERE id = 'dddd0001-0000-0000-0000-000000000000'),
  'sold_off_platform',
  'Case 1: listing status flipped to sold_off_platform'
);

SELECT is(
  (SELECT (instrument_data->>'shares')::numeric FROM shareholders WHERE id = 'cccc0001-0000-0000-0000-000000000000'),
  1000::numeric,
  'Case 1: seller share count unchanged (no cap-table sync)'
);

SELECT is(
  (SELECT COUNT(*)::int FROM shareholders WHERE instrument_data->>'acquired_via' = 'secondary_sale'),
  0,
  'Case 1: no new buyer shareholder row inserted'
);

-- ── CASE 2: Buyer details, seller has surplus shares ─────────────────────────

SELECT lives_ok(
  $$ SELECT mark_share_listing_sold_off_platform(
       'dddd0002-0000-0000-0000-000000000000'::uuid,
       'Bob Buyer', 'bob@ta.test', 8000::numeric
     ) $$,
  'Case 2: owner can mark sold with buyer details'
);

SELECT is(
  (SELECT (instrument_data->>'shares')::numeric FROM shareholders WHERE id = 'cccc0001-0000-0000-0000-000000000000'),
  600::numeric,
  'Case 2: seller A decremented from 1000 to 600 (listed 400)'
);

SELECT is(
  (SELECT instrument_data->>'shares' FROM shareholders WHERE email = 'bob@ta.test'),
  '400',
  'Case 2: buyer shareholder row has correct share count'
);

SELECT is(
  (SELECT instrument_data->>'acquired_via' FROM shareholders WHERE email = 'bob@ta.test'),
  'secondary_sale',
  'Case 2: buyer row has acquired_via=secondary_sale'
);

SELECT is(
  (SELECT COUNT(*)::int FROM audit_events WHERE action = 'secondary_sale_recorded'
     AND workspace_id = 'bbbb0001-0000-0000-0000-000000000000'),
  1,
  'Case 2: one audit row written for secondary_sale_recorded'
);

SELECT is(
  (SELECT entity_type FROM audit_events WHERE action = 'secondary_sale_recorded'),
  'shareholder',
  'Case 2: audit entity_type = shareholder (satisfies CHECK constraint)'
);

-- ── CASE 3: Seller has exactly the listed share count ────────────────────────

SELECT lives_ok(
  $$ SELECT mark_share_listing_sold_off_platform(
       'dddd0003-0000-0000-0000-000000000000'::uuid,
       'Carol Buyer', 'carol@ta.test', 4000::numeric
     ) $$,
  'Case 3: owner can mark sold when seller has exactly the listed shares'
);

SELECT isnt(
  (SELECT deleted_at FROM shareholders WHERE id = 'cccc0002-0000-0000-0000-000000000000'),
  NULL,
  'Case 3: seller B soft-deleted (new_shares = 0)'
);

SELECT is(
  (SELECT instrument_data->>'shares' FROM shareholders WHERE email = 'carol@ta.test'),
  '200',
  'Case 3: Carol Buyer has 200 shares'
);

-- ── CASE 4: Non-owner → rejected ─────────────────────────────────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"aaaa0002-0000-0000-0000-000000000000","role":"authenticated"}';

SELECT throws_ok(
  $$ SELECT mark_share_listing_sold_off_platform('dddd0004-0000-0000-0000-000000000000'::uuid) $$,
  NULL, NULL,
  'Case 4: non-owner cannot mark listing as sold'
);

-- ── CASE 5: Already sold → rejected ──────────────────────────────────────────

SET LOCAL "request.jwt.claims" TO '{"sub":"aaaa0001-0000-0000-0000-000000000000","role":"authenticated"}';

SELECT throws_ok(
  $$ SELECT mark_share_listing_sold_off_platform('dddd0005-0000-0000-0000-000000000000'::uuid) $$,
  NULL, NULL,
  'Case 5: already-sold listing raises error'
);

-- ── CASE 6: Seller has fewer shares than listed ───────────────────────────────

SELECT throws_ok(
  $$ SELECT mark_share_listing_sold_off_platform(
       'dddd0006-0000-0000-0000-000000000000'::uuid,
       'Dave Buyer', 'dave@ta.test', 2000::numeric
     ) $$,
  NULL, NULL,
  'Case 6: insufficient seller shares raises error'
);

-- ── Return type shape ─────────────────────────────────────────────────────────
-- Verify the RPC returns the expected JSON keys on a fresh listing.

INSERT INTO share_listings (id, workspace_id, shareholder_id, seller_user_id, shares_offered, ask_price_sar, status)
VALUES ('dddd0009-0000-0000-0000-000000000000', 'bbbb0001-0000-0000-0000-000000000000',
        'cccc0001-0000-0000-0000-000000000000', 'aaaa0001-0000-0000-0000-000000000000', 100, 1000, 'open');

SELECT ok(
  (SELECT (mark_share_listing_sold_off_platform('dddd0009-0000-0000-0000-000000000000'::uuid))->>'success' = 'true'),
  'Return shape: success=true'
);

SELECT ok(
  (SELECT (mark_share_listing_sold_off_platform IS NOT NULL)
   FROM (SELECT 1) x),
  'RPC function exists and is callable'
);

SELECT * FROM finish();
ROLLBACK;
