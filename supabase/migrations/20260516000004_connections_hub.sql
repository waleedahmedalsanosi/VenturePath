-- connection_listings + connection_inquiries: unified Exit + Partnership marketplace.
-- Per office-hours + eng review + design review on 2026-05-16.
--
-- Two listing types ('exit', 'partnership') share one schema with type-specific
-- fields in a JSONB blob (validated by RPC, not DB constraints — matches the
-- shareholders.instrument_data pattern). Cross-workspace browse (Saif sees
-- Samir's listing) is the key departure from the workspace-private share
-- marketplace. Closing happens off-platform; the platform's job is to
-- broker the contact reveal.

-- ── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS connection_listings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_user_id   UUID        NOT NULL REFERENCES auth.users(id),
  listing_type    TEXT        NOT NULL
                  CHECK (listing_type IN ('exit', 'partnership')),
  status          TEXT        NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'withdrawn')),
  -- Public-facing summary visible to anyone browsing the hub.
  public_summary  TEXT        NOT NULL CHECK (char_length(public_summary) <= 500),
  -- Type-specific structured data, validated in the create RPC:
  --   exit:        { ask_type, ask_amount_sar?, sector?, stage? }
  --   partnership: { seeking_type, skills[], equity_expectations?, commitment_type }
  type_data       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  notes           TEXT        CHECK (notes IS NULL OR char_length(notes) <= 1000),
  listed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  closed_reason   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS connection_inquiries (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id               UUID        NOT NULL REFERENCES connection_listings(id) ON DELETE CASCADE,
  inquirer_user_id         UUID        NOT NULL REFERENCES auth.users(id),
  inquirer_workspace_id    UUID        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  status                   TEXT        NOT NULL DEFAULT 'sent'
                           CHECK (status IN ('sent', 'accepted', 'declined', 'closed')),
  message                  TEXT        CHECK (message IS NULL OR char_length(message) <= 500),
  -- Set when status moves to 'accepted'. References a data_room_links row
  -- created at accept time (signed token grants scoped data room read).
  data_room_link_id        UUID        REFERENCES data_room_links(id) ON DELETE SET NULL,
  sent_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at             TIMESTAMPTZ,
  closed_at                TIMESTAMPTZ,
  closed_by_user_id        UUID        REFERENCES auth.users(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at               TIMESTAMPTZ,
  -- One pending or active inquiry per (listing, inquirer) pair. Inquirers can
  -- send a new inquiry after a previous one is closed (rare but valid: re-
  -- engage months later). Enforced via partial unique index below.
  CHECK (
    (status = 'closed' AND closed_by_user_id IS NOT NULL)
    OR status <> 'closed'
  )
);

-- Cross-workspace browse index (read-hot path: /connections page).
-- Per eng review D8: no workspace_id prefix because the browse query has no
-- workspace_id predicate.
CREATE INDEX IF NOT EXISTS connection_listings_browse_idx
  ON connection_listings (listing_type, status, listed_at DESC)
  WHERE deleted_at IS NULL AND status = 'open';

-- Owner management view: "show me my workspace's listings."
CREATE INDEX IF NOT EXISTS connection_listings_workspace_idx
  ON connection_listings (workspace_id, status)
  WHERE deleted_at IS NULL;

-- Inquiry indexes
CREATE INDEX IF NOT EXISTS connection_inquiries_listing_idx
  ON connection_inquiries (listing_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS connection_inquiries_inquirer_idx
  ON connection_inquiries (inquirer_user_id, listing_id)
  WHERE deleted_at IS NULL;
-- Block duplicate "live" inquiries (sent/accepted) from the same inquirer on
-- the same listing. After closed/declined, a new inquiry is allowed.
CREATE UNIQUE INDEX IF NOT EXISTS connection_inquiries_unique_live_idx
  ON connection_inquiries (listing_id, inquirer_user_id)
  WHERE deleted_at IS NULL AND status IN ('sent', 'accepted');

COMMENT ON TABLE connection_listings IS
  'Cross-workspace marketplace listings for whole-company exits and founder partnerships. Workspace-owned, cross-workspace readable. No fund movement; off-platform closing.';
COMMENT ON TABLE connection_inquiries IS
  'Inquiries on connection_listings. One-step accept (owner accepts → both parties get contact + signed data-room token via email). Bidirectional close after accept.';
COMMENT ON COLUMN connection_listings.type_data IS
  'JSONB. exit: { ask_type, ask_amount_sar?, sector?, stage? }. partnership: { seeking_type, skills[], equity_expectations?, commitment_type }. Validated in create RPC.';

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE connection_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_inquiries ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user who has at least one workspace (owner OR member).
-- Cross-workspace browse is the whole point.
CREATE POLICY "connection_listings_workspace_verified_read"
  ON connection_listings FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
      UNION
      SELECT 1 FROM workspace_members WHERE user_id = (SELECT auth.uid())
    )
  );

-- Write: only the workspace owner.
CREATE POLICY "connection_listings_owner_write"
  ON connection_listings FOR ALL TO authenticated
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

-- Inquiries: visible to (a) the listing owner workspace and (b) the inquirer
-- workspace. Write via RPCs only.
CREATE POLICY "connection_inquiries_visible_to_parties"
  ON connection_inquiries FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      inquirer_workspace_id IN (
        SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
      )
      OR listing_id IN (
        SELECT cl.id FROM connection_listings cl
        WHERE cl.workspace_id IN (
          SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- ── updated_at triggers ─────────────────────────────────────────────────────

CREATE TRIGGER connection_listings_updated_at
  BEFORE UPDATE ON connection_listings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER connection_inquiries_updated_at
  BEFORE UPDATE ON connection_inquiries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── audit_events: extend constraint + immutability ─────────────────────────

ALTER TABLE audit_events DROP CONSTRAINT IF EXISTS audit_events_entity_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_entity_type_check
  CHECK (entity_type IN (
    'workspace', 'shareholder', 'document', 'compliance_obligation',
    'share_listing', 'rofr_notification',
    'connection_listing', 'connection_inquiry'
  ));

-- Extend the immutability trigger to cover connection entities.
CREATE OR REPLACE FUNCTION audit_events_block_marketplace_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.entity_type IN ('share_listing', 'rofr_notification',
                            'connection_listing', 'connection_inquiry') THEN
      RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF NEW.entity_type IN ('share_listing', 'rofr_notification',
                          'connection_listing', 'connection_inquiry')
     OR OLD.entity_type IN ('share_listing', 'rofr_notification',
                             'connection_listing', 'connection_inquiry') THEN
    RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
  END IF;
  RETURN NEW;
END;
$$;

-- ── RPCs ───────────────────────────────────────────────────────────────────

-- create_connection_listing: workspace-owner-only. Enforces:
-- 1. Listing type is valid.
-- 2. Exit collision: no open share_listings in workspace.
-- 3. Exit uniqueness: at most one open exit listing per workspace.
-- 4. Type-collision: no open exit when creating partnership, no open
--    partnership when creating exit. (Per design review DT2.)
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
  v_owner_user_id UUID;
  v_listing_id    UUID;
  v_open_share    INTEGER;
  v_open_exit     INTEGER;
  v_open_partner  INTEGER;
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
    public_summary, type_data, notes
  ) VALUES (
    p_workspace_id, auth.uid(), p_listing_type,
    p_public_summary, COALESCE(p_type_data, '{}'::jsonb), p_notes
  )
  RETURNING id INTO v_listing_id;

  RETURN v_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_connection_listing(UUID, TEXT, TEXT, JSONB, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION create_connection_listing(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;

-- withdraw_connection_listing: workspace owner only.
CREATE OR REPLACE FUNCTION withdraw_connection_listing(
  p_listing_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner  UUID;
  v_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT cl.owner_user_id, cl.status
    INTO v_owner, v_status
    FROM connection_listings cl
    WHERE cl.id = p_listing_id AND cl.deleted_at IS NULL
    FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'only the listing owner can withdraw';
  END IF;
  IF v_status <> 'open' THEN
    RAISE EXCEPTION 'listing is % — cannot withdraw', v_status;
  END IF;

  UPDATE connection_listings
    SET status = 'withdrawn',
        closed_at = NOW(),
        closed_reason = p_reason
    WHERE id = p_listing_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION withdraw_connection_listing(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION withdraw_connection_listing(UUID, TEXT) TO authenticated;

-- send_connection_inquiry: authenticated user with a workspace inquires on
-- an open listing. Blocks self-inquiry and duplicate inquiry.
CREATE OR REPLACE FUNCTION send_connection_inquiry(
  p_listing_id           UUID,
  p_inquirer_workspace_id UUID,
  p_message              TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_listing_workspace UUID;
  v_listing_status    TEXT;
  v_inquirer_owner    UUID;
  v_inquiry_id        UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Verify the inquirer owns the workspace they're inquiring from.
  SELECT owner_user_id INTO v_inquirer_owner
    FROM workspaces WHERE id = p_inquirer_workspace_id;
  IF v_inquirer_owner IS NULL THEN
    RAISE EXCEPTION 'inquirer workspace not found';
  END IF;
  IF v_inquirer_owner <> auth.uid() THEN
    RAISE EXCEPTION 'inquirer must own the workspace they inquire from';
  END IF;

  -- Verify the listing is open.
  SELECT workspace_id, status INTO v_listing_workspace, v_listing_status
    FROM connection_listings
    WHERE id = p_listing_id AND deleted_at IS NULL
    FOR UPDATE;
  IF v_listing_workspace IS NULL THEN
    RAISE EXCEPTION 'listing not found';
  END IF;
  IF v_listing_status <> 'open' THEN
    RAISE EXCEPTION 'listing is %; cannot send inquiry', v_listing_status;
  END IF;

  -- Block self-inquiry.
  IF v_listing_workspace = p_inquirer_workspace_id THEN
    RAISE EXCEPTION 'cannot inquire on your own workspace listing';
  END IF;

  -- Duplicate guard: the unique index blocks live inquiries, but we
  -- surface a friendlier error here.
  IF EXISTS (
    SELECT 1 FROM connection_inquiries
    WHERE listing_id = p_listing_id
      AND inquirer_user_id = auth.uid()
      AND status IN ('sent', 'accepted')
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'you already have an active inquiry on this listing';
  END IF;

  INSERT INTO connection_inquiries (
    listing_id, inquirer_user_id, inquirer_workspace_id, message
  ) VALUES (
    p_listing_id, auth.uid(), p_inquirer_workspace_id, p_message
  )
  RETURNING id INTO v_inquiry_id;

  RETURN v_inquiry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION send_connection_inquiry(UUID, UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION send_connection_inquiry(UUID, UUID, TEXT) TO authenticated;

-- accept_connection_inquiry: listing owner accepts an inquiry, creates a
-- scoped data_room_link with the configured access tier, and the application
-- layer fans out emails to both parties.
CREATE OR REPLACE FUNCTION accept_connection_inquiry(
  p_inquiry_id        UUID,
  p_data_room_round_id UUID,   -- optional; data_room_links can be workspace-wide
  p_access_tier       TEXT,    -- 'intro' | 'standard' | 'diligence'
  p_token_ttl_days    INTEGER  -- e.g. 14
)
RETURNS TABLE (
  inquiry_id         UUID,
  data_room_token    TEXT,
  data_room_link_id  UUID
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_listing_id        UUID;
  v_listing_owner     UUID;
  v_listing_workspace UUID;
  v_status            TEXT;
  v_link_id           UUID;
  v_token             TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_access_tier NOT IN ('intro', 'standard', 'diligence') THEN
    RAISE EXCEPTION 'invalid access_tier: %', p_access_tier;
  END IF;

  IF p_token_ttl_days IS NULL OR p_token_ttl_days < 1 OR p_token_ttl_days > 90 THEN
    RAISE EXCEPTION 'token_ttl_days must be between 1 and 90';
  END IF;

  -- Lock the inquiry + listing for the duration.
  SELECT ci.listing_id, ci.status
    INTO v_listing_id, v_status
    FROM connection_inquiries ci
    WHERE ci.id = p_inquiry_id AND ci.deleted_at IS NULL
    FOR UPDATE;

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'inquiry not found';
  END IF;
  IF v_status <> 'sent' THEN
    RAISE EXCEPTION 'inquiry is %; cannot accept', v_status;
  END IF;

  SELECT owner_user_id, workspace_id
    INTO v_listing_owner, v_listing_workspace
    FROM connection_listings WHERE id = v_listing_id;

  IF v_listing_owner <> auth.uid() THEN
    RAISE EXCEPTION 'only the listing owner can accept';
  END IF;

  -- Create a scoped data_room_link for the inquirer.
  INSERT INTO data_room_links (
    workspace_id, round_id, label, expires_at, access_tier
  ) VALUES (
    v_listing_workspace,
    p_data_room_round_id,
    'Connection inquiry access',
    NOW() + (p_token_ttl_days || ' days')::INTERVAL,
    p_access_tier::data_room_tier
  )
  RETURNING id, token INTO v_link_id, v_token;

  UPDATE connection_inquiries
    SET status = 'accepted',
        data_room_link_id = v_link_id,
        responded_at = NOW()
    WHERE id = p_inquiry_id;

  RETURN QUERY SELECT p_inquiry_id, v_token, v_link_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION accept_connection_inquiry(UUID, UUID, TEXT, INTEGER) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION accept_connection_inquiry(UUID, UUID, TEXT, INTEGER) TO authenticated;

-- decline_connection_inquiry: listing owner declines an open inquiry.
CREATE OR REPLACE FUNCTION decline_connection_inquiry(
  p_inquiry_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_listing_id     UUID;
  v_status         TEXT;
  v_listing_owner  UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ci.listing_id, ci.status
    INTO v_listing_id, v_status
    FROM connection_inquiries ci
    WHERE ci.id = p_inquiry_id AND ci.deleted_at IS NULL
    FOR UPDATE;
  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'inquiry not found';
  END IF;
  IF v_status <> 'sent' THEN
    RAISE EXCEPTION 'inquiry is %; cannot decline', v_status;
  END IF;

  SELECT owner_user_id INTO v_listing_owner
    FROM connection_listings WHERE id = v_listing_id;
  IF v_listing_owner <> auth.uid() THEN
    RAISE EXCEPTION 'only the listing owner can decline';
  END IF;

  UPDATE connection_inquiries
    SET status = 'declined',
        responded_at = NOW(),
        closed_at = NOW(),
        closed_reason = p_reason,
        closed_by_user_id = auth.uid()
    WHERE id = p_inquiry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION decline_connection_inquiry(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION decline_connection_inquiry(UUID, TEXT) TO authenticated;

-- close_connection_inquiry: actor-constrained per design DT4.
--   inquirer: can close only if status = 'accepted'
--   owner:    can close if status IN ('sent', 'accepted')
--   nobody:   can close 'declined' (terminal) or 'closed' (idempotent no-op).
CREATE OR REPLACE FUNCTION close_connection_inquiry(
  p_inquiry_id UUID,
  p_reason     TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_listing_id     UUID;
  v_status         TEXT;
  v_inquirer       UUID;
  v_listing_owner  UUID;
  v_is_owner       BOOLEAN;
  v_is_inquirer    BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT ci.listing_id, ci.status, ci.inquirer_user_id
    INTO v_listing_id, v_status, v_inquirer
    FROM connection_inquiries ci
    WHERE ci.id = p_inquiry_id AND ci.deleted_at IS NULL
    FOR UPDATE;
  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'inquiry not found';
  END IF;

  SELECT owner_user_id INTO v_listing_owner
    FROM connection_listings WHERE id = v_listing_id;

  v_is_owner    := (v_listing_owner = auth.uid());
  v_is_inquirer := (v_inquirer = auth.uid());

  IF NOT (v_is_owner OR v_is_inquirer) THEN
    RAISE EXCEPTION 'only the listing owner or inquirer can close';
  END IF;

  IF v_status = 'closed' THEN
    -- idempotent: already closed, no-op.
    RETURN;
  END IF;

  IF v_status = 'declined' THEN
    RAISE EXCEPTION 'inquiry is declined (terminal); cannot close';
  END IF;

  IF v_is_inquirer AND NOT v_is_owner AND v_status <> 'accepted' THEN
    RAISE EXCEPTION 'inquirer can only close an accepted inquiry; current status is %', v_status;
  END IF;

  UPDATE connection_inquiries
    SET status = 'closed',
        closed_at = NOW(),
        closed_reason = p_reason,
        closed_by_user_id = auth.uid()
    WHERE id = p_inquiry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION close_connection_inquiry(UUID, TEXT) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION close_connection_inquiry(UUID, TEXT) TO authenticated;
