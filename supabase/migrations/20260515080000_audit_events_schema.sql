-- Audit Trail — append-only event log (PRD EP-14).
-- One row per state-changing action across cap table, vault, compliance,
-- workspace. NO update / delete policies — the table is immutable.

CREATE TABLE audit_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  actor_user_id   UUID NOT NULL REFERENCES auth.users(id),
  actor_email     TEXT NOT NULL,
  entity_type     TEXT NOT NULL CHECK (
    entity_type IN ('workspace', 'shareholder', 'document', 'compliance_obligation')
  ),
  entity_id       UUID,
  action          TEXT NOT NULL,
  description     TEXT NOT NULL,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_events_workspace_idx
  ON audit_events (workspace_id, created_at DESC);

COMMENT ON TABLE audit_events IS 'Immutable audit log. Insert-only via RLS; no update/delete policies exist.';

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_select_own_workspace ON audit_events
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY audit_insert_own_workspace ON audit_events
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
    AND actor_user_id = (SELECT auth.uid())
  );

-- Deliberately NO update or delete policies. The audit log is append-only.
