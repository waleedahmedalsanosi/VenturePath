/**
 * Audit logging helper. Call from any server action that mutates state.
 *
 * Best-effort: failures are logged to the server console but do NOT throw
 * back into the caller. We don't want a broken audit insert to roll back a
 * successful business action. The audit table is for forensics; the source
 * of truth for state lives in the entity tables themselves.
 */

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export type EntityType =
  | "workspace"
  | "shareholder"
  | "document"
  | "compliance_obligation"
  | "share_listing"
  | "rofr_notification"
  | "connection_listing"
  | "connection_inquiry";

export interface AuditEventInput {
  workspaceId: string;
  entityType: EntityType;
  entityId?: string | null;
  action: string;
  description: string;
  payload?: Json | null;
}

export async function logAudit(input: AuditEventInput): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[audit] no auth user — event dropped:", input.action);
      return;
    }

    const { error } = await supabase.from("audit_events").insert({
      workspace_id: input.workspaceId,
      actor_user_id: user.id,
      actor_email: user.email ?? "(no email)",
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      action: input.action,
      description: input.description,
      payload: input.payload ?? null,
    });
    if (error) {
      console.error("[audit] insert failed:", error.message, "for", input.action);
    }
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
