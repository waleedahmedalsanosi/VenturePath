-- Tightens user_can_access_workspace by removing the uid parameter.
-- Function now uses auth.uid() internally, so authenticated callers can
-- only probe their own access (not arbitrary user-workspace pairs).
-- This makes GRANT EXECUTE TO authenticated genuinely safe.

CREATE OR REPLACE FUNCTION user_can_access_workspace(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = (SELECT auth.uid())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_access_workspace(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_can_access_workspace(UUID) TO authenticated;

-- Swap each RLS policy that referenced the old (UUID, UUID) signature.
-- Postgres has no ALTER POLICY ... USING; DROP + CREATE is the only path.

DROP POLICY IF EXISTS workspace_members_select ON workspace_members;
CREATE POLICY workspace_members_select ON workspace_members FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS workspaces_select_member ON workspaces;
CREATE POLICY workspaces_select_member ON workspaces FOR SELECT
  USING (public.user_can_access_workspace(id));

DROP POLICY IF EXISTS shareholders_select_member ON shareholders;
CREATE POLICY shareholders_select_member ON shareholders FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS documents_select_member ON documents;
CREATE POLICY documents_select_member ON documents FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS compliance_select_member ON compliance_obligations;
CREATE POLICY compliance_select_member ON compliance_obligations FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS traction_select_member ON traction_metrics;
CREATE POLICY traction_select_member ON traction_metrics FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS audit_select_member ON audit_events;
CREATE POLICY audit_select_member ON audit_events FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS esop_pools_select_member ON esop_pools;
CREATE POLICY esop_pools_select_member ON esop_pools FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP POLICY IF EXISTS esop_grants_select_member ON esop_grants;
CREATE POLICY esop_grants_select_member ON esop_grants FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));

DROP FUNCTION IF EXISTS public.user_can_access_workspace(UUID, UUID);
