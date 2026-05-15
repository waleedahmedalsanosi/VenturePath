-- Restore EXECUTE on user_can_access_workspace for authenticated users.
-- RLS policies call this function during .select() chained on insert/update,
-- so revoking EXECUTE broke the workspace creation flow.
--
-- Trade-off vs the security advisor's WARN:
-- - With EXECUTE granted, signed-in users can probe whether a specific
--   (uid, workspace_id) pair has access via PostgREST RPC.
-- - They cannot enumerate workspaces or users without knowing UUIDs.
-- - Acceptable for prototype. Revisit before public launch.

GRANT EXECUTE ON FUNCTION public.user_can_access_workspace(UUID, UUID) TO authenticated;
