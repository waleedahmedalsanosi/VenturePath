-- Migration: Full-text search — GIN indexes + search_platform RPC
-- REQ-PLAT-02
-- Timestamp: 20260519000000

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. GENERATED tsvector columns
-- ─────────────────────────────────────────────────────────────────────────────

-- workspaces has no deleted_at — no partial index needed.
ALTER TABLE workspaces
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')),          'A') ||
    setweight(to_tsvector('english', coalesce(one_liner, '')),     'B') ||
    setweight(to_tsvector('english', coalesce(sector, '')),        'C') ||
    -- simple config covers Arabic names (no stemming, verbatim tokens)
    setweight(to_tsvector('simple',  coalesce(name, '')),          'A')
  ) STORED;

-- connection_listings has deleted_at
ALTER TABLE connection_listings
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(public_summary, '')), 'A') ||
    setweight(to_tsvector('simple',  coalesce(public_summary, '')), 'B')
  ) STORED;

-- financing_rounds has deleted_at
ALTER TABLE financing_rounds
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')),          'A') ||
    setweight(to_tsvector('english', coalesce(lead_investor, '')), 'B')
  ) STORED;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. GIN indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- workspaces: no deleted_at, full index
CREATE INDEX workspaces_search_vector_idx
  ON workspaces USING GIN (search_vector);

-- connection_listings: soft-deletable → partial
CREATE INDEX connection_listings_search_vector_idx
  ON connection_listings USING GIN (search_vector)
  WHERE deleted_at IS NULL;

-- financing_rounds: soft-deletable → partial
CREATE INDEX financing_rounds_search_vector_idx
  ON financing_rounds USING GIN (search_vector)
  WHERE deleted_at IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. search_platform RPC
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_platform(p_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tsquery  tsquery;
  v_result   JSON;
BEGIN
  -- Guard: require at least 2 non-whitespace characters
  IF length(trim(p_query)) < 2 THEN
    RETURN '[]'::JSON;
  END IF;

  -- Build a prefix-aware tsquery: wrap in websearch_to_tsquery for safety
  BEGIN
    v_tsquery := websearch_to_tsquery('english', p_query);
  EXCEPTION WHEN others THEN
    RETURN '[]'::JSON;
  END;

  -- Bail if the query produced no lexemes
  IF v_tsquery IS NULL THEN
    RETURN '[]'::JSON;
  END IF;

  -- Use a CTE + explicit ORDER/LIMIT so LIMIT applies to the full UNION ALL
  -- and not silently to a single branch.
  WITH candidates AS (
    -- Workspaces
    SELECT
      'workspace'::text                      AS entity_type,
      id::text                               AS entity_id,
      name                                   AS title,
      one_liner                              AS subtitle,
      CASE
        WHEN slug IS NOT NULL THEN '/explore/' || slug
        ELSE '/explore'
      END                                    AS url,
      ts_rank(search_vector, v_tsquery)      AS rank
    FROM workspaces
    WHERE search_vector @@ v_tsquery

    UNION ALL

    -- Connection listings
    SELECT
      'connection_listing'::text             AS entity_type,
      id::text                               AS entity_id,
      listing_type::text                     AS title,
      left(public_summary, 120)              AS subtitle,
      '/connections/' || id                  AS url,
      ts_rank(search_vector, v_tsquery)      AS rank
    FROM connection_listings
    WHERE search_vector @@ v_tsquery
      AND deleted_at IS NULL

    UNION ALL

    -- Financing rounds
    SELECT
      'financing_round'::text                AS entity_type,
      id::text                               AS entity_id,
      name                                   AS title,
      lead_investor                          AS subtitle,
      '/rounds/' || id                       AS url,
      ts_rank(search_vector, v_tsquery)      AS rank
    FROM financing_rounds
    WHERE search_vector @@ v_tsquery
      AND deleted_at IS NULL
  ),
  top20 AS (
    SELECT *
    FROM candidates
    ORDER BY rank DESC
    LIMIT 20
  )
  SELECT coalesce(json_agg(top20 ORDER BY rank DESC), '[]'::JSON)
  INTO v_result
  FROM top20;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION search_platform(TEXT) TO authenticated;
