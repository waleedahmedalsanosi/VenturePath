-- share_listings: bulletin-board secondary marketplace (Approach A).
-- A seller lists vested shares from an existing cap-table row with a posted
-- ask price. No escrow, no matching engine, no fund movement on platform.
-- Buyer-seller closing happens off-platform (lawyer, board consent, SPA).
-- Per eng review 2026-05-16: workspace-scoped, RLS first, soft-delete,
-- Decimal money via NUMERIC, atomic state via RPC (see marketplace_rpcs).

CREATE TABLE IF NOT EXISTS share_listings (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  shareholder_id      UUID        NOT NULL REFERENCES shareholders(id) ON DELETE RESTRICT,
  seller_user_id      UUID        NOT NULL REFERENCES auth.users(id),
  shares_offered      NUMERIC     NOT NULL CHECK (shares_offered > 0),
  ask_price_sar       NUMERIC     NOT NULL CHECK (ask_price_sar > 0),
  notes               TEXT,
  status              TEXT        NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'withdrawn', 'sold_off_platform')),
  listed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  closed_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS share_listings_workspace_idx
  ON share_listings (workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS share_listings_shareholder_idx
  ON share_listings (shareholder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS share_listings_open_idx
  ON share_listings (workspace_id, listed_at DESC) WHERE status = 'open' AND deleted_at IS NULL;

COMMENT ON TABLE share_listings IS
  'Approach A bulletin board: posted-ask secondary listings. No escrow or fund movement on platform.';
COMMENT ON COLUMN share_listings.shares_offered IS
  'NUMERIC; app layer uses Decimal. Must be <= shareholder.instrument_data.shares.';
COMMENT ON COLUMN share_listings.ask_price_sar IS
  'Total SAR for the lot (not per-share). NUMERIC; app layer uses Decimal.';

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE share_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "share_listings_owner_all"
  ON share_listings FOR ALL TO authenticated
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

CREATE POLICY "share_listings_member_read"
  ON share_listings FOR SELECT TO authenticated
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));

-- ── updated_at trigger ─────────────────────────────────────────────────────

CREATE TRIGGER share_listings_updated_at
  BEFORE UPDATE ON share_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── audit_events: allow marketplace entity types ───────────────────────────

ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_entity_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_entity_type_check
  CHECK (entity_type IN (
    'workspace', 'shareholder', 'document', 'compliance_obligation',
    'share_listing', 'rofr_notification'
  ));
