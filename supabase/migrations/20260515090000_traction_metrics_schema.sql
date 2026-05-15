-- Traction Metrics + workspace visibility flags + slug (for Phase 7 Public Profile)

CREATE TABLE traction_metrics (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month              DATE NOT NULL,
  mrr_sar            NUMERIC(20, 2) CHECK (mrr_sar IS NULL OR mrr_sar >= 0),
  customer_count     INTEGER CHECK (customer_count IS NULL OR customer_count >= 0),
  gross_margin_pct   NUMERIC(5, 2) CHECK (gross_margin_pct IS NULL OR (gross_margin_pct >= 0 AND gross_margin_pct <= 100)),
  cash_runway_months INTEGER CHECK (cash_runway_months IS NULL OR cash_runway_months >= 0),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  UNIQUE (workspace_id, month)
);

CREATE INDEX traction_metrics_workspace_idx
  ON traction_metrics (workspace_id, month DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER traction_metrics_updated_at
  BEFORE UPDATE ON traction_metrics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE traction_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY traction_select_own_workspace ON traction_metrics FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY traction_insert_own_workspace ON traction_metrics FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY traction_update_own_workspace ON traction_metrics FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY traction_delete_own_workspace ON traction_metrics FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

ALTER TABLE workspaces ADD COLUMN show_mrr_publicly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workspaces ADD COLUMN show_customer_count_publicly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workspaces ADD COLUMN show_gross_margin_publicly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workspaces ADD COLUMN show_cash_runway_publicly BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE workspaces ADD COLUMN public_profile_published BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE workspaces ADD COLUMN slug TEXT UNIQUE;
CREATE INDEX workspaces_slug_idx ON workspaces (slug) WHERE slug IS NOT NULL;
