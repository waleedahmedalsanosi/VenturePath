-- Public Profile RLS + slug generator + back-fill

CREATE POLICY workspaces_select_public ON workspaces
  FOR SELECT
  TO anon, authenticated
  USING (public_profile_published = TRUE AND slug IS NOT NULL);

CREATE POLICY traction_select_public ON traction_metrics
  FOR SELECT
  TO anon, authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE public_profile_published = TRUE AND slug IS NOT NULL
    )
  );

CREATE OR REPLACE FUNCTION generate_workspace_slug(input_name TEXT, input_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  base TEXT;
BEGIN
  base := lower(regexp_replace(input_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base := regexp_replace(base, '^-+|-+$', '', 'g');
  IF base = '' THEN base := 'company'; END IF;
  RETURN base || '-' || substring(input_id::text, 1, 6);
END;
$$;

UPDATE workspaces
SET slug = public.generate_workspace_slug(name, id)
WHERE slug IS NULL;
