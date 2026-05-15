"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ============================================================================
// Board meetings
// ============================================================================

const MeetingSchema = z.object({
  title: z.string().min(1).max(200),
  meeting_at: z.string().min(1),
  format: z.enum(["virtual", "in_person"]),
  location: z.string().optional().or(z.literal("")),
  agenda: z.string().optional().or(z.literal("")),
});

export async function scheduleMeeting(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = MeetingSchema.safeParse({
    title: formData.get("title"),
    meeting_at: formData.get("meeting_at"),
    format: formData.get("format") ?? "virtual",
    location: formData.get("location") ?? "",
    agenda: formData.get("agenda") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { data: inserted, error } = await supabase
    .from("board_meetings")
    .insert({
      workspace_id: workspace.id,
      title: parsed.data.title,
      meeting_at: parsed.data.meeting_at,
      format: parsed.data.format,
      location: parsed.data.location || null,
      agenda: parsed.data.agenda || null,
    })
    .select("id")
    .single();
  if (error || !inserted) return { ok: false, error: error?.message ?? "Failed." };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: inserted.id,
    action: "meeting_schedule",
    description: `Scheduled board meeting "${parsed.data.title}" at ${parsed.data.meeting_at}`,
  });

  revalidatePath("/governance");
  redirect("/governance");
}

export async function updateMeetingStatus(
  meetingId: string,
  status: "upcoming" | "completed" | "cancelled",
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_meetings")
    .update({ status })
    .eq("id", meetingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/governance");
  return { ok: true };
}

export async function deleteMeeting(meetingId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("board_meetings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", meetingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/governance");
  return { ok: true };
}

// ============================================================================
// Resolutions
// ============================================================================

const ResolutionSchema = z.object({
  title: z.string().min(1).max(200),
  template: z.enum([
    "new_share_issuance",
    "round_approval",
    "director_appointment",
    "esop_grant",
    "esop_pool_expansion",
    "rofr_waiver",
    "transfer_restriction",
    "custom",
  ]),
  body: z.string().min(1),
  meeting_id: z.string().uuid().optional().or(z.literal("")),
});

export async function saveResolution(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const id = (formData.get("resolution_id") as string) || null;
  const parsed = ResolutionSchema.safeParse({
    title: formData.get("title"),
    template: formData.get("template") ?? "custom",
    body: formData.get("body"),
    meeting_id: formData.get("meeting_id") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  if (id) {
    const { data: existing } = await supabase
      .from("resolutions")
      .select("status, title")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Resolution not found." };
    if (existing.status !== "draft") {
      return { ok: false, error: "Only draft resolutions can be edited." };
    }
    const { error } = await supabase
      .from("resolutions")
      .update({
        title: parsed.data.title,
        body: parsed.data.body,
        meeting_id: parsed.data.meeting_id || null,
      })
      .eq("id", id)
      .eq("workspace_id", workspace.id);
    if (error) return { ok: false, error: error.message };
    await logAudit({
      workspaceId: workspace.id,
      entityType: "workspace",
      entityId: workspace.id,
      action: "resolution_edit",
      description: `Edited resolution "${parsed.data.title}"`,
    });
  } else {
    const { error } = await supabase.from("resolutions").insert({
      workspace_id: workspace.id,
      title: parsed.data.title,
      template: parsed.data.template,
      body: parsed.data.body,
      meeting_id: parsed.data.meeting_id || null,
      created_by: user.id,
    });
    if (error) return { ok: false, error: error.message };

    await logAudit({
      workspaceId: workspace.id,
      entityType: "workspace",
      entityId: workspace.id,
      action: "resolution_draft",
      description: `Drafted resolution "${parsed.data.title}"`,
    });
  }

  revalidatePath("/governance");
  redirect("/governance");
}

export async function transitionResolution(
  resolutionId: string,
  next: "pending" | "passed" | "rejected",
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: row } = await supabase
    .from("resolutions")
    .select("status, title, workspace_id")
    .eq("id", resolutionId)
    .maybeSingle();
  if (!row) return { ok: false, error: "Not found." };

  // State machine: draft → pending → passed/rejected. No going backwards.
  if (next === "pending" && row.status !== "draft") {
    return { ok: false, error: "Only drafts can be submitted." };
  }
  if ((next === "passed" || next === "rejected") && row.status !== "pending") {
    return { ok: false, error: "Only pending resolutions can be passed/rejected." };
  }

  const patch: {
    status: typeof next;
    decided_at?: string;
    decided_by?: string;
  } = { status: next };
  if (next === "passed" || next === "rejected") {
    patch.decided_at = new Date().toISOString();
    patch.decided_by = user.id;
  }

  const { error } = await supabase.from("resolutions").update(patch).eq("id", resolutionId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: row.workspace_id,
    entityType: "workspace",
    entityId: resolutionId,
    action: `resolution_${next}`,
    description: `"${row.title}" → ${next}`,
  });

  revalidatePath("/governance");
  return { ok: true };
}

export async function deleteResolution(resolutionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("resolutions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", resolutionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/governance");
  return { ok: true };
}
