"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logAudit } from "@/lib/audit/log";
import { Dec } from "@/lib/cap-table/decimal";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace/active";

const PoolSchema = z.object({
  total_pool_shares: z
    .string()
    .min(1)
    .refine((s) => {
      try {
        const d = new Dec(s);
        return d.isInt() && d.gt(0);
      } catch {
        return false;
      }
    }, "must be a positive integer"),
  strike_price_reference_sar: z.string().optional().or(z.literal("")),
});

const GrantSchema = z.object({
  employee_name: z.string().min(1).max(200),
  employee_email: z.string().email(),
  department: z.enum([
    "engineering", "product", "sales", "operations",
    "design", "legal", "finance", "other",
  ]),
  options_count: z.string().min(1),
  strike_price_sar: z.string().min(1),
  grant_date: z.string().min(1),
  vesting_type: z.enum(["immediate", "graded"]),
  vesting_start_date: z.string().optional().or(z.literal("")),
  vesting_end_date: z.string().optional().or(z.literal("")),
  cliff_months: z.string().optional().or(z.literal("")),
  vesting_frequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function createPool(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const parsed = PoolSchema.safeParse({
    total_pool_shares: String(formData.get("total_pool_shares") ?? ""),
    strike_price_reference_sar: String(formData.get("strike_price_reference_sar") ?? ""),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`).join("; "),
    };
  }

  const strikeRef = parsed.data.strike_price_reference_sar
    ? new Dec(parsed.data.strike_price_reference_sar as string).toFixed(2)
    : null;

  const { error } = await supabase.from("esop_pools").insert({
    workspace_id: workspace.id,
    total_pool_shares: parsed.data.total_pool_shares,
    strike_price_reference_sar: strikeRef,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "esop_pool_create",
    description: `Created ESOP pool of ${parsed.data.total_pool_shares} options`,
  });

  revalidatePath("/esop");
  redirect("/esop");
}

export async function addGrant(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const workspace = await getActiveWorkspace();
  if (!workspace) return { ok: false, error: "No workspace found." };

  const { data: pool } = await supabase
    .from("esop_pools")
    .select("id, total_pool_shares")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (!pool) return { ok: false, error: "Create the ESOP pool first." };

  const parsed = GrantSchema.safeParse({
    employee_name: formData.get("employee_name"),
    employee_email: formData.get("employee_email"),
    department: formData.get("department"),
    options_count: formData.get("options_count"),
    strike_price_sar: formData.get("strike_price_sar"),
    grant_date: formData.get("grant_date"),
    vesting_type: formData.get("vesting_type"),
    vesting_start_date: formData.get("vesting_start_date") ?? "",
    vesting_end_date: formData.get("vesting_end_date") ?? "",
    cliff_months: formData.get("cliff_months") ?? "0",
    vesting_frequency: formData.get("vesting_frequency") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`).join("; "),
    };
  }

  // Validate numerical fields with decimal.js for precision.
  let optionsDec: InstanceType<typeof Dec>;
  let strikeDec: InstanceType<typeof Dec>;
  try {
    optionsDec = new Dec(parsed.data.options_count);
    strikeDec = new Dec(parsed.data.strike_price_sar);
  } catch {
    return { ok: false, error: "Invalid number in options or strike price." };
  }
  if (!optionsDec.isInt() || optionsDec.lte(0)) {
    return { ok: false, error: "options_count must be a positive integer." };
  }
  if (strikeDec.lte(0)) {
    return { ok: false, error: "strike_price_sar must be > 0." };
  }

  // Pool capacity check — sum existing grants and ensure new grant fits.
  const { data: existing } = await supabase
    .from("esop_grants")
    .select("options_count")
    .eq("pool_id", pool.id)
    .is("deleted_at", null);
  let allocated = new Dec(0);
  for (const g of existing ?? []) {
    allocated = allocated.plus(new Dec(g.options_count));
  }
  const poolSize = new Dec(pool.total_pool_shares);
  const available = poolSize.minus(allocated);
  if (optionsDec.gt(available)) {
    return {
      ok: false,
      error: `Grant of ${optionsDec.toFixed(0)} exceeds available pool (${available.toFixed(0)}). Expand the pool first.`,
    };
  }

  // Graded vesting must have start/end dates and end > start.
  if (parsed.data.vesting_type === "graded") {
    if (!parsed.data.vesting_start_date || !parsed.data.vesting_end_date) {
      return { ok: false, error: "Graded vesting requires start and end dates." };
    }
    if (parsed.data.vesting_start_date >= parsed.data.vesting_end_date) {
      return { ok: false, error: "Vesting end date must be after start date." };
    }
  }

  const cliffMonths = Number(parsed.data.cliff_months || "0");

  const { error } = await supabase.from("esop_grants").insert({
    pool_id: pool.id,
    workspace_id: workspace.id,
    employee_name: parsed.data.employee_name,
    employee_email: parsed.data.employee_email,
    department: parsed.data.department,
    options_count: optionsDec.toFixed(0),
    strike_price_sar: strikeDec.toFixed(2),
    grant_date: parsed.data.grant_date,
    vesting_type: parsed.data.vesting_type,
    vesting_start_date:
      parsed.data.vesting_type === "graded" ? (parsed.data.vesting_start_date as string) : null,
    vesting_end_date:
      parsed.data.vesting_type === "graded" ? (parsed.data.vesting_end_date as string) : null,
    cliff_months: cliffMonths,
    vesting_frequency:
      parsed.data.vesting_type === "graded" ? (parsed.data.vesting_frequency ?? null) : null,
  });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: workspace.id,
    entityType: "workspace",
    entityId: pool.id,
    action: "esop_grant_create",
    description: `Granted ${optionsDec.toFixed(0)} options to ${parsed.data.employee_name} (${parsed.data.department})`,
  });

  revalidatePath("/esop");
  redirect("/esop");
}

const EditGrantSchema = z.object({
  employee_name: z.string().min(1).max(200),
  employee_email: z.string().email(),
  department: z.enum([
    "engineering", "product", "sales", "operations",
    "design", "legal", "finance", "other",
  ]),
  strike_price_sar: z.string().min(1),
  vesting_start_date: z.string().optional().or(z.literal("")),
  vesting_end_date: z.string().optional().or(z.literal("")),
  cliff_months: z.string().optional().or(z.literal("")),
  vesting_frequency: z.enum(["monthly", "quarterly", "annual"]).optional(),
});

export async function editGrant(grantId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: grant } = await supabase
    .from("esop_grants")
    .select("workspace_id, vesting_type, status")
    .eq("id", grantId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!grant) return { ok: false, error: "Grant not found." };
  if (grant.status === "terminated") return { ok: false, error: "Cannot edit a terminated grant." };

  const parsed = EditGrantSchema.safeParse({
    employee_name: formData.get("employee_name"),
    employee_email: formData.get("employee_email"),
    department: formData.get("department"),
    strike_price_sar: formData.get("strike_price_sar"),
    vesting_start_date: formData.get("vesting_start_date") ?? "",
    vesting_end_date: formData.get("vesting_end_date") ?? "",
    cliff_months: formData.get("cliff_months") ?? "0",
    vesting_frequency: formData.get("vesting_frequency") || undefined,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => `${i.path.map(String).join(".")}: ${i.message}`).join("; "),
    };
  }

  let strikeDec: InstanceType<typeof Dec>;
  try {
    strikeDec = new Dec(parsed.data.strike_price_sar);
  } catch {
    return { ok: false, error: "Invalid strike price." };
  }
  if (strikeDec.lte(0)) return { ok: false, error: "Strike price must be > 0." };

  if (grant.vesting_type === "graded") {
    if (!parsed.data.vesting_start_date || !parsed.data.vesting_end_date) {
      return { ok: false, error: "Graded vesting requires start and end dates." };
    }
    if (parsed.data.vesting_start_date >= parsed.data.vesting_end_date) {
      return { ok: false, error: "Vesting end date must be after start date." };
    }
  }

  const { error } = await supabase
    .from("esop_grants")
    .update({
      employee_name: parsed.data.employee_name,
      employee_email: parsed.data.employee_email,
      department: parsed.data.department,
      strike_price_sar: strikeDec.toFixed(2),
      vesting_start_date:
        grant.vesting_type === "graded" ? (parsed.data.vesting_start_date ?? null) : undefined,
      vesting_end_date:
        grant.vesting_type === "graded" ? (parsed.data.vesting_end_date ?? null) : undefined,
      cliff_months: Number(parsed.data.cliff_months || "0"),
      vesting_frequency:
        grant.vesting_type === "graded" ? (parsed.data.vesting_frequency ?? null) : undefined,
    })
    .eq("id", grantId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: grant.workspace_id,
    entityType: "workspace",
    entityId: grantId,
    action: "esop_grant_edit",
    description: `Updated ESOP grant for ${parsed.data.employee_name}`,
  });

  revalidatePath("/esop");
  redirect("/esop");
}

export async function terminateGrant(grantId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: grant } = await supabase
    .from("esop_grants")
    .select("workspace_id, employee_name")
    .eq("id", grantId)
    .maybeSingle();
  if (!grant) return { ok: false, error: "Grant not found." };

  const { error } = await supabase
    .from("esop_grants")
    .update({ status: "terminated", deleted_at: new Date().toISOString() })
    .eq("id", grantId);
  if (error) return { ok: false, error: error.message };

  await logAudit({
    workspaceId: grant.workspace_id,
    entityType: "workspace",
    entityId: grantId,
    action: "esop_grant_terminate",
    description: `Terminated ESOP grant for ${grant.employee_name}`,
  });

  revalidatePath("/esop");
  return { ok: true };
}
