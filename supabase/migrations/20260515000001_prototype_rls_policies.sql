-- Row Level Security: workspace owner can do everything within their workspace.
-- Multi-tenant isolation pattern from eng review decision 4.

ALTER TABLE workspaces    ENABLE ROW LEVEL SECURITY;
ALTER TABLE shareholders  ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- workspaces: owner-only access
-- ============================================================================

CREATE POLICY workspaces_select_own ON workspaces
  FOR SELECT
  USING (owner_user_id = (SELECT auth.uid()));

CREATE POLICY workspaces_insert_own ON workspaces
  FOR INSERT
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

CREATE POLICY workspaces_update_own ON workspaces
  FOR UPDATE
  USING (owner_user_id = (SELECT auth.uid()))
  WITH CHECK (owner_user_id = (SELECT auth.uid()));

CREATE POLICY workspaces_delete_own ON workspaces
  FOR DELETE
  USING (owner_user_id = (SELECT auth.uid()));

-- ============================================================================
-- shareholders: access if you own the workspace
-- ============================================================================

CREATE POLICY shareholders_select_own_workspace ON shareholders
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY shareholders_insert_own_workspace ON shareholders
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY shareholders_update_own_workspace ON shareholders
  FOR UPDATE
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

CREATE POLICY shareholders_delete_own_workspace ON shareholders
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );
