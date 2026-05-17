CREATE TABLE public.connection_inquiry_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  UUID NOT NULL REFERENCES public.connection_inquiries(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id),
  body        TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX connection_inquiry_messages_inquiry_idx
  ON public.connection_inquiry_messages (inquiry_id, created_at);

ALTER TABLE public.connection_inquiry_messages ENABLE ROW LEVEL SECURITY;

-- Read: either party of the underlying inquiry can read messages.
-- This mirrors the existing connection_inquiries SELECT policy.
CREATE POLICY "inquiry messages — both parties read"
  ON public.connection_inquiry_messages FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL AND EXISTS (
      SELECT 1 FROM public.connection_inquiries ci
      JOIN public.connection_listings cl ON cl.id = ci.listing_id
      WHERE ci.id = inquiry_id
        AND (
          ci.inquirer_user_id = auth.uid()
          OR cl.workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
        )
    )
  );

-- Write: either party of the inquiry, AND only if inquiry status IN ('sent','accepted').
-- Closed/declined inquiries are read-only.
CREATE POLICY "inquiry messages — both parties send"
  ON public.connection_inquiry_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.connection_inquiries ci
      JOIN public.connection_listings cl ON cl.id = ci.listing_id
      WHERE ci.id = inquiry_id
        AND ci.status IN ('sent', 'accepted')
        AND (
          ci.inquirer_user_id = auth.uid()
          OR cl.workspace_id IN (SELECT id FROM public.workspaces WHERE owner_user_id = auth.uid())
        )
    )
  );
