-- REQ-PART-01: Promote seeking_type to a first-class indexed column.
-- Backward-compatible: type_data->>'seeking_type' is still preserved in JSONB.
-- The new column is populated on insert via the updated create_connection_listing RPC
-- and backfilled for existing partnership rows.

-- ── 1. Add column ───────────────────────────────────────────────────────────

ALTER TABLE public.connection_listings
  ADD COLUMN IF NOT EXISTS seeking_type TEXT
  CHECK (seeking_type IS NULL OR seeking_type IN (
    'co_founder', 'advisor', 'senior_hire', 'business_partner'
  ));

-- ── 2. Backfill from existing JSONB ─────────────────────────────────────────

UPDATE public.connection_listings
SET seeking_type = type_data->>'seeking_type'
WHERE listing_type = 'partnership'
  AND type_data->>'seeking_type' IS NOT NULL
  AND seeking_type IS NULL
  AND deleted_at IS NULL;

-- ── 3. Partial index for the hot browse path ─────────────────────────────────

CREATE INDEX IF NOT EXISTS connection_listings_seeking_type_idx
  ON public.connection_listings (seeking_type, status, listed_at DESC)
  WHERE deleted_at IS NULL
    AND listing_type = 'partnership'
    AND seeking_type IS NOT NULL;

-- ── 4. Update create_connection_listing RPC ──────────────────────────────────
-- Same signature; adds seeking_type column population for partnership listings.
-- Validates seeking_type against allowed values before insert.

CREATE OR REPLACE FUNCTION create_connection_listing(
  p_workspace_id   UUID,
  p_listing_type   TEXT,
  p_public_summary TEXT,
  p_type_data      JSONB,
  p_notes          TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner_user_id  UUID;
  v_listing_id     UUID;
  v_open_share     INTEGER;
  v_open_exit      INTEGER;
  v_open_partner   INTEGER;
  v_seeking_type   TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_listing_type NOT IN ('exit', 'partnership') THEN
    RAISE EXCEPTION 'invalid listing_type: %', p_listing_type;
  END IF;

  IF p_public_summary IS NULL OR char_length(trim(p_public_summary)) = 0 THEN
    RAISE EXCEPTION 'public_summary is required';
  END IF;

  -- Workspace ownership check.
  SELECT owner_user_id INTO v_owner_user_id
    FROM workspaces WHERE id = p_workspace_id
    FOR UPDATE;
  IF v_owner_user_id IS NULL THEN
    RAISE EXCEPTION 'workspace not found';
  END IF;
  IF v_owner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'only the workspace owner can create a connection listing';
  END IF;

  -- Partnership-specific: extract and validate seeking_type.
  IF p_listing_type = 'partnership' THEN
    v_seeking_type := COALESCE(p_type_data, '{}'::jsonb)->>'seeking_type';
    IF v_seeking_type IS NULL THEN
      RAISE EXCEPTION 'partnership listings require seeking_type in type_data';
    END IF;
    IF v_seeking_type NOT IN ('co_founder', 'advisor', 'senior_hire', 'business_partner') THEN
      RAISE EXCEPTION 'invalid seeking_type: %; must be one of co_founder, advisor, senior_hire, business_partner', v_seeking_type;
    END IF;
  END IF;

  -- Collision: exit listings cannot coexist with open share_listings.
  IF p_listing_type = 'exit' THEN
    SELECT COUNT(*) INTO v_open_share
      FROM share_listings
      WHERE workspace_id = p_workspace_id
        AND status = 'open'
        AND deleted_at IS NULL;
    IF v_open_share > 0 THEN
      RAISE EXCEPTION 'cannot create exit listing while open share listings exist; withdraw or close them first';
    END IF;
  END IF;

  -- Type-collision: exit and partnership cannot coexist in same workspace.
  SELECT COUNT(*) INTO v_open_exit
    FROM connection_listings
    WHERE workspace_id = p_workspace_id
      AND listing_type = 'exit'
      AND status = 'open'
      AND deleted_at IS NULL;
  SELECT COUNT(*) INTO v_open_partner
    FROM connection_listings
    WHERE workspace_id = p_workspace_id
      AND listing_type = 'partnership'
      AND status = 'open'
      AND deleted_at IS NULL;

  IF p_listing_type = 'exit' AND v_open_exit > 0 THEN
    RAISE EXCEPTION 'an open exit listing already exists for this workspace';
  END IF;
  IF p_listing_type = 'exit' AND v_open_partner > 0 THEN
    RAISE EXCEPTION 'cannot create exit listing while an open partnership listing exists';
  END IF;
  IF p_listing_type = 'partnership' AND v_open_exit > 0 THEN
    RAISE EXCEPTION 'cannot create partnership listing while an open exit listing exists';
  END IF;

  INSERT INTO connection_listings (
    workspace_id, owner_user_id, listing_type,
    public_summary, type_data, notes, seeking_type
  ) VALUES (
    p_workspace_id, auth.uid(), p_listing_type,
    p_public_summary, COALESCE(p_type_data, '{}'::jsonb), p_notes,
    v_seeking_type
  )
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_connection_listing(UUID, TEXT, TEXT, JSONB, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION create_connection_listing(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;
