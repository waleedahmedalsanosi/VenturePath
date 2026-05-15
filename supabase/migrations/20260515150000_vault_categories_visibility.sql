-- Vault categories + document visibility (PRD US-09-02, US-09-03)

CREATE TABLE vault_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name          TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  is_data_room  BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX vault_categories_workspace_name_idx
  ON vault_categories (workspace_id, lower(name));
CREATE INDEX vault_categories_workspace_sort_idx
  ON vault_categories (workspace_id, sort_order);

ALTER TABLE vault_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY vault_categories_select_owner ON vault_categories FOR SELECT
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY vault_categories_select_member ON vault_categories FOR SELECT
  USING (public.user_can_access_workspace(workspace_id));
CREATE POLICY vault_categories_insert_owner ON vault_categories FOR INSERT
  WITH CHECK (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY vault_categories_update_owner ON vault_categories FOR UPDATE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));
CREATE POLICY vault_categories_delete_owner ON vault_categories FOR DELETE
  USING (workspace_id IN (SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())));

CREATE TYPE document_visibility AS ENUM ('internal', 'data_room', 'public');

ALTER TABLE documents
  ADD COLUMN category_id UUID REFERENCES vault_categories(id) ON DELETE SET NULL,
  ADD COLUMN visibility document_visibility NOT NULL DEFAULT 'internal';

CREATE INDEX documents_category_idx
  ON documents (category_id)
  WHERE deleted_at IS NULL;
CREATE INDEX documents_visibility_idx
  ON documents (workspace_id, visibility)
  WHERE deleted_at IS NULL;

CREATE POLICY documents_select_public ON documents FOR SELECT
  TO anon, authenticated
  USING (visibility = 'public');

INSERT INTO vault_categories (workspace_id, name, is_data_room, is_locked, sort_order)
SELECT w.id, c.name, c.is_data_room, c.is_locked, c.sort_order
FROM workspaces w
CROSS JOIN (VALUES
  ('Incorporation',        FALSE, FALSE, 0),
  ('Equity',               FALSE, FALSE, 1),
  ('Investor Agreements',  FALSE, FALSE, 2),
  ('Compliance',           FALSE, FALSE, 3),
  ('Data Room',            TRUE,  TRUE,  4)
) AS c(name, is_data_room, is_locked, sort_order)
ON CONFLICT DO NOTHING;

-- Auto-seed default categories on every new workspace.
CREATE OR REPLACE FUNCTION seed_default_vault_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.vault_categories (workspace_id, name, is_data_room, is_locked, sort_order)
  VALUES
    (NEW.id, 'Incorporation',       FALSE, FALSE, 0),
    (NEW.id, 'Equity',              FALSE, FALSE, 1),
    (NEW.id, 'Investor Agreements', FALSE, FALSE, 2),
    (NEW.id, 'Compliance',          FALSE, FALSE, 3),
    (NEW.id, 'Data Room',           TRUE,  TRUE,  4)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER workspaces_seed_categories
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION seed_default_vault_categories();
