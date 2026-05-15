"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";

const WorkspaceSchema = z
  .object({
    name: z.string().min(1).max(80),
    one_liner: z.string().min(1).max(140),
    entity_status: z.enum(["incorporated", "product_only"]),
    legal_entity: z.string().optional().nullable(),
    country: z.string().min(1),
    city: z.string().min(1),
    sector: z.string().min(1),
    funding_stage: z.string().min(1),
    founded_year: z.number().int().min(1900).max(2100).optional().nullable(),
    website_url: z.string().optional().nullable(),
  })
  .refine(
    (v) => v.entity_status === "product_only" || !!v.legal_entity,
    { message: "legal_entity is required when entity_status is 'incorporated'", path: ["legal_entity"] },
  )
  .refine(
    (v) => v.entity_status === "product_only" || !!v.founded_year,
    { message: "founded_year is required when entity_status is 'incorporated'", path: ["founded_year"] },
  );

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createWorkspace(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  const raw = {
    name: String(formData.get("name") ?? ""),
    one_liner: String(formData.get("one_liner") ?? ""),
    entity_status: String(formData.get("entity_status") ?? "") as
      | "incorporated"
      | "product_only",
    legal_entity: (formData.get("legal_entity") as string) || null,
    country: String(formData.get("country") ?? ""),
    city: String(formData.get("city") ?? ""),
    sector: String(formData.get("sector") ?? ""),
    funding_stage: String(formData.get("funding_stage") ?? ""),
    founded_year: formData.get("founded_year")
      ? Number(formData.get("founded_year"))
      : null,
    website_url: (formData.get("website_url") as string) || null,
  };

  const parsed = WorkspaceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  const { data: inserted, error } = await supabase
    .from("workspaces")
    .insert({
      ...parsed.data,
      owner_user_id: user.id,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Insert failed." };
  }

  // Generate slug from name + the row id's first 6 chars. Idempotent.
  const base = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const slug = `${base || "company"}-${inserted.id.slice(0, 6)}`;
  await supabase.from("workspaces").update({ slug }).eq("id", inserted.id);

  await logAudit({
    workspaceId: inserted.id,
    entityType: "workspace",
    entityId: inserted.id,
    action: "create",
    description: `Created workspace "${parsed.data.name}"`,
  });

  redirect("/cap-table");
}
