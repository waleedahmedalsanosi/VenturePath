-- Storage bucket + RLS for Document Vault.
-- Path convention: `{workspace_id}/{filename}` — first folder name is the
-- workspace, used by RLS to gate access.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault',
  'vault',
  false,
  52428800,  -- 50 MB per PRD US-09-01
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.ms-excel',
    'image/jpeg',
    'image/png'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "vault_select_own_workspace"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vault'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "vault_insert_own_workspace"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vault'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "vault_update_own_workspace"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vault'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "vault_delete_own_workspace"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vault'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.workspaces WHERE owner_user_id = (SELECT auth.uid())
    )
  );
