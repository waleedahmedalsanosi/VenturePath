"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

const Schema = z
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
    { message: "Required when incorporated", path: ["legal_entity"] },
  )
  .refine(
    (v) => v.entity_status === "product_only" || !!v.founded_year,
    { message: "Required when incorporated", path: ["founded_year"] },
  );

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateCompany(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

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

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues
        .map((i) => `${i.path.map(String).join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { error } = await supabase
    .from("workspaces")
    .update(parsed.data)
    .eq("id", workspace.id);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "update",
    description: `Updated company info`,
    payload: parsed.data,
  });

  revalidatePath("/company");
  revalidatePath(`/explore/${workspace.id}`);
  return { ok: true };
}
