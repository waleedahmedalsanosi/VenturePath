-- REQ-EXIT-01: M&A Modelling RPC for Exit Hub
--
-- Adds server-side persistence for acquisition waterfall models:
--   acquisition_models          — one row per saved scenario
--   acquisition_model_results   — per-shareholder payout rows (written by RPC)
--
-- RPCs:
--   compute_acquisition_model   — owner-only, 5-model limit, SECURITY DEFINER
--   archive_acquisition_model   — soft-delete (sets deleted_at), owner-only
--
-- Audit: entity_type='workspace' (entity_id = model UUID).
-- The CHECK on audit_events already allows 'workspace'; no constraint change needed.

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS acquisition_models (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label                 TEXT        NOT NULL DEFAULT 'Untitled model',
  acquisition_price_sar NUMERIC     NOT NULL CHECK (acquisition_price_sar > 0),
  debt_sar              NUMERIC     NOT NULL DEFAULT 0 CHECK (debt_sar >= 0),
  net_proceeds_sar      NUMERIC     NOT NULL,
  connection_listing_id UUID        REFERENCES connection_listings(id) ON DELETE SET NULL,
  created_by            UUID        NOT NULL REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS acquisition_model_results (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id        UUID    NOT NULL REFERENCES acquisition_models(id) ON DELETE CASCADE,
  shareholder_id  UUID    NOT NULL REFERENCES shareholders(id) ON DELETE CASCADE,
  shareholder_name TEXT   NOT NULL,
  shares          NUMERIC NOT NULL,
  payout_sar      NUMERIC NOT NULL,
  multiple_x      NUMERIC,           -- NULL when cost basis unknown
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS acquisition_models_workspace_active_idx
  ON acquisition_models (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS acquisition_model_results_model_idx
  ON acquisition_model_results (model_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE acquisition_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE acquisition_model_results ENABLE ROW LEVEL SECURITY;

-- Workspace members can do everything on acquisition_models.
CREATE POLICY "acquisition_models_member_all"
  ON acquisition_models FOR ALL TO authenticated
  USING (user_can_access_workspace(workspace_id))
  WITH CHECK (user_can_access_workspace(workspace_id));

-- Workspace members can read results (writes happen inside SECURITY DEFINER RPC).
CREATE POLICY "acquisition_model_results_member_select"
  ON acquisition_model_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM acquisition_models am
      WHERE am.id = model_id
        AND user_can_access_workspace(am.workspace_id)
    )
  );

-- ── Updated-at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- Note: acquisition_models has no updated_at column (archive uses deleted_at),
-- so no trigger needed here.

-- ── compute_acquisition_model ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION compute_acquisition_model(
  p_workspace_id          UUID,
  p_acquisition_price_sar NUMERIC,
  p_debt_sar              NUMERIC  DEFAULT 0,
  p_label                 TEXT     DEFAULT 'Untitled model',
  p_connection_listing_id UUID     DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller          UUID := auth.uid();
  v_owner_user_id   UUID;
  v_actor_email     TEXT;
  v_active_count    INT;
  v_net_proceeds    NUMERIC;
  v_total_shares    NUMERIC;
  v_model_id        UUID;
  v_sh              RECORD;
  v_payout          NUMERIC;
  v_cost_basis      NUMERIC;
  v_multiple        NUMERIC;
  v_results         JSON;
BEGIN
  -- Authentication
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Owner check (mirrors close_financing_round pattern)
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = p_workspace_id;
  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'workspace not found';
  END IF;
  IF v_owner_user_id <> v_caller THEN
    RAISE EXCEPTION 'only the workspace owner can compute an acquisition model';
  END IF;

  -- Input validation
  IF p_acquisition_price_sar IS NULL OR p_acquisition_price_sar <= 0 THEN
    RAISE EXCEPTION 'acquisition_price_sar must be positive';
  END IF;
  IF COALESCE(p_debt_sar, 0) < 0 THEN
    RAISE EXCEPTION 'debt_sar cannot be negative';
  END IF;

  -- 5-model limit (active, non-deleted)
  SELECT COUNT(*) INTO v_active_count
    FROM acquisition_models
    WHERE workspace_id = p_workspace_id
      AND deleted_at IS NULL;
  IF v_active_count >= 5 THEN
    RAISE EXCEPTION 'limit reached: a workspace may have at most 5 active acquisition models; archive one to create a new scenario';
  END IF;

  -- Compute net proceeds
  v_net_proceeds := GREATEST(0, p_acquisition_price_sar - COALESCE(p_debt_sar, 0));

  -- Sum fully-diluted ordinary shares across all non-deleted shareholders
  SELECT COALESCE(SUM((instrument_data->>'shares')::NUMERIC), 0)
    INTO v_total_shares
    FROM shareholders
    WHERE workspace_id = p_workspace_id
      AND deleted_at IS NULL
      AND instrument_type = 'ordinary';

  IF v_total_shares = 0 THEN
    RAISE EXCEPTION 'no ordinary shareholders found in the cap table';
  END IF;

  -- Insert model header row
  INSERT INTO acquisition_models (
    workspace_id, label, acquisition_price_sar, debt_sar,
    net_proceeds_sar, connection_listing_id, created_by
  ) VALUES (
    p_workspace_id, COALESCE(NULLIF(TRIM(p_label), ''), 'Untitled model'),
    p_acquisition_price_sar, COALESCE(p_debt_sar, 0),
    v_net_proceeds, p_connection_listing_id, v_caller
  )
  RETURNING id INTO v_model_id;

  -- Insert per-shareholder result rows
  FOR v_sh IN
    SELECT
      id,
      name,
      (instrument_data->>'shares')::NUMERIC AS shares,
      -- Cost basis: investment_sar (iSAFE/SAFE), else principal_sar (CN),
      -- else NULL for ordinary holders (no tracked cost basis).
      COALESCE(
        NULLIF((instrument_data->>'investment_sar')::NUMERIC, 0),
        NULLIF((instrument_data->>'principal_sar')::NUMERIC, 0),
        NULL
      ) AS cost_basis
    FROM shareholders
    WHERE workspace_id = p_workspace_id
      AND deleted_at IS NULL
      AND instrument_type = 'ordinary'
    ORDER BY name
  LOOP
    v_payout := (v_sh.shares / v_total_shares) * v_net_proceeds;

    IF v_sh.cost_basis IS NOT NULL AND v_sh.cost_basis > 0 THEN
      v_multiple := v_payout / v_sh.cost_basis;
    ELSE
      v_multiple := NULL;
    END IF;

    INSERT INTO acquisition_model_results (
      model_id, shareholder_id, shareholder_name,
      shares, payout_sar, multiple_x
    ) VALUES (
      v_model_id, v_sh.id, v_sh.name,
      v_sh.shares, v_payout, v_multiple
    );
  END LOOP;

  -- Audit row: entity_type='workspace' (CHECK allows it; no immutability trigger)
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_caller;

  INSERT INTO audit_events (
    workspace_id, actor_user_id, actor_email,
    entity_type, entity_id, action, description, payload
  ) VALUES (
    p_workspace_id, v_caller, COALESCE(v_actor_email, '(no email)'),
    'workspace',
    v_model_id,
    'acquisition_model.computed',
    'Computed acquisition model "' || COALESCE(NULLIF(TRIM(p_label), ''), 'Untitled model') || '"',
    jsonb_build_object(
      'model_id',               v_model_id,
      'label',                  COALESCE(NULLIF(TRIM(p_label), ''), 'Untitled model'),
      'acquisition_price_sar',  p_acquisition_price_sar,
      'debt_sar',               COALESCE(p_debt_sar, 0),
      'net_proceeds_sar',       v_net_proceeds,
      'total_shares',           v_total_shares
    )
  );

  -- Return result JSON
  SELECT json_build_object(
    'model_id',               v_model_id,
    'label',                  am.label,
    'acquisition_price_sar',  am.acquisition_price_sar,
    'net_proceeds_sar',       am.net_proceeds_sar,
    'results', (
      SELECT json_agg(
        json_build_object(
          'shareholder_id',   r.shareholder_id,
          'shareholder_name', r.shareholder_name,
          'shares',           r.shares,
          'payout_sar',       r.payout_sar,
          'multiple_x',       r.multiple_x
        ) ORDER BY r.payout_sar DESC
      )
      FROM acquisition_model_results r
      WHERE r.model_id = v_model_id
    )
  )
  INTO v_results
  FROM acquisition_models am
  WHERE am.id = v_model_id;

  RETURN v_results;
END;
$$;

COMMENT ON FUNCTION compute_acquisition_model(UUID, NUMERIC, NUMERIC, TEXT, UUID) IS
  'Owner-only RPC. Creates an acquisition_models header row and per-shareholder acquisition_model_results rows for a pro-rata ordinary-share waterfall. Limited to 5 active models per workspace. Audit row written with entity_type=workspace.';

GRANT EXECUTE ON FUNCTION compute_acquisition_model(UUID, NUMERIC, NUMERIC, TEXT, UUID) TO authenticated;

-- ── archive_acquisition_model ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION archive_acquisition_model(
  p_model_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller        UUID := auth.uid();
  v_workspace_id  UUID;
  v_owner_user_id UUID;
  v_actor_email   TEXT;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Read model workspace
  SELECT workspace_id INTO v_workspace_id
    FROM acquisition_models
    WHERE id = p_model_id AND deleted_at IS NULL;
  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'model not found or already archived';
  END IF;

  -- Owner check
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = v_workspace_id;
  IF v_owner_user_id <> v_caller THEN
    RAISE EXCEPTION 'only the workspace owner can archive an acquisition model';
  END IF;

  -- Soft-delete
  UPDATE acquisition_models
    SET deleted_at = NOW()
    WHERE id = p_model_id;

  -- Audit row
  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_caller;

  INSERT INTO audit_events (
    workspace_id, actor_user_id, actor_email,
    entity_type, entity_id, action, description, payload
  ) VALUES (
    v_workspace_id, v_caller, COALESCE(v_actor_email, '(no email)'),
    'workspace',
    p_model_id,
    'acquisition_model.archived',
    'Archived acquisition model',
    jsonb_build_object('model_id', p_model_id)
  );
END;
$$;

COMMENT ON FUNCTION archive_acquisition_model(UUID) IS
  'Owner-only soft-delete for acquisition models. Sets deleted_at, frees the slot toward the 5-model limit. Results rows remain (FK is CASCADE on hard-delete only).';

GRANT EXECUTE ON FUNCTION archive_acquisition_model(UUID) TO authenticated;
