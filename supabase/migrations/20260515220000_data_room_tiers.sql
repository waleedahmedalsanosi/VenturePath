-- ── 3-tier data room access ─────────────────────────────────────────────────
-- Documents in the data room can be tagged intro / standard / diligence.
-- Each shared link carries an access_tier; the get_data_room RPC filters
-- docs to only those at or below the link's tier.
--
--  intro      → only intro docs visible
--  standard   → intro + standard docs visible
--  diligence  → intro + standard + diligence docs visible
--  (public docs are always visible regardless of tier)

CREATE TYPE data_room_tier AS ENUM ('intro', 'standard', 'diligence');

-- Per-document tier (only meaningful when visibility = 'data_room').
-- Defaults to 'intro' — safest for existing rows.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS data_room_tier data_room_tier NOT NULL DEFAULT 'intro';

-- Per-link access tier.
ALTER TABLE data_room_links
  ADD COLUMN IF NOT EXISTS access_tier data_room_tier NOT NULL DEFAULT 'intro';

-- Replace the RPC to filter by tier.
CREATE OR REPLACE FUNCTION get_data_room(p_token text)
RETURNS TABLE (
  workspace_name  text,
  round_name      text,
  round_status    text,
  access_tier     text,
  doc_id          uuid,
  doc_name        text,
  doc_size_bytes  bigint,
  doc_mime_type   text,
  doc_created_at  timestamptz,
  doc_tier        text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql AS $$
  SELECT
    w.name               AS workspace_name,
    r.name               AS round_name,
    r.status             AS round_status,
    l.access_tier::text  AS access_tier,
    d.id                 AS doc_id,
    d.name               AS doc_name,
    d.size_bytes         AS doc_size_bytes,
    d.mime_type          AS doc_mime_type,
    d.created_at         AS doc_created_at,
    d.data_room_tier::text AS doc_tier
  FROM data_room_links l
  JOIN workspaces w ON w.id = l.workspace_id
  LEFT JOIN financing_rounds r ON r.id = l.round_id
  LEFT JOIN documents d
    ON d.workspace_id = l.workspace_id
    AND d.deleted_at IS NULL
    AND (
      d.visibility = 'public'
      OR (
        d.visibility = 'data_room'
        AND (
          l.access_tier = 'diligence'
          OR (l.access_tier = 'standard' AND d.data_room_tier IN ('intro', 'standard'))
          OR (l.access_tier = 'intro'    AND d.data_room_tier = 'intro')
        )
      )
    )
  WHERE l.token = p_token
    AND l.is_active = true
    AND (l.expires_at IS NULL OR l.expires_at > NOW())
  ORDER BY
    CASE d.data_room_tier WHEN 'intro' THEN 0 WHEN 'standard' THEN 1 WHEN 'diligence' THEN 2 END NULLS LAST,
    d.created_at ASC;
$$;
