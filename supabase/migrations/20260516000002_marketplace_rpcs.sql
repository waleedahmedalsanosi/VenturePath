-- marketplace_rpcs: atomic state transitions for share_listings.
-- Per eng review CQ2 (atomic Postgres RPCs): server actions wrap business
-- logic in a single RPC call so concurrent updates can't race (e.g. two
-- co-shareholders responding to ROFR simultaneously, or a buyer accepting
-- while a seller withdraws).

-- create_share_listing: validates ownership against shareholders.instrument_data,
-- inserts the listing, and fans out rofr_notifications to every other
-- shareholder in the workspace in one transaction. Returns the new listing id.
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
  v_owner_user_id UUID;
  v_held_shares   NUMERIC;
  v_listing_id    UUID;
  v_now           TIMESTAMPTZ := NOW();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Workspace ownership check (RLS would also catch this, but failing fast
  -- with a clear error beats a silent zero-row insert).
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = p_workspace_id;
  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'workspace not found';
  END IF;
  IF v_owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the workspace owner can list shares';
  END IF;

  -- Verify shareholder belongs to the workspace and has enough shares.
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

  -- Fan out ROFR notifications to every other ordinary-share holder.
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

-- withdraw_share_listing: only the seller (or workspace owner) can withdraw,
-- and only an 'open' listing. Idempotent on already-withdrawn.
CREATE OR REPLACE FUNCTION withdraw_share_listing(
  p_listing_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_seller UUID;
  v_status TEXT;
  v_owner  UUID;
  v_ws     UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT sl.seller_user_id, sl.status, sl.workspace_id, w.owner_user_id
    INTO v_seller, v_status, v_ws, v_owner
    FROM share_listings sl
    JOIN workspaces w ON w.id = sl.workspace_id
    WHERE sl.id = p_listing_id
      AND sl.deleted_at IS NULL
    FOR UPDATE;

  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF auth.uid() <> v_seller AND auth.uid() <> v_owner THEN
    RAISE EXCEPTION 'only the seller or workspace owner can withdraw';
  END IF;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'listing is % — cannot withdraw', v_status;
  END IF;

  UPDATE share_listings
    SET status = 'withdrawn',
        closed_at = NOW(),
        closed_reason = p_reason
    WHERE id = p_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION withdraw_share_listing(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION withdraw_share_listing(UUID, TEXT) TO authenticated;

-- mark_share_listing_sold_off_platform: seller confirms closing happened
-- outside VenturePath (lawyer-led SPA). Captures the closing reason for
-- later audit + analytics (kill-criteria tile).
CREATE OR REPLACE FUNCTION mark_share_listing_sold_off_platform(
  p_listing_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_seller UUID;
  v_status TEXT;
  v_owner  UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT sl.seller_user_id, sl.status, w.owner_user_id
    INTO v_seller, v_status, v_owner
    FROM share_listings sl
    JOIN workspaces w ON w.id = sl.workspace_id
    WHERE sl.id = p_listing_id
      AND sl.deleted_at IS NULL
    FOR UPDATE;

  IF v_seller IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF auth.uid() <> v_seller AND auth.uid() <> v_owner THEN
    RAISE EXCEPTION 'only the seller or workspace owner can mark sold';
  END IF;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'listing is % — cannot mark sold', v_status;
  END IF;

  UPDATE share_listings
    SET status = 'sold_off_platform',
        closed_at = NOW(),
        closed_reason = p_reason
    WHERE id = p_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION mark_share_listing_sold_off_platform(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION mark_share_listing_sold_off_platform(UUID, TEXT) TO authenticated;

-- record_rofr_response: idempotent recording of a shareholder's ROFR
-- response (exercise or decline). Rejects if the window expired.
CREATE OR REPLACE FUNCTION record_rofr_response(
  p_notification_id UUID,
  p_response        TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_existing TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_response NOT IN ('exercise', 'decline') THEN
    RAISE EXCEPTION 'response must be exercise or decline';
  END IF;

  SELECT window_expires_at, response
    INTO v_window, v_existing
    FROM rofr_notifications
    WHERE id = p_notification_id
    FOR UPDATE;

  IF v_window IS NULL THEN
    RAISE EXCEPTION 'rofr notification not found';
  END IF;
  IF v_existing IS NOT NULL THEN
    RAISE EXCEPTION 'response already recorded as %', v_existing;
  END IF;
  IF NOW() > v_window THEN
    RAISE EXCEPTION 'rofr window expired at %', v_window;
  END IF;

  UPDATE rofr_notifications
    SET response = p_response,
        responded_at = NOW(),
        responded_by_user_id = auth.uid()
    WHERE id = p_notification_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_rofr_response(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION record_rofr_response(UUID, TEXT) TO authenticated;
