-- Regression fix per eng review D3 + design DT2: create_share_listing must
-- block when an open exit connection_listing exists in the workspace. The
-- collision rule is bidirectional — create_connection_listing already
-- blocks when open share_listings exist (see 20260516000004_connections_hub.sql).
--
-- This replaces the function from 20260516000002_marketplace_rpcs.sql with
-- an extended version that adds one new guard clause. All other behavior is
-- preserved verbatim.

CREATE OR REPLACE FUNCTION create_share_listing(
  p_workspace_id   UUID,
  p_shareholder_id UUID,
  p_shares_offered NUMERIC,
  p_ask_price_sar  NUMERIC,
  p_notes          TEXT,
  p_expires_at     TIMESTAMPTZ,
  p_rofr_window    INTERVAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner_user_id  UUID;
  v_held_shares    NUMERIC;
  v_listing_id     UUID;
  v_open_exit      INTEGER;
  v_now            TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = p_workspace_id;
  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'workspace not found';
  END IF;
  IF v_owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the workspace owner can list shares';
  END IF;

  -- Bidirectional collision: block share listings when an open exit
  -- connection_listing exists. Whole-company sale supersedes individual
  -- share sales.
  SELECT COUNT(*) INTO v_open_exit
    FROM connection_listings
    WHERE workspace_id = p_workspace_id
      AND listing_type = 'exit'
      AND status = 'open'
      AND deleted_at IS NULL;
  IF v_open_exit > 0 THEN
    RAISE EXCEPTION 'cannot create share listing while an open exit listing exists; withdraw the exit listing first';
  END IF;

  SELECT (instrument_data->>'shares')::NUMERIC INTO v_held_shares
    FROM shareholders
    WHERE id = p_shareholder_id
      AND workspace_id = p_workspace_id
      AND deleted_at IS NULL
      AND instrument_type = 'ordinary';
  IF v_held_shares IS NULL THEN
    RAISE EXCEPTION 'shareholder not found or not an ordinary-share holder';
  END IF;
  IF v_held_shares < p_shares_offered THEN
    RAISE EXCEPTION 'shares_offered (%) exceeds held shares (%)', p_shares_offered, v_held_shares;
  END IF;
  IF p_ask_price_sar <= 0 THEN
    RAISE EXCEPTION 'ask_price_sar must be positive';
  END IF;

  INSERT INTO share_listings (
    workspace_id, shareholder_id, seller_user_id,
    shares_offered, ask_price_sar, notes, expires_at, listed_at
  ) VALUES (
    p_workspace_id, p_shareholder_id, auth.uid(),
    p_shares_offered, p_ask_price_sar, p_notes, p_expires_at, v_now
  )
  RETURNING id INTO v_listing_id;

  INSERT INTO rofr_notifications (
    workspace_id, listing_id, notified_shareholder_id, notified_email, window_expires_at
  )
  SELECT
    p_workspace_id,
    v_listing_id,
    s.id,
    s.email,
    v_now + p_rofr_window
  FROM shareholders s
  WHERE s.workspace_id = p_workspace_id
    AND s.id <> p_shareholder_id
    AND s.deleted_at IS NULL
    AND s.instrument_type = 'ordinary';

  RETURN v_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_share_listing(UUID, UUID, NUMERIC, NUMERIC, TEXT, TIMESTAMPTZ, INTERVAL) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION create_share_listing(UUID, UUID, NUMERIC, NUMERIC, TEXT, TIMESTAMPTZ, INTERVAL) TO authenticated;
