-- Round-level public visibility flag. Default false — rounds are private until
-- the founder explicitly publishes. This is independent of the round status,
-- so founders can announce open rounds ("we're raising") or closed rounds
-- ("we just raised X led by Y").
--
-- Drafts are never shown publicly even if is_public is true — surfaced in the
-- app layer, not enforced here.

ALTER TABLE financing_rounds
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Public read policy: anyone (including anon) can read public rounds belonging
-- to a workspace whose public profile is published. Mirrors the precedent set
-- by traction_metrics and the workspaces table itself.

CREATE POLICY "financing_rounds_anon_read_public"
  ON financing_rounds
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true
    AND status <> 'draft'
    AND deleted_at IS NULL
    AND workspace_id IN (
      SELECT id FROM workspaces WHERE public_profile_published = true
    )
  );
