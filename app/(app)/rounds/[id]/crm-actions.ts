"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const PipelineSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  firm: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["prospect", "contacted", "in_discussion", "term_sheet", "passed", "invested"]),
  notes: z.string().max(2000).optional().or(z.literal("")),
  last_contacted_at: z.string().optional().or(z.literal("")),
});

export async function addPipelineContact(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = PipelineSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    firm: formData.get("firm") ?? "",
    status: formData.get("status") ?? "prospect",
    notes: formData.get("notes") ?? "",
    last_contacted_at: formData.get("last_contacted_at") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const d = parsed.data;

  const { error } = await supabase.from("investor_pipeline").insert({
    workspace_id: workspace.id,
    round_id: roundId,
    name: d.name,
    email: d.email || null,
    firm: d.firm || null,
    status: d.status,
    notes: d.notes || null,
    last_contacted_at: d.last_contacted_at || null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: roundId,
    action: "pipeline_add",
    description: `Added investor "${d.name}"${d.firm ? ` (${d.firm})` : ""} to pipeline`,
  });

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

type PipelineStatus = "prospect" | "contacted" | "in_discussion" | "term_sheet" | "passed" | "invested";

export async function updatePipelineStatus(
  contactId: string,
  roundId: string,
  status: PipelineStatus,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("investor_pipeline")
    .update({ status })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}

export async function deletePipelineContact(
  contactId: string,
  roundId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("investor_pipeline")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", contactId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/rounds/${roundId}`);
  return { ok: true };
}
