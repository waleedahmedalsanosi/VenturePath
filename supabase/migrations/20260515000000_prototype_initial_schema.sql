-- VenturePath Prototype V0 — Initial Schema
-- Per eng review plan (~/.gstack/projects/.../eng-review-prototype-20260515.md)
-- Decisions: single shareholders table + JSONB instrument_data, NUMERIC precision via JSONB strings, RLS from day 1.

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE entity_status AS ENUM ('incorporated', 'product_only');
CREATE TYPE entity_or_individual AS ENUM ('entity', 'individual');
CREATE TYPE instrument_type AS ENUM ('ordinary', 'isafe');
CREATE TYPE isafe_conversion_status AS ENUM ('unconverted', 'converted');

-- ============================================================================
-- workspaces
-- ============================================================================

CREATE TABLE workspaces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  entity_status   entity_status NOT NULL,
  legal_entity    TEXT,
  country         TEXT NOT NULL,
  city            TEXT NOT NULL,
  sector          TEXT NOT NULL,
  founded_year    INTEGER CHECK (founded_year BETWEEN 1900 AND 2100),
  funding_stage   TEXT NOT NULL,
  one_liner       TEXT NOT NULL CHECK (char_length(one_liner) <= 140),
  website_url     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT incorporated_requires_legal_entity
    CHECK (entity_status = 'product_only' OR legal_entity IS NOT NULL),
  CONSTRAINT incorporated_requires_founded_year
    CHECK (entity_status = 'product_only' OR founded_year IS NOT NULL)
);

CREATE INDEX workspaces_owner_user_id_idx ON workspaces (owner_user_id);

COMMENT ON TABLE workspaces IS 'One startup workspace per user in prototype. Plan tier limits not enforced in V0.';

-- ============================================================================
-- shareholders
-- ============================================================================

CREATE TABLE shareholders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  email                 TEXT,
  entity_or_individual  entity_or_individual NOT NULL,
  entry_date            DATE NOT NULL,
  instrument_type       instrument_type NOT NULL,
  -- instrument_data shape per instrument_type (validated in Zod at app layer):
  --   ordinary: { shares: NUMERIC, price_per_share_sar: NUMERIC, vesting?: {...} }
  --   isafe:    { investment_sar: NUMERIC, valuation_cap_sar: NUMERIC,
  --               profit_share_ratio: NUMERIC, conversion_status: 'unconverted'|'converted',
  --               conversion_date?: date }
  instrument_data       JSONB NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE INDEX shareholders_workspace_id_idx ON shareholders (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX shareholders_instrument_type_idx ON shareholders (workspace_id, instrument_type) WHERE deleted_at IS NULL;

COMMENT ON TABLE shareholders IS 'JSONB instrument_data per eng review decision 2. Schema validation in app layer via Zod.';
COMMENT ON COLUMN shareholders.instrument_data IS 'Type-specific fields. NUMERIC values stored as JSON strings to preserve precision.';

-- ============================================================================
-- updated_at trigger (shared)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER shareholders_updated_at
  BEFORE UPDATE ON shareholders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
