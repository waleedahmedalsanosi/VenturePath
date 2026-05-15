"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { nextDueDate } from "@/lib/compliance/status";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  regulatory_body: z.string().min(1).max(120),
  category: z.enum(["tax", "commercial", "regulatory", "administrative"]),
  start_date: z.string().optional().nullable(),
  due_date: z.string().min(1),
  recurrence: z
    .enum(["one_time", "monthly", "quarterly", "annual"])
    .default("one_time"),
  official_url: z.string().url().optional().or(z.literal("")),
  reminder_days_before: z.number().int().min(7).max(90).default(30),
  notes: z.string().optional().nullable(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function addObligation(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const raw = {
    name: String(formData.get("name") ?? ""),
    regulatory_body: String(formData.get("regulatory_body") ?? ""),
    category: String(formData.get("category") ?? "") as
      | "tax"
      | "commercial"
      | "regulatory"
      | "administrative",
    start_date: (formData.get("start_date") as string) || null,
    due_date: String(formData.get("due_date") ?? ""),
    recurrence: (String(formData.get("recurrence") ?? "one_time") as
      | "one_time"
      | "monthly"
      | "quarterly"
      | "annual"),
    official_url: (formData.get("official_url") as string) || "",
    reminder_days_before: Number(formData.get("reminder_days_before") ?? 30),
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { data: inserted, error } = await supabase
    .from("compliance_obligations")
    .insert({
      workspace_id: workspace.id,
      name: parsed.data.name,
      regulatory_body: parsed.data.regulatory_body,
      category: parsed.data.category,
      start_date: parsed.data.start_date || null,
      due_date: parsed.data.due_date,
      recurrence: parsed.data.recurrence,
      official_url: parsed.data.official_url || null,
      reminder_days_before: parsed.data.reminder_days_before,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !inserted) return { ok: false, error: error?.message ?? "Insert failed." };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "compliance_obligation",
    entityId: inserted.id,
    action: "create",
    description: `Added compliance obligation "${parsed.data.name}" (${parsed.data.regulatory_body}, due ${parsed.data.due_date})`,
  });

  revalidatePath("/compliance");
  redirect("/compliance");
}

export async function markComplete(obligationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Fetch the row so we can chain the next occurrence if recurring.
  const { data: row } = await supabase
    .from("compliance_obligations")
    .select("*")
    .eq("id", obligationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { ok: false, error: "Obligation not found." };
  if (row.completed_at !== null) return { ok: false, error: "Already complete." };

  const { error: updateError } = await supabase
    .from("compliance_obligations")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", obligationId);
  if (updateError) return { ok: false, error: updateError.message };

  await logAudit({
    workspaceId: row.workspace_id,
    entityType: "compliance_obligation",
    entityId: obligationId,
    action: "mark_complete",
    description: `Marked "${row.name}" complete (was due ${row.due_date})`,
  });

  // Auto-create next occurrence for recurring obligations (PRD US-11-03).
  const nextDate = nextDueDate(row.due_date, row.recurrence);
  if (nextDate) {
    const { error: insertError } = await supabase
      .from("compliance_obligations")
      .insert({
        workspace_id: row.workspace_id,
        name: row.name,
        regulatory_body: row.regulatory_body,
        category: row.category,
        start_date: row.start_date,
        due_date: nextDate,
        recurrence: row.recurrence,
        official_url: row.official_url,
        reminder_days_before: row.reminder_days_before,
        notes: row.notes,
        previous_id: row.id,
      });
    if (insertError) {
      // Don't roll back the completion; just surface the next-occurrence failure.
      return {
        ok: false,
        error: `Marked complete, but next occurrence failed to schedule: ${insertError.message}`,
      };
    }
  }

  revalidatePath("/compliance");
  return { ok: true };
}

export async function reopenObligation(obligationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing, error: fetchError } = await supabase
    .from("compliance_obligations")
    .select("workspace_id, name")
    .eq("id", obligationId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!existing) return { ok: false, error: "Obligation not found." };

  const { error } = await supabase
    .from("compliance_obligations")
    .update({ completed_at: null })
    .eq("id", obligationId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "compliance_obligation",
    entityId: obligationId,
    action: "reopen",
    description: `Reopened "${existing.name}"`,
  });

  revalidatePath("/compliance");
  return { ok: true };
}

export async function deleteObligation(obligationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: existing, error: fetchError } = await supabase
    .from("compliance_obligations")
    .select("workspace_id, name")
    .eq("id", obligationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!existing) return { ok: false, error: "Obligation not found." };

  const { error } = await supabase
    .from("compliance_obligations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", obligationId)
    .is("deleted_at", null);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: existing.workspace_id,
    entityType: "compliance_obligation",
    entityId: obligationId,
    action: "delete",
    description: `Deleted obligation "${existing.name}"`,
  });

  revalidatePath("/compliance");
  return { ok: true };
}
