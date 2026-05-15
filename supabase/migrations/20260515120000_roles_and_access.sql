-- Roles & Access (PRD EP-10, minimal scope).
-- Members read-only, owner-only writes. Per-shareholder permissions deferred.

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'viewer');

CREATE TABLE workspace_members (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         workspace_role NOT NULL DEFAULT 'viewer',
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX workspace_members_user_idx ON workspace_members (user_id);

CREATE TABLE workspace_invitations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email  TEXT NOT NULL,
  role           workspace_role NOT NULL DEFAULT 'viewer',
  token          TEXT NOT NULL UNIQUE,
  invited_by     UUID NOT NULL REFERENCES auth.users(id),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX workspace_invitations_token_idx ON workspace_invitations (token);
CREATE INDEX workspace_invitations_workspace_idx ON workspace_invitations (workspace_id);

INSERT INTO workspace_members (workspace_id, user_id, role)
SELECT id, owner_user_id, 'owner'::workspace_role
FROM workspaces
ON CONFLICT (workspace_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION user_can_access_workspace(ws_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = uid
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_access_workspace(UUID, UUID) FROM anon, authenticated, PUBLIC;

ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_members_select ON workspace_members FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));

CREATE POLICY workspace_members_owner_insert ON workspace_members FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

CREATE POLICY workspace_members_owner_delete ON workspace_members FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

CREATE POLICY workspace_invitations_owner_all ON workspace_invitations FOR ALL
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())))
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

-- Member-SELECT layered on top of existing owner-only policies (Postgres OR's
-- multiple policies for the same action — purely additive).
CREATE POLICY workspaces_select_member ON workspaces FOR SELECT
  USING (public.user_can_access_workspace(id, (SELECT auth.uid())));
CREATE POLICY shareholders_select_member ON shareholders FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY documents_select_member ON documents FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY compliance_select_member ON compliance_obligations FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY traction_select_member ON traction_metrics FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY audit_select_member ON audit_events FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY esop_pools_select_member ON esop_pools FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
CREATE POLICY esop_grants_select_member ON esop_grants FOR SELECT
  USING (public.user_can_access_workspace(workspace_id, (SELECT auth.uid())));
