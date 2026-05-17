"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";
import { sendInvestorUpdateEmails } from "@/lib/email/resend";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const PositiveDecimal = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : parseFloat(v)))
  .refine((v) => v === null || (isFinite(v) && v >= 0));

const UpdateSchema = z.object({
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1),
  mrr_sar: PositiveDecimal,
  runway_months: PositiveDecimal,
  highlights: z.string().transform((v) =>
    v
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10),
  ),
});

export async function createInvestorUpdate(
  roundId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = UpdateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    mrr_sar: formData.get("mrr_sar"),
    runway_months: formData.get("runway_months"),
    highlights: formData.get("highlights") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { data, error } = await supabase
    .from("investor_updates")
    .insert({
      workspace_id: workspace.id,
      round_id: roundId,
      ...parsed.data,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed." };

  redirect(`/investor-updates/${data.id}`);
}

export async function updateInvestorUpdate(
  updateId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const parsed = UpdateSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    mrr_sar: formData.get("mrr_sar"),
    runway_months: formData.get("runway_months"),
    highlights: formData.get("highlights") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { error } = await supabase
    .from("investor_updates")
    .update(parsed.data)
    .eq("id", updateId)
    .eq("workspace_id", workspace.id)
    .eq("status", "draft");
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/investor-updates/${updateId}`);
  return { ok: true };
}

export async function publishInvestorUpdate(updateId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  const { data: update } = await supabase
    .from("investor_updates")
    .select("round_id, subject, body, highlights, mrr_sar, runway_months, token")
    .eq("id", updateId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!update) return { ok: false, error: "Update not found." };

  const { error } = await supabase
    .from("investor_updates")
    .update({ status: "published", sent_at: new Date().toISOString() })
    .eq("id", updateId)
    .eq("workspace_id", workspace.id);
  if (error) return { ok: false, error: error.message };

  // Send email to all pipeline contacts with an email address for this round.
  const { data: contacts } = await supabase
    .from("investor_pipeline")
    .select("email")
    .eq("round_id", update.round_id)
    .not("email", "is", null)
    .is("deleted_at", null);

  const recipients = (contacts ?? [])
    .map((c) => c.email)
    .filter((e): e is string => typeof e === "string" && e.includes("@"));

  if (recipients.length > 0) {
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "venturepath.co";
    const proto = host.startsWith("localhost") ? "http" : "https";
    const publicUrl = `${proto}://${host}/updates/${update.token}`;

    const { data: round } = await supabase
      .from("financing_rounds")
      .select("name")
      .eq("id", update.round_id)
      .maybeSingle();

    const sendResult = await sendInvestorUpdateEmails({
      to: recipients,
      companyName: workspace.name,
      roundName: round?.name ?? "Round",
      subject: update.subject,
      body: update.body,
      highlights: (update.highlights ?? []) as string[],
      mrrSar: update.mrr_sar != null ? Number(update.mrr_sar) : null,
      runwayMonths: update.runway_months != null ? Number(update.runway_months) : null,
      publicUrl,
    });

    // Persist per-recipient rows. Upsert so re-publishes update sent_at instead of erroring.
    if (sendResult.recipients.length > 0) {
      const rows = sendResult.recipients.map((r) => ({
        update_id: updateId,
        email: r.email,
        sent_at: new Date().toISOString(),
        resend_message_id: r.resendMessageId,
      }));
      await supabase
        .from("investor_update_recipients")
        .upsert(rows, { onConflict: "update_id,email" });
    }
  }

  revalidatePath(`/investor-updates/${updateId}`);
  revalidatePath(`/rounds/${update.round_id}`);
  return { ok: true };
}

export async function resendToUnopenedRecipients(updateId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace." };

  // Fetch the update (must belong to this workspace)
  const { data: update } = await supabase
    .from("investor_updates")
    .select("round_id, subject, body, highlights, mrr_sar, runway_months, token, status")
    .eq("id", updateId)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!update) return { ok: false, error: "Update not found." };
  if (update.status !== "published") return { ok: false, error: "Update is not published." };

  // Fetch unopened recipients
  const { data: unopened } = await supabase
    .from("investor_update_recipients")
    .select("email, name")
    .eq("update_id", updateId)
    .is("opened_at", null);

  if (!unopened || unopened.length === 0) return { ok: true };

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "venturepath.co";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const publicUrl = `${proto}://${host}/updates/${update.token}`;

  const { data: round } = await supabase
    .from("financing_rounds")
    .select("name")
    .eq("id", update.round_id)
    .maybeSingle();

  const sendResult = await sendInvestorUpdateEmails({
    to: unopened.map((r) => r.email),
    companyName: workspace.name,
    roundName: round?.name ?? "Round",
    subject: update.subject,
    body: update.body,
    highlights: (update.highlights ?? []) as string[],
    mrrSar: update.mrr_sar != null ? Number(update.mrr_sar) : null,
    runwayMonths: update.runway_months != null ? Number(update.runway_months) : null,
    publicUrl,
  });

  if (sendResult.error && sendResult.recipients.length === 0) {
    return { ok: false, error: sendResult.error };
  }

  // Upsert sent_at for each re-sent recipient
  if (sendResult.recipients.length > 0) {
    const rows = sendResult.recipients.map((r) => ({
      update_id: updateId,
      email: r.email,
      sent_at: new Date().toISOString(),
      resend_message_id: r.resendMessageId,
    }));
    await supabase
      .from("investor_update_recipients")
      .upsert(rows, { onConflict: "update_id,email" });
  }

  revalidatePath(`/investor-updates/${updateId}`);
  return { ok: true };
}

export async function deleteInvestorUpdate(
  updateId: string,
  roundId: string,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const workspace = await getActiveWorkspace();
  if (!workspace) return;

  await supabase
    .from("investor_updates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", updateId)
    .eq("workspace_id", workspace.id);

  redirect(`/rounds/${roundId}`);
}
