-- Compliance Obligations — prototype scope (PRD EP-11)
-- Status (Upcoming / Due Soon / Overdue / Complete) is COMPUTED from
-- due_date and completed_at; never stored. Recurring obligations are
-- modeled as a chain of rows: marking one complete inserts the next.

CREATE TYPE compliance_category AS ENUM ('tax', 'commercial', 'regulatory', 'administrative');
CREATE TYPE compliance_recurrence AS ENUM ('one_time', 'monthly', 'quarterly', 'annual');

CREATE TABLE compliance_obligations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  regulatory_body      TEXT NOT NULL CHECK (char_length(regulatory_body) BETWEEN 1 AND 120),
  category             compliance_category NOT NULL,
  start_date           DATE,
  due_date             DATE NOT NULL,
  recurrence           compliance_recurrence NOT NULL DEFAULT 'one_time',
  official_url         TEXT,
  reminder_days_before INTEGER NOT NULL DEFAULT 30 CHECK (reminder_days_before BETWEEN 7 AND 90),
  notes                TEXT,
  completed_at         TIMESTAMPTZ,
  previous_id          UUID REFERENCES compliance_obligations(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX compliance_workspace_idx
  ON compliance_obligations (workspace_id, due_date)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE compliance_obligations IS 'Compliance Timeline rows. Status is COMPUTED (never stored): completed → Complete; due_date < now → Overdue; <=30 days → Due Soon; else Upcoming. Recurrence creates the next row when an instance is marked complete.';

CREATE TRIGGER compliance_obligations_updated_at
  BEFORE UPDATE ON compliance_obligations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE compliance_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_select_own_workspace ON compliance_obligations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY compliance_insert_own_workspace ON compliance_obligations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY compliance_update_own_workspace ON compliance_obligations
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY compliance_delete_own_workspace ON compliance_obligations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );
