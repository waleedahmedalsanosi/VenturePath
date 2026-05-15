-- Token-gated RPC for invitation acceptance.
-- Without this, invitees can't read their own invitation row (owner-only RLS).

CREATE OR REPLACE FUNCTION accept_invitation_lookup(invite_token TEXT)
RETURNS TABLE (
  id            UUID,
  workspace_id  UUID,
  invited_email TEXT,
  role          workspace_role,
  expires_at    TIMESTAMPTZ,
  accepted_at   TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT id, workspace_id, invited_email, role, expires_at, accepted_at
  FROM public.workspace_invitations
  WHERE token = invite_token
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_invitation_lookup(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation_lookup(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION accept_invitation(invite_token TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  inv RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := (SELECT auth.uid());
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT id, workspace_id, role, expires_at, accepted_at
  INTO inv
  FROM public.workspace_invitations
  WHERE token = invite_token
  LIMIT 1;

  IF inv IS NULL THEN
    RAISE EXCEPTION 'invitation not found';
  END IF;
  IF inv.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'invitation already accepted';
  END IF;
  IF inv.expires_at < NOW() THEN
    RAISE EXCEPTION 'invitation expired';
  END IF;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (inv.workspace_id, current_user_id, inv.role)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invitations
  SET accepted_at = NOW()
  WHERE id = inv.id;

  RETURN inv.workspace_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_invitation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
