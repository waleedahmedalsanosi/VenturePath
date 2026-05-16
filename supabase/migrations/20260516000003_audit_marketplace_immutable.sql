-- Block UPDATE/DELETE on audit_events whose entity_type is marketplace-related.
-- Per eng review A6 (simplified for Approach A): we want strong assurance
-- that marketplace audit trail can't be silently mutated even by a workspace
-- owner with full RLS. The audit table already has insert-only RLS policies;
-- this trigger is defense-in-depth against future RLS bugs or service-role usage.

CREATE OR REPLACE FUNCTION audit_events_block_marketplace_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.entity_type IN ('share_listing', 'rofr_notification') THEN
      RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE
  IF NEW.entity_type IN ('share_listing', 'rofr_notification')
     OR OLD.entity_type IN ('share_listing', 'rofr_notification') THEN
    RAISE EXCEPTION 'audit_events for marketplace entities are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_events_marketplace_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION audit_events_block_marketplace_mutation();
