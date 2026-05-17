-- close_financing_round: atomic apply layer for the existing TS close-round flow.
--
-- The conversion math (computeConversionShares for iSAFE, convertSafe for SAFE)
-- intentionally stays in TypeScript — see lib/cap-table/isafe-math.ts which
-- carries a "legal review required" warning and a deliberate single-source-of-
-- truth for Sharia-aware conversion logic. Duplicating that math in plpgsql
-- would risk silent drift between the two implementations.
--
-- This RPC accepts a pre-computed plan (promotions + conversions) from the TS
-- side and applies it inside a single transaction so a mid-flight failure
-- cannot leave orphaned shareholder rows, half-promoted term sheets, or a
-- still-open round with a partially-converted cap table.
--
-- Round-close audit events are written with entity_type='financing_round' and
-- covered by the marketplace immutability trigger. Per-conversion events use
-- entity_type='shareholder' (mutable, matches existing edits on shareholder
-- rows).

-- ── audit_events: add 'financing_round' to allowed entity_type values ──────

ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_entity_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_entity_type_check
  CHECK (entity_type IN (
    'workspace', 'shareholder', 'document', 'compliance_obligation',
    'share_listing', 'rofr_notification',
    'connection_listing', 'connection_inquiry',
    'financing_round'
  ));

-- ── Extend the immutability trigger to cover financing_round ──────────────

CREATE OR REPLACE FUNCTION audit_events_block_marketplace_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.entity_type IN (
      'share_listing', 'rofr_notification',
      'connection_listing', 'connection_inquiry',
      'financing_round'
    ) THEN
      RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF NEW.entity_type IN (
       'share_listing', 'rofr_notification',
       'connection_listing', 'connection_inquiry',
       'financing_round'
     )
     OR OLD.entity_type IN (
       'share_listing', 'rofr_notification',
       'connection_listing', 'connection_inquiry',
       'financing_round'
     ) THEN
    RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
  END IF;
  RETURN NEW;
END;
$$;

-- ── close_financing_round RPC ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION close_financing_round(
  p_round_id                UUID,
  p_pre_money_valuation_sar NUMERIC,
  p_fd_shares_pre_round     NUMERIC,
  p_actual_raise_sar        NUMERIC,
  p_close_date              DATE,
  p_promotions              JSONB,
  p_conversions             JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_round              RECORD;
  v_owner_user_id      UUID;
  v_caller             UUID := auth.uid();
  v_actor_email        TEXT;
  v_promo              JSONB;
  v_conv               JSONB;
  v_promoted_count     INT := 0;
  v_converted_count    INT := 0;
BEGIN
  -- SECURITY DEFINER: this function runs as the function owner (postgres) so
  -- it can read auth.users for the actor_email AND bypass RLS on writes.
  -- Auth is enforced explicitly below: the caller must be (a) authenticated
  -- and (b) the workspace owner of the round being closed. We never trust
  -- the caller's view of "which workspace this round belongs to" — we read
  -- workspace_id from financing_rounds itself.
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Lock + read round atomically. FOR UPDATE prevents two concurrent close
  -- calls from racing through the status='open' check.
  SELECT id, workspace_id, name, status
    INTO v_round
    FROM financing_rounds
    WHERE id = p_round_id
      AND deleted_at IS NULL
    FOR UPDATE;

  IF v_round.id IS NULL THEN
    RAISE EXCEPTION 'round not found';
  END IF;

  IF v_round.status <> 'open' THEN
    RAISE EXCEPTION 'round is not open (status: %)', v_round.status;
  END IF;

  -- Owner check mirrors the financing_rounds_owner_all RLS policy.
  -- With SECURITY DEFINER, RLS is bypassed — this check is the sole gate
  -- on write authorization, so do not remove it.
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = v_round.workspace_id;
  IF v_owner_user_id <> v_caller THEN
    RAISE EXCEPTION 'only the workspace owner can close a financing round';
  END IF;

  IF p_pre_money_valuation_sar IS NULL OR p_pre_money_valuation_sar <= 0 THEN
    RAISE EXCEPTION 'pre_money_valuation_sar must be positive';
  END IF;
  IF p_fd_shares_pre_round IS NULL OR p_fd_shares_pre_round <= 0 THEN
    RAISE EXCEPTION 'fd_shares_pre_round must be positive';
  END IF;
  IF p_close_date IS NULL THEN
    RAISE EXCEPTION 'close_date is required';
  END IF;

  IF p_promotions IS NULL OR jsonb_typeof(p_promotions) <> 'array' THEN
    RAISE EXCEPTION 'p_promotions must be a JSON array';
  END IF;
  IF p_conversions IS NULL OR jsonb_typeof(p_conversions) <> 'array' THEN
    RAISE EXCEPTION 'p_conversions must be a JSON array';
  END IF;

  SELECT email INTO v_actor_email FROM auth.users WHERE id = v_caller;

  -- Apply promotions: signed term-sheet investors land on the cap table.
  FOR v_promo IN SELECT * FROM jsonb_array_elements(p_promotions) LOOP
    INSERT INTO shareholders (
      workspace_id, name, email, entity_or_individual, entry_date,
      instrument_type, instrument_data, funding_round_id
    ) VALUES (
      v_round.workspace_id,
      v_promo->>'name',
      v_promo->>'email',
      (v_promo->>'entity_or_individual')::entity_or_individual,
      p_close_date,
      (v_promo->>'instrument_type')::instrument_type,
      COALESCE(v_promo->'instrument_data', '{}'::jsonb),
      p_round_id
    );

    IF v_promo ? 'pipeline_contact_id'
       AND NULLIF(v_promo->>'pipeline_contact_id', '') IS NOT NULL THEN
      UPDATE investor_pipeline
        SET status = 'invested', updated_at = NOW()
        WHERE id = (v_promo->>'pipeline_contact_id')::UUID
          AND workspace_id = v_round.workspace_id;
    END IF;

    v_promoted_count := v_promoted_count + 1;
  END LOOP;

  -- Apply conversions: iSAFE/SAFE/CN holders become ordinary, original row
  -- is marked converted (history preserved per existing flow).
  FOR v_conv IN SELECT * FROM jsonb_array_elements(p_conversions) LOOP
    INSERT INTO shareholders (
      workspace_id, name, email, entity_or_individual, entry_date,
      instrument_type, instrument_data, funding_round_id
    )
    SELECT
      v_round.workspace_id,
      orig.name,
      orig.email,
      orig.entity_or_individual,
      p_close_date,
      'ordinary'::instrument_type,
      jsonb_build_object(
        'shares',              v_conv->>'new_shares',
        'price_per_share_sar', v_conv->>'price_per_share_sar',
        'service_for_equity',  false,
        'service_note',        COALESCE(v_conv->>'service_note',
                                       'Converted on round close')
      ),
      p_round_id
    FROM shareholders orig
    WHERE orig.id = (v_conv->>'shareholder_id')::UUID
      AND orig.workspace_id = v_round.workspace_id
      AND orig.deleted_at IS NULL;

    UPDATE shareholders
      SET instrument_data = instrument_data
            || jsonb_build_object(
                 'conversion_status', 'converted',
                 'conversion_date',   p_close_date::text
               ),
          funding_round_id = p_round_id,
          updated_at       = NOW()
      WHERE id = (v_conv->>'shareholder_id')::UUID
        AND workspace_id = v_round.workspace_id
        AND deleted_at IS NULL;

    -- Per-conversion audit (entity_type='shareholder' — mutable, matches
    -- the existing pattern for shareholder edits).
    INSERT INTO audit_events (
      workspace_id, actor_user_id, actor_email,
      entity_type, entity_id, action, description, payload
    ) VALUES (
      v_round.workspace_id, v_caller, COALESCE(v_actor_email, '(no email)'),
      'shareholder',
      (v_conv->>'shareholder_id')::UUID,
      'shareholder.converted_on_round_close',
      'Converted ' || COALESCE(v_conv->>'from_instrument_type', '?')
        || ' to ordinary on round close',
      jsonb_build_object(
        'round_id',             p_round_id,
        'new_shares',           v_conv->>'new_shares',
        'price_per_share_sar',  v_conv->>'price_per_share_sar',
        'from_instrument_type', v_conv->>'from_instrument_type'
      )
    );

    v_converted_count := v_converted_count + 1;
  END LOOP;

  -- Close the round itself
  UPDATE financing_rounds
    SET status                  = 'closed',
        pre_money_valuation_sar = p_pre_money_valuation_sar,
        fd_shares_pre_round     = p_fd_shares_pre_round,
        actual_raise_sar        = p_actual_raise_sar,
        close_date              = p_close_date,
        updated_at              = NOW()
    WHERE id = p_round_id;

  -- Round-close audit (entity_type='financing_round' — IMMUTABLE)
  INSERT INTO audit_events (
    workspace_id, actor_user_id, actor_email,
    entity_type, entity_id, action, description, payload
  ) VALUES (
    v_round.workspace_id, v_caller, COALESCE(v_actor_email, '(no email)'),
    'financing_round',
    p_round_id,
    'financing_round.closed',
    'Closed round "' || v_round.name || '" — promoted ' || v_promoted_count
      || ', converted ' || v_converted_count,
    jsonb_build_object(
      'round_id',                 p_round_id,
      'pre_money_valuation_sar',  p_pre_money_valuation_sar,
      'fd_shares_pre_round',      p_fd_shares_pre_round,
      'actual_raise_sar',         p_actual_raise_sar,
      'close_date',               p_close_date::text,
      'promoted_count',           v_promoted_count,
      'converted_count',          v_converted_count
    )
  );

  RETURN jsonb_build_object(
    'success',         true,
    'round_id',        p_round_id,
    'promoted_count',  v_promoted_count,
    'converted_count', v_converted_count
  );
END;
$$;

COMMENT ON FUNCTION close_financing_round(UUID, NUMERIC, NUMERIC, NUMERIC, DATE, JSONB, JSONB) IS
  'Atomically apply a pre-computed round-close plan: insert promoted term-sheet investors as shareholders, convert iSAFE/SAFE/CN holders to ordinary, mark originals converted, close the round, and write the audit trail. Conversion share math is computed in TS (lib/cap-table/isafe-math, lib/rounds/conversion) for Sharia review compliance; this RPC is the atomicity layer only.';

GRANT EXECUTE ON FUNCTION close_financing_round(UUID, NUMERIC, NUMERIC, NUMERIC, DATE, JSONB, JSONB) TO authenticated;
