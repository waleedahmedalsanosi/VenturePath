"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { Dec } from "@/lib/cap-table/decimal";
import { createClient } from "@/lib/supabase/server";

const DecimalString = z
  .string()
  .min(1)
  .refine((s) => {
    try {
      const d = new Dec(s);
      return d.isFinite() && !d.isNaN();
    } catch {
      return false;
    }
  }, "must be a valid number");

const PositiveDecimal = DecimalString.refine((s) => new Dec(s).gt(0), "must be > 0");

const OrdinaryDataSchema = z.object({
  shares: PositiveDecimal,
  price_per_share_sar: PositiveDecimal,
});

const ISafeDataSchema = z.object({
  investment_sar: PositiveDecimal,
  valuation_cap_sar: PositiveDecimal,
  profit_share_ratio: DecimalString.refine((s) => {
    const d = new Dec(s);
    return d.gte(0) && d.lte(100);
  }, "must be between 0 and 100"),
  conversion_status: z.enum(["unconverted", "converted"]).default("unconverted"),
});

const BaseSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().or(z.literal("")),
  entity_or_individual: z.enum(["individual", "entity"]),
  entry_date: z.string().min(1),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function addShareholder(formData: FormData): Promise<ActionResult> {
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

  const instrumentType = String(formData.get("instrument_type") ?? "");
  if (instrumentType !== "ordinary" && instrumentType !== "isafe") {
    return { ok: false, error: "Unsupported instrument_type." };
  }

  const baseParsed = BaseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    entity_or_individual: formData.get("entity_or_individual"),
    entry_date: formData.get("entry_date"),
  });
  if (!baseParsed.success) {
    return {
      ok: false,
      error: baseParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  const instrumentData = parseInstrumentData(formData, instrumentType);
  if (!("data" in instrumentData)) return instrumentData;

  const { error } = await supabase.from("shareholders").insert({
    workspace_id: workspace.id,
    name: baseParsed.data.name,
    email: baseParsed.data.email || null,
    entity_or_individual: baseParsed.data.entity_or_individual,
    entry_date: baseParsed.data.entry_date,
    instrument_type: instrumentType,
    instrument_data: instrumentData.data,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cap-table");
  redirect("/cap-table");
}

export async function editShareholder(
  shareholderId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Fetch existing row — RLS handles ownership; we also need instrument_type
  // to know which schema to validate against (PRD US-04-08: instrument type
  // is immutable after creation).
  const { data: existing } = await supabase
    .from("shareholders")
    .select("instrument_type, workspace_id")
    .eq("id", shareholderId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Shareholder not found." };

  const baseParsed = BaseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    entity_or_individual: formData.get("entity_or_individual"),
    entry_date: formData.get("entry_date"),
  });
  if (!baseParsed.success) {
    return {
      ok: false,
      error: baseParsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  const instrumentData = parseInstrumentData(formData, existing.instrument_type);
  if (!("data" in instrumentData)) return instrumentData;

  const { error } = await supabase
    .from("shareholders")
    .update({
      name: baseParsed.data.name,
      email: baseParsed.data.email || null,
      entity_or_individual: baseParsed.data.entity_or_individual,
      entry_date: baseParsed.data.entry_date,
      instrument_data: instrumentData.data,
    })
    .eq("id", shareholderId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cap-table");
  redirect("/cap-table");
}

export async function deleteShareholder(
  shareholderId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Soft delete (deleted_at = NOW()). Hard delete deferred for V1 audit story.
  const { error } = await supabase
    .from("shareholders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", shareholderId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/cap-table");
  return { ok: true };
}

// Shared instrument-data parser used by both add and edit.
function parseInstrumentData(
  formData: FormData,
  instrumentType: string,
): { data: Record<string, string> } | ActionResult {
  if (instrumentType === "ordinary") {
    const parsed = OrdinaryDataSchema.safeParse({
      shares: formData.get("shares"),
      price_per_share_sar: formData.get("price_per_share_sar"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      };
    }
    return { data: parsed.data };
  }

  if (instrumentType === "isafe") {
    const parsed = ISafeDataSchema.safeParse({
      investment_sar: formData.get("investment_sar"),
      valuation_cap_sar: formData.get("valuation_cap_sar"),
      profit_share_ratio: formData.get("profit_share_ratio"),
      conversion_status: "unconverted",
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      };
    }
    return { data: parsed.data };
  }

  return { ok: false, error: `Unsupported instrument_type: ${instrumentType}` };
}
