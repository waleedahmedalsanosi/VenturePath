-- Document Vault — prototype scope
-- Categories + visibility levels + expiry deferred (PRD EP-09 has them).
-- Each document is one Storage object + one metadata row.

CREATE TABLE documents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name               TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
  storage_path       TEXT NOT NULL,
  size_bytes         BIGINT NOT NULL CHECK (size_bytes > 0),
  mime_type          TEXT,
  uploaded_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE INDEX documents_workspace_id_idx
  ON documents (workspace_id, created_at DESC)
  WHERE deleted_at IS NULL;

COMMENT ON TABLE documents IS 'Vault metadata. File bytes live in storage bucket `vault` at path workspace_id/document_id.';

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_select_own_workspace ON documents
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY documents_insert_own_workspace ON documents
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY documents_update_own_workspace ON documents
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY documents_delete_own_workspace ON documents
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );
