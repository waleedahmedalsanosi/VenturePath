-- transfer_agent_cap_table_sync: REQ-TRADE-02
-- Replaces mark_share_listing_sold_off_platform with an extended version that
-- optionally syncs the cap table when buyer details are provided.
--
-- Auth pattern: SECURITY DEFINER (mirrors close_financing_round) so we can
-- read auth.users for actor_email and bypass RLS on cap-table writes.
-- Ownership check is explicit (same gate used in every other SECURITY DEFINER RPC).
--
-- instrument_data convention: ordinary-share rows store numeric values as
-- JSON strings (e.g. {"shares":"1000","price_per_share_sar":"10"}).
-- All NUMERIC↔JSONB conversions cast through TEXT to preserve that convention.
--
-- audit_events: entity_type='shareholder' is used for the cap-table mutation
-- audit row — matches the existing pattern from close_financing_round and is
-- within the CHECK constraint. 'cap_table_mutation' is NOT in the allowed set.

CREATE OR REPLACE FUNCTION mark_share_listing_sold_off_platform(
  p_listing_id     UUID,
  p_buyer_name     TEXT    DEFAULT NULL,
  p_buyer_email    TEXT    DEFAULT NULL,
  p_sale_price_sar NUMERIC DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller          UUID    := auth.uid();
  v_actor_email     TEXT;
  v_listing         RECORD;
  v_owner_user_id   UUID;
  v_seller_row      RECORD;
  v_seller_shares   NUMERIC;
  v_new_shares      NUMERIC;
  v_new_sh_id       UUID    := NULL;
  v_cap_updated     BOOLEAN := FALSE;
BEGIN
  -- ── Auth ────────────────────────────────────────────────────────────────────
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- ── Lock + read listing ─────────────────────────────────────────────────────
  SELECT sl.id, sl.workspace_id, sl.shareholder_id, sl.seller_user_id,
         sl.status, sl.shares_offered, sl.ask_price_sar, sl.deleted_at
    INTO v_listing
    FROM share_listings sl
    WHERE sl.id = p_listing_id
    FOR UPDATE;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF v_listing.deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF v_listing.status <> 'open' THEN
    RAISE EXCEPTION 'listing is % — cannot mark sold', v_listing.status;
  END IF;

  -- ── Ownership check ─────────────────────────────────────────────────────────
  -- SECURITY DEFINER bypasses RLS — this is the sole write-authorization gate.
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = v_listing.workspace_id;
  IF v_owner_user_id <> v_caller THEN
    RAISE EXCEPTION 'only the workspace owner can mark a listing as sold';
  END IF;

  -- ── Mark listing sold ────────────────────────────────────────────────────────
  UPDATE share_listings
    SET status       = 'sold_off_platform',
        closed_at    = NOW(),
        closed_reason = 'sold_off_platform'
    WHERE id = p_listing_id;

  -- ── Optional cap-table sync ──────────────────────────────────────────────────
  IF p_buyer_name IS NOT NULL AND p_buyer_email IS NOT NULL THEN

    -- Read seller's existing ordinary-share row (the one used for this listing).
    SELECT s.id, s.name, s.email, s.entity_or_individual, s.instrument_data
      INTO v_seller_row
      FROM shareholders s
      WHERE s.id = v_listing.shareholder_id
        AND s.workspace_id = v_listing.workspace_id
        AND s.deleted_at IS NULL
        AND s.instrument_type = 'ordinary';

    IF v_seller_row.id IS NULL THEN
      RAISE EXCEPTION 'seller shareholder row not found or not an ordinary-share holder';
    END IF;

    IF v_seller_row.instrument_data->>'shares' IS NULL THEN
      RAISE EXCEPTION 'seller instrument_data has no shares field';
    END IF;

    v_seller_shares := (v_seller_row.instrument_data->>'shares')::NUMERIC;
    v_new_shares    := v_seller_shares - v_listing.shares_offered;

    IF v_new_shares < 0 THEN
      RAISE EXCEPTION 'seller does not have enough shares (has %, listing offers %)',
        v_seller_shares, v_listing.shares_offered;
    END IF;

    -- Update or soft-delete the seller row.
    IF v_new_shares = 0 THEN
      UPDATE shareholders
        SET deleted_at = NOW(),
            updated_at = NOW()
        WHERE id = v_seller_row.id;
    ELSE
      UPDATE shareholders
        SET instrument_data = instrument_data ||
              jsonb_build_object('shares', v_new_shares::TEXT),
            updated_at = NOW()
        WHERE id = v_seller_row.id;
    END IF;

    -- Insert buyer shareholder row.
    INSERT INTO shareholders (
      workspace_id,
      name,
      email,
      entity_or_individual,
      entry_date,
      instrument_type,
      instrument_data
    ) VALUES (
      v_listing.workspace_id,
      p_buyer_name,
      p_buyer_email,
      'individual',
      NOW()::DATE,
      'ordinary',
      jsonb_build_object(
        'shares',              v_listing.shares_offered::TEXT,
        'price_per_share_sar', COALESCE(
                                 (p_sale_price_sar / NULLIF(v_listing.shares_offered, 0))::TEXT,
                                 v_seller_row.instrument_data->>'price_per_share_sar'
                               ),
        'acquired_via',        'secondary_sale',
        'listing_id',          p_listing_id::TEXT
      )
    )
    RETURNING id INTO v_new_sh_id;

    -- Audit row for the cap-table mutation.
    -- entity_type='shareholder' matches the CHECK constraint and the
    -- close_financing_round pattern.
    SELECT email INTO v_actor_email FROM auth.users WHERE id = v_caller;

    INSERT INTO audit_events (
      workspace_id, actor_user_id, actor_email,
      entity_type, entity_id, action, description, payload
    ) VALUES (
      v_listing.workspace_id,
      v_caller,
      COALESCE(v_actor_email, '(no email)'),
      'shareholder',
      v_new_sh_id,
      'secondary_sale_recorded',
      'Cap table updated via secondary sale — seller: ' || v_seller_row.name
        || ', buyer: ' || p_buyer_name
        || ', shares: ' || v_listing.shares_offered::TEXT,
      jsonb_build_object(
        'listing_id',     p_listing_id,
        'seller_id',      v_seller_row.id,
        'buyer_id',       v_new_sh_id,
        'shares',         v_listing.shares_offered,
        'sale_price_sar', p_sale_price_sar
      )
    );

    v_cap_updated := TRUE;
  END IF;

  -- ── Return ───────────────────────────────────────────────────────────────────
  RETURN json_build_object(
    'success',           TRUE,
    'listing_id',        p_listing_id,
    'cap_table_updated', v_cap_updated,
    'new_shareholder_id', v_new_sh_id
  );
END;
$$;

COMMENT ON FUNCTION mark_share_listing_sold_off_platform(UUID, TEXT, TEXT, NUMERIC) IS
  'Mark a share listing as sold off-platform. If p_buyer_name and p_buyer_email are '
  'provided, atomically syncs the cap table: decrements (or soft-deletes) the seller '
  'ordinary-share row and inserts a new shareholder row for the buyer. '
  'Writes a shareholder audit event when cap-table sync is performed. '
  'REQ-TRADE-02.';

REVOKE EXECUTE ON FUNCTION mark_share_listing_sold_off_platform(UUID, TEXT, TEXT, NUMERIC) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION mark_share_listing_sold_off_platform(UUID, TEXT, TEXT, NUMERIC) TO authenticated;
