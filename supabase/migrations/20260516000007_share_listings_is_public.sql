-- Add is_public flag to share_listings so workspace owners can opt their
-- secondary listings into cross-workspace discovery via /explore.
--
-- Default false preserves the original eng-review privacy stance: secondary
-- listings are workspace-private unless the seller explicitly opts in. The
-- new policy lets any authenticated user read open listings where the seller
-- has marked the listing public. The existing workspace-private read policy
-- stays intact for non-public rows.

ALTER TABLE share_listings
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN share_listings.is_public IS
  'When true, the listing is visible on /explore to any authenticated user. Opt-in per listing.';

CREATE INDEX IF NOT EXISTS share_listings_public_open_idx
  ON share_listings (listed_at DESC)
  WHERE is_public = true AND status = 'open' AND deleted_at IS NULL;

-- Cross-workspace read policy: any authenticated user can read open public listings.
DROP POLICY IF EXISTS "share_listings_public_read" ON share_listings;
CREATE POLICY "share_listings_public_read"
  ON share_listings FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND status = 'open'
    AND is_public = true
  );
