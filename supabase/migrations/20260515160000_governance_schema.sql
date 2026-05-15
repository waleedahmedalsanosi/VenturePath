-- Governance (PRD EP-13): board meetings + resolutions.

CREATE TYPE meeting_status AS ENUM ('upcoming', 'completed', 'cancelled');
CREATE TYPE meeting_format AS ENUM ('virtual', 'in_person');
CREATE TYPE resolution_status AS ENUM ('draft', 'pending', 'passed', 'rejected');
CREATE TYPE resolution_template AS ENUM (
  'new_share_issuance',
  'round_approval',
  'director_appointment',
  'esop_grant',
  'esop_pool_expansion',
  'rofr_waiver',
  'transfer_restriction',
  'custom'
);

CREATE TABLE board_meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title         TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  meeting_at    TIMESTAMPTZ NOT NULL,
  format        meeting_format NOT NULL DEFAULT 'virtual',
  location      TEXT,
  agenda        TEXT,
  status        meeting_status NOT NULL DEFAULT 'upcoming',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX board_meetings_workspace_idx
  ON board_meetings (workspace_id, meeting_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER board_meetings_updated_at
  BEFORE UPDATE ON board_meetings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE resolutions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  template        resolution_template NOT NULL DEFAULT 'custom',
  body            TEXT NOT NULL,
  status          resolution_status NOT NULL DEFAULT 'draft',
  meeting_id      UUID REFERENCES board_meetings(id) ON DELETE SET NULL,
  decided_at      TIMESTAMPTZ,
  decided_by      UUID REFERENCES auth.users(id),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX resolutions_workspace_idx
  ON resolutions (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER resolutions_updated_at
  BEFORE UPDATE ON resolutions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE board_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY board_meetings_select_owner ON board_meetings FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY board_meetings_select_member ON board_meetings FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));
CREATE POLICY board_meetings_owner_writes ON board_meetings FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

CREATE POLICY resolutions_select_owner ON resolutions FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY resolutions_select_member ON resolutions FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));
CREATE POLICY resolutions_owner_writes ON resolutions FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
