-- ESOP — Employee Stock Option Pool (PRD EP-05)

CREATE TYPE esop_vesting_type AS ENUM ('immediate', 'graded');
CREATE TYPE esop_vesting_frequency AS ENUM ('monthly', 'quarterly', 'annual');
CREATE TYPE esop_grant_status AS ENUM ('active', 'fully_vested', 'terminated');
CREATE TYPE esop_department AS ENUM (
  'engineering', 'product', 'sales', 'operations',
  'design', 'legal', 'finance', 'other'
);

CREATE TABLE esop_pools (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id               UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  total_pool_shares          NUMERIC(20, 0) NOT NULL CHECK (total_pool_shares > 0),
  strike_price_reference_sar NUMERIC(20, 2) CHECK (strike_price_reference_sar IS NULL OR strike_price_reference_sar > 0),
  pool_creation_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER esop_pools_updated_at
  BEFORE UPDATE ON esop_pools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE esop_grants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id             UUID NOT NULL REFERENCES esop_pools(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  employee_name       TEXT NOT NULL CHECK (char_length(employee_name) BETWEEN 1 AND 200),
  employee_email      TEXT NOT NULL,
  department          esop_department NOT NULL,
  options_count       NUMERIC(20, 0) NOT NULL CHECK (options_count > 0),
  strike_price_sar    NUMERIC(20, 2) NOT NULL CHECK (strike_price_sar > 0),
  grant_date          DATE NOT NULL,
  vesting_type        esop_vesting_type NOT NULL,
  vesting_start_date  DATE,
  vesting_end_date    DATE,
  cliff_months        INTEGER NOT NULL DEFAULT 0 CHECK (cliff_months >= 0),
  vesting_frequency   esop_vesting_frequency,
  status              esop_grant_status NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT graded_requires_dates
    CHECK (vesting_type = 'immediate' OR (vesting_start_date IS NOT NULL AND vesting_end_date IS NOT NULL)),
  CONSTRAINT vesting_end_after_start
    CHECK (vesting_type = 'immediate' OR vesting_end_date > vesting_start_date)
);

CREATE INDEX esop_grants_pool_idx ON esop_grants (pool_id) WHERE deleted_at IS NULL;
CREATE INDEX esop_grants_workspace_idx ON esop_grants (workspace_id, grant_date DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER esop_grants_updated_at
  BEFORE UPDATE ON esop_grants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE esop_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE esop_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY esop_pools_select_own ON esop_pools FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_pools_insert_own ON esop_pools FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_pools_update_own ON esop_pools FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_pools_delete_own ON esop_pools FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

CREATE POLICY esop_grants_select_own ON esop_grants FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_grants_insert_own ON esop_grants FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_grants_update_own ON esop_grants FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY esop_grants_delete_own ON esop_grants FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
